#!/usr/bin/env python3
"""
OpenClaw定时任务专用的股票分析系统
支持不同分析类型：morning, afternoon, evening, weekly
以及复盘类：reconcile、day_review；**post_close** 为二者连续执行（先复盘再汇总与自校准，供定时任务一次跑完）。
"""

import os
import sys
import time
import json
import subprocess
from datetime import datetime
from pathlib import Path

# 导入预测和总结引擎
sys.path.append(os.path.dirname(__file__))
from predict_then_summarize import StockAnalyzer
from data_providers import get_analysis_type_name


def _is_trading_day(dt: datetime) -> bool:
    """A 股交易日判断。

    周末直接返回 False；工作日用 akshare 交易日历校验（含节假日）。
    交易日历拉取失败时回退为 True（假定交易日），避免网络抖动阻塞运行。
    """
    if dt.weekday() >= 5:  # 5=周六, 6=周日
        return False
    try:
        import akshare as ak
        cal = ak.tool_trade_date_hist_sina()
        if cal is not None and "trade_date" in cal.columns:
            trade_dates = {str(d)[:10] for d in cal["trade_date"].tolist()}
            return dt.strftime("%Y-%m-%d") in trade_dates
    except Exception:
        pass
    return True


def _read_strategy_degraded_text(base_dir: str) -> str:
    """读取策略失效预警文本（若策略处于 degraded）。返回告警字符串，否则空串。"""
    status_path = Path(base_dir) / "data" / "strategy_status.json"
    if not status_path.exists():
        return ""
    try:
        st = json.loads(status_path.read_text(encoding="utf-8"))
    except Exception:
        return ""
    if st.get("status") != "degraded":
        return ""
    rates = st.get("recent_directional_hit_rates", [])
    return (
        f"\n⚠️⚠️ 策略失效预警 ⚠️⚠️\n"
        f"   连续 {st.get('window')} 个交易日方向性一致率 {rates} < {st.get('threshold')}\n"
        f"   近期策略疑似失效，早报信号参考价值低，建议观望/减仓。"
    )


def _maybe_warn_strategy_degraded(base_dir: str) -> str:
    """若策略处于 degraded，早盘打印醒目警告（不篡改保存信号，供复盘继续统计校准）。
    返回告警文本（供推送复用），无则空串。"""
    alert = _read_strategy_degraded_text(base_dir)
    if alert:
        print(alert)
    return alert


def _latest_report(base_dir: str, prefix: str, day: str):
    """找 reports/ 目录下当日最新 {prefix}_{day}_*.txt 报告路径。"""
    d = Path(base_dir) / "reports"
    if not d.exists():
        return None
    fs = sorted(d.glob(f"{prefix}_{day}_*.txt"))
    return fs[-1] if fs else None


def push_to_wecom(text: str, title: str = "") -> bool:
    """通过 openclaw gateway 推送文本到企微(thinkway)。

    针对唤醒补跑时 gateway 冷启动导致的 5s ack 超时：先 sleep 等网关就绪，
    失败按 0/5/10/20s 退避重试最多 4 次。文本超长按企微单条上限分片发送。
    """
    try:
        from llm_predictor import _find_openclaw_bin
    except Exception:
        print("⚠️ 无法导入 _find_openclaw_bin，跳过企微推送")
        return False
    bin_path = _find_openclaw_bin()
    if not bin_path:
        print("⚠️ 未找到 openclaw CLI，跳过企微推送")
        return False
    # openclaw 同目录 node 置顶 PATH，确保 shebang #!/usr/bin/env node 解析
    bin_dir = os.path.dirname(bin_path)
    env = dict(os.environ)
    env["PATH"] = bin_dir + os.pathsep + env.get("PATH", "")
    # 等待 gateway 冷启动（唤醒补跑场景，gateway 可能刚起）
    print("⏳ 等待 gateway 就绪(25s)...")
    time.sleep(25)
    full = (title + "\n\n" + text) if title else text
    # 企微单条文本上限约 2048 字节，按 1900 字符分片（中文安全）
    chunks = [full[i:i + 1900] for i in range(0, len(full), 1900)] or [full]
    ok_all = True
    backoff = [0, 5, 10, 20]
    for idx, chunk in enumerate(chunks):
        sent = False
        for attempt in range(4):
            if backoff[attempt]:
                time.sleep(backoff[attempt])
            try:
                r = subprocess.run(
                    [bin_path, "message", "send", "--channel", "wecom",
                     "--target", "thinkway", "--message", chunk],
                    env=env, capture_output=True, text=True, timeout=60,
                )
                if r.returncode == 0:
                    sent = True
                    print(f"✅ 企微推送成功(分片 {idx+1}/{len(chunks)})")
                    break
                print(f"⚠️ 企微推送失败(分片{idx+1} 尝试{attempt+1}): {r.stderr.strip()[:200]}")
            except Exception as e:
                print(f"⚠️ 企微推送异常(分片{idx+1} 尝试{attempt+1}): {e}")
        if not sent:
            ok_all = False
            print(f"❌ 企微推送最终失败(分片 {idx+1}/{len(chunks)})")
    return ok_all


def _record_push_status(base_dir: str, ok: bool) -> None:
    """记录推送成败到 data/push_status.json（跨运行累计连续失败，供早盘告警）。"""
    p = Path(base_dir) / "data" / "push_status.json"
    try:
        st = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    except Exception:
        st = {}
    iso = datetime.now().isoformat()
    if ok:
        st["consecutive_failures"] = 0
        st["last_success_at"] = iso
    else:
        st["consecutive_failures"] = int(st.get("consecutive_failures", 0)) + 1
        st["last_fail_at"] = iso
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def _warn_if_push_repeatedly_failing(base_dir: str) -> None:
    """若企微推送已连续多次失败，打印醒目告警（不阻断本次运行）。"""
    p = Path(base_dir) / "data" / "push_status.json"
    if not p.exists():
        return
    try:
        st = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return
    cf = int(st.get("consecutive_failures", 0))
    if cf >= 3:
        print(f"\n🚨 企微推送已连续 {cf} 次失败！请检查 openclaw gateway 是否在线"
              f"（curl -s -o /dev/null -w '%{{http_code}}' http://127.0.0.1:18789/）。"
              f"本次仍会尝试推送。")


def main():
    """主函数 - 支持命令行参数指定分析类型"""
    
    # 获取分析类型参数
    analysis_type = sys.argv[1] if len(sys.argv) > 1 else "evening"
    
    # 验证分析类型
    valid_types = [
        'morning',
        'afternoon',
        'evening',
        'weekly',
        'reconcile',
        'day_review',
        'post_close',
    ]
    if analysis_type not in valid_types:
        print(f"❌ 无效的分析类型: {analysis_type}")
        print(f"✅ 有效的类型: {', '.join(valid_types)}")
        return 1

    # 非交易日跳过：避免周末/节假日无效运行 + 噪音（reconcile 无早盘文件也会告警）
    now = datetime.now()
    if not _is_trading_day(now):
        print(f"📅 今日 {now.strftime('%Y-%m-%d')} 非交易日，跳过「{analysis_type}」分析。")
        return 0

    # 基础目录：环境变量优先，否则为本仓库内 stock_system 根目录
    base_dir = Path(
        os.environ.get(
            "STOCK_SYSTEM_ROOT",
            str(Path(__file__).resolve().parent.parent),
        )
    )

    if analysis_type == "reconcile":
        from daily_cycle_review import run_reconcile
        print(f"🚀 启动A股{get_analysis_type_name(analysis_type)}")
        print("=" * 70)
        print(f"系统时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        return run_reconcile(str(base_dir))

    if analysis_type == "post_close":
        from daily_cycle_review import run_reconcile, run_day_review

        print(f"🚀 启动A股{get_analysis_type_name(analysis_type)}")
        print("=" * 70)
        print(f"系统时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        print("\n── 1/2 收盘复盘（reconcile）──\n")
        rc_r = run_reconcile(str(base_dir))
        print("\n── 2/2 全日汇总与规则自校准（day_review）──\n")
        rc_d = run_day_review(str(base_dir))
        if rc_r != 0:
            print(f"\n⚠️ 复盘阶段退出码 {rc_r}（可能无早盘文件或拉价失败），仍已执行汇总。")
        if rc_d != 0:
            print(f"\n❌ 汇总阶段退出码 {rc_d}")
        # 推送收盘复盘+全日汇总到企微（脚本内自管等待+重试）
        day = now.strftime("%Y%m%d")
        report_path = _latest_report(str(base_dir), "day_review_report", day)
        review_text = ""
        if report_path:
            try:
                review_text = report_path.read_text(encoding="utf-8")
            except Exception:
                review_text = ""
        if not review_text:
            review_text = "(当日无汇总报告产出)"
        degraded_alert_pc = _read_strategy_degraded_text(str(base_dir))
        if degraded_alert_pc:
            review_text = degraded_alert_pc + "\n\n" + review_text
        _warn_if_push_repeatedly_failing(str(base_dir))
        ok = push_to_wecom(review_text, title=f"📊 A股收盘复盘与汇总 {day}")
        _record_push_status(str(base_dir), ok)
        # post_close 的核心产出是 day_review（汇总 + 自校准）。
        # reconcile 需要早盘文件，缺失属于警告场景，不应让定时任务失败。
        return rc_d

    if analysis_type == "day_review":
        from daily_cycle_review import run_day_review
        print(f"🚀 启动A股{get_analysis_type_name(analysis_type)}")
        print("=" * 70)
        print(f"系统时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        return run_day_review(str(base_dir))
    
    print(f"🚀 启动A股{get_analysis_type_name(analysis_type)}分析")
    print("=" * 70)
    print(f"系统时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"分析类型: {get_analysis_type_name(analysis_type)}")
    print("=" * 70)
    
    # 创建分析器
    analyzer = StockAnalyzer(str(base_dir))
    
    # 执行分析
    try:
        result = analyzer.analyze(analysis_type)

        # 策略失效预警：早盘给醒目警告（不篡改保存信号，供复盘继续统计）
        degraded_alert = _maybe_warn_strategy_degraded(str(base_dir))

        print("\n📊 分析结果:")
        print("=" * 70)
        print(result['summary_report'])
        
        print("\n💾 文件保存位置:")
        for file_type, file_path in result['saved_files'].items():
            print(f"  {file_type}: {file_path}")
        
        print(f"\n✅ {get_analysis_type_name(analysis_type)}分析完成！")
        
        # 返回简洁的结果摘要
        summary = result['summary']
        buy_count = len(summary.buy_recommendations)
        sell_count = len(summary.sell_recommendations)
        hold_count = len(summary.hold_recommendations)
        analyzed = len(result['predictions'])
        
        print(f"\n📈 结果摘要:")
        print(f"  买入推荐: {buy_count}只")
        print(f"  卖出推荐: {sell_count}只") 
        print(f"  持有推荐: {hold_count}只")
        print(f"  分析股票: {analyzed}只")
        
        # 全部个股行情拉取/分析均失败 → 本次分析失败（exit 1）
        if analyzed == 0:
            print("❌ 无可用预测（全部股票数据缺失），本次分析失败")
            return 1

        # 部分股票缺失 → 不视为成功，避免企微误报"成功"（exit 2）
        total = result.get('total_stocks', analyzed)
        if analyzed < total:
            print(f"⚠️ 部分股票数据缺失（{total - analyzed}/{total} 只未分析），本次视为部分失败")
            miss_text = (
                f"⚠️ 早盘部分失败：{total - analyzed}/{total} 只股票数据缺失，"
                f"早报未推送完整结果。请检查行情源(akshare/新浪)。"
            )
            if degraded_alert:
                miss_text = degraded_alert + "\n\n" + miss_text
            _warn_if_push_repeatedly_failing(str(base_dir))
            ok = push_to_wecom(miss_text, title=f"⚠️ A股早盘部分失败 {now.strftime('%Y-%m-%d')}")
            _record_push_status(str(base_dir), ok)
            return 2

        # 推送前检查：若企微已连续多次失败，打印告警（仍尝试本次推送）
        _warn_if_push_repeatedly_failing(str(base_dir))
        # 推送早报到企微（脚本内自管等待+重试，绕过框架 5s ack 超时）
        push_text = result['summary_report']
        if degraded_alert:
            push_text = degraded_alert + "\n\n" + push_text
        ok = push_to_wecom(push_text, title=f"📊 A股早盘分析 {now.strftime('%Y-%m-%d')}")
        _record_push_status(str(base_dir), ok)

        return 0
        
    except Exception as e:
        print(f"❌ 分析失败: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
回测：早盘信号真实盈亏（股神风控用）

目的：回答"这套早盘信号到底赚没赚钱"——不只看方向一致率，而是算真实 P&L。

方法：
  - 扫描 data/predictions_morning_*.json，每个交易日取最后一个完整预测(count>=20)
  - entry = 预测文件里的 current_price（系统锚定的昨收）
  - exit1 = 预测日 close（日内口径：昨收买→今日收盘）
  - exit2 = 预测日下一交易日 close（隔日口径：持有1日）
  - 历史行情：新浪日K线优先，腾讯兜底（零依赖 urllib）
  - regime：沪深300 当日涨跌（close/前收-1）分上涨/下跌市

信号 P&L 定义（可交易代理）：
  - 买入：pnl = return（做多）
  - 卖出：pnl = -return（回避下跌/做空）
  - 持有：pnl = 0（不动作，不计入方向命中分母）

用法：
  python3 refactored/backtest_signals.py
"""
import json
import os
import re
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "data")
FILE_RE = re.compile(r"predictions_morning_(\d{8})_(\d{6})\.json$")
_KCACHE = {}


def _sym(code: str) -> str:
    return ("sh" if code[0] in "69" else "sz") + code.zfill(6)


def _fetch_kline(code: str, need_days: int = 25):
    """返回 { 'YYYY-MM-DD': close(float) }，优先新浪，腾讯兜底。"""
    if code in _KCACHE:
        return _KCACHE[code]
    out = {}
    # 新浪
    try:
        sym = _sym(code)
        url = (f"https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/"
               f"CN_MarketData.getKLineData?symbol={sym}&scale=240&ma=5&datalen={need_days}")
        req = urllib.request.Request(url, headers={"Referer": "https://finance.sina.com.cn"})
        raw = urllib.request.urlopen(req, timeout=12).read().decode("gbk", "replace")
        for c in json.loads(raw):
            if c.get("day"):
                out[c["day"]] = float(c["close"])
        if out:
            _KCACHE[code] = out
            return out
    except Exception:
        pass
    # 腾讯兜底 [date, open, close, high, low, volume]
    try:
        sym = _sym(code)
        url = (f"https://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
               f"?param={sym},day,,,{need_days},qfq")
        req = urllib.request.Request(url, headers={"Referer": "https://finance.qq.com"})
        raw = urllib.request.urlopen(req, timeout=12).read().decode("utf-8", "replace")
        d = json.loads(raw)["data"][sym]
        node = d["qfqday"] if "qfqday" in d else d["day"]
        for c in node:
            out[c[0]] = float(c[2])
        if out:
            _KCACHE[code] = out
            return out
    except Exception:
        pass
    _KCACHE[code] = out
    return out


def _index_returns(need_days: int = 25):
    """沪深300 每日 return(close/前收-1)，返回 { 'YYYY-MM-DD': ret }。"""
    closes = {}
    try:
        sym = "sh000300"
        url = (f"https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/"
               f"CN_MarketData.getKLineData?symbol={sym}&scale=240&ma=5&datalen={need_days}")
        req = urllib.request.Request(url, headers={"Referer": "https://finance.sina.com.cn"})
        raw = urllib.request.urlopen(req, timeout=12).read().decode("gbk", "replace")
        for c in json.loads(raw):
            if c.get("day"):
                closes[c["day"]] = float(c["close"])
    except Exception:
        return {}
    days = sorted(closes.keys())
    out = {}
    for i, d in enumerate(days):
        if i > 0:
            out[d] = closes[d] / closes[days[i - 1]] - 1
    return out


def _load_daily_files():
    """返回 { 'YYYY-MM-DD': predictions_list }，每个交易日取最后一个完整预测。"""
    by_date = defaultdict(list)
    for fn in os.listdir(DATA_DIR):
        m = FILE_RE.match(fn)
        if not m:
            continue
        ymd, hms = m.group(1), m.group(2)
        try:
            with open(os.path.join(DATA_DIR, fn), encoding="utf-8") as f:
                doc = json.load(f)
        except Exception:
            continue
        preds = doc.get("predictions") or []
        if len(preds) < 20:
            continue  # 跳过开发期测试(count=5)
        day = f"{ymd[0:4]}-{ymd[4:6]}-{ymd[6:8]}"
        by_date[day].append((hms, preds))
    # 每个交易日取时间最晚的一个
    return {d: max(v, key=lambda x: x[0])[1] for d, v in by_date.items()}


def _agg(rows):
    buy = [r for r in rows if r["signal"] == "买入"]
    sell = [r for r in rows if r["signal"] == "卖出"]
    hold = [r for r in rows if r["signal"] == "持有"]

    def stats(g, sign_fn):
        if not g:
            return None
        rets = [r["ret"] for r in g]
        pnls = [sign_fn(r["ret"]) for r in g]
        wins = sum(1 for p in pnls if p > 0)
        return {
            "n": len(g),
            "mean_ret_pct": round(sum(rets) / len(rets) * 100, 2),
            "mean_pnl_pct": round(sum(pnls) / len(pnls) * 100, 2),
            "win_rate": round(wins / len(g) * 100, 1),
        }

    return {
        "buy": stats(buy, lambda x: x),
        "sell": stats(sell, lambda x: -x),
        "hold": {"n": len(hold)} if hold else None,
        "all_pnl_pct": round(
            sum((r["ret"] if r["signal"] == "买入" else (-r["ret"] if r["signal"] == "卖出" else 0))
                for r in rows) / len(rows) * 100, 2) if rows else None,
    }


def main():
    daily = _load_daily_files()
    if not daily:
        print("无完整预测文件可回测")
        return
    idx = _index_returns()
    print(f"回测交易日: {', '.join(sorted(daily.keys()))}  (共 {len(daily)} 天)\n")

    all_rows = []
    up_rows, down_rows = [], []
    per_day = {}
    for day in sorted(daily.keys()):
        preds = daily[day]
        klines = {}
        miss = 0
        rows = []
        for p in preds:
            code = p["stock"]["symbol"]
            entry = p.get("current_price")
            if not entry:
                miss += 1
                continue
            kl = klines.get(code) or _fetch_kline(code)
            klines[code] = kl
            if day not in kl:
                miss += 1
                continue
            close_d = kl[day]
            days = sorted(kl.keys())
            i = days.index(day)
            close_next = kl[days[i + 1]] if i + 1 < len(days) else None
            ret_intra = close_d / entry - 1
            ret_next = (close_next / entry - 1) if close_next else None
            rows.append({
                "day": day, "code": code, "name": p["stock"]["name"],
                "signal": p["signal"], "final_score": p.get("final_score"),
                "entry": entry, "close_d": close_d, "ret": ret_intra,
                "ret_next": ret_next,
            })
        all_rows.extend(rows)
        per_day[day] = _agg(rows)
        ir = idx.get(day)
        if ir is not None:
            (up_rows if ir > 0 else down_rows).extend(rows)
        pending = (day >= datetime.now().strftime("%Y-%m-%d"))
        note = "（当日未收盘，跳过回测）" if (not rows and pending) else ""
        print(f"【{day}】 沪深300={('+%.2f' % (ir*100))+'%' if ir is not None else 'NA'} | "
              f"样本={len(rows)} 缺数={miss}{note}")
        a = per_day[day]
        print(f"   买入 {a['buy']}")
        print(f"   卖出 {a['sell']}")
        print(f"   持有 {a['hold']}")
        print(f"   等权组合P&L(日内) = {a['all_pnl_pct']}%\n")

    print("=" * 60)
    print("【按信号分层 · 全样本】")
    tot = _agg(all_rows)
    print(f"  买入 {tot['buy']}")
    print(f"  卖出 {tot['sell']}")
    print(f"  持有 {tot['hold']}")
    print(f"  等权组合P&L(日内) = {tot['all_pnl_pct']}%  | 样本 {len(all_rows)}")

    print("\n【按大盘regime · 日内】")
    print(f"  上涨市({len(up_rows)}): ", _agg(up_rows))
    print(f"  下跌市({len(down_rows)}): ", _agg(down_rows))

    # 隔日口径（仅对有 next close 的）
    next_rows = [r for r in all_rows if r["ret_next"] is not None]
    if next_rows:
        for r in next_rows:
            r["ret"] = r["ret_next"]
        print("\n【隔日口径(持有至下一交易日收盘) · 全样本】")
        tn = _agg(next_rows)
        print(f"  买入 {tn['buy']}")
        print(f"  卖出 {tn['sell']}")
        print(f"  等权组合P&L(隔日) = {tn['all_pnl_pct']}%  | 样本 {len(next_rows)}")
        print(f"  上涨市: ", _agg([r for r in next_rows if (idx.get(r['day']) or 0) > 0]))
        print(f"  下跌市: ", _agg([r for r in next_rows if (idx.get(r['day']) or 0) <= 0]))

    # 落盘
    out = {
        "days": sorted(daily.keys()),
        "per_day": per_day,
        "overall": tot,
        "by_regime_intraday": {"up": _agg(up_rows), "down": _agg(down_rows)},
    }
    with open(os.path.join(DATA_DIR, "backtest_report.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("\n已写 data/backtest_report.json")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
OpenClaw定时任务专用的股票分析系统
支持不同分析类型：morning, afternoon, evening, weekly
以及复盘类：reconcile、day_review；**post_close** 为二者连续执行（先复盘再汇总与自校准，供定时任务一次跑完）。
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# 导入预测和总结引擎
sys.path.append(os.path.dirname(__file__))
from predict_then_summarize import StockAnalyzer
from data_providers import get_analysis_type_name

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
            return 2

        return 0
        
    except Exception as e:
        print(f"❌ 分析失败: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
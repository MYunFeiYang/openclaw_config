#!/usr/bin/env python3
"""
OpenClaw定时任务专用的股票分析系统
支持不同分析类型：morning, afternoon, evening, weekly
以及复盘类：reconcile（早盘预测 vs 收盘后再拉价）、day_review（当日各档落盘汇总）。
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

# 导入预测和总结引擎
sys.path.append(os.path.dirname(__file__))
from predict_then_summarize import StockAnalyzer

def main():
    """主函数 - 支持命令行参数指定分析类型"""
    
    # 获取分析类型参数
    analysis_type = sys.argv[1] if len(sys.argv) > 1 else "evening"
    
    # 验证分析类型
    valid_types = ['morning', 'afternoon', 'evening', 'weekly', 'reconcile', 'day_review']
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
        
        print(f"\n📈 结果摘要:")
        print(f"  买入推荐: {buy_count}只")
        print(f"  卖出推荐: {sell_count}只") 
        print(f"  持有推荐: {hold_count}只")
        print(f"  分析股票: {len(result['predictions'])}只")
        
        return 0
        
    except Exception as e:
        print(f"❌ 分析失败: {e}")
        return 1

def get_analysis_type_name(analysis_type: str) -> str:
    """获取分析类型中文名称"""
    names = {
        'morning': '早盘',
        'afternoon': '午盘',
        'evening': '收盘',
        'weekly': '周度',
        'reconcile': '收盘复盘（对照早盘预测）',
        'day_review': '全日预测汇总',
    }
    return names.get(analysis_type, analysis_type)

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
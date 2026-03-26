#!/usr/bin/env python3
"""
OpenClaw定时任务专用的股票分析脚本
正确的"先预测再总结"流程
"""

import sys
import json
from pathlib import Path

# 导入正确的分析流程
sys.path.append('refactored')
from predict_then_summarize import StockAnalyzer as StockAnalysisManager

def main():
    """主函数 - 处理定时任务调用"""
    
    # 获取分析类型参数
    analysis_type = sys.argv[1] if len(sys.argv) > 1 else "evening"
    
    # 验证分析类型
    valid_types = ['morning', 'afternoon', 'evening', 'weekly']
    if analysis_type not in valid_types:
        print(f"❌ 无效的分析类型: {analysis_type}")
        print(f"✅ 有效的类型: {', '.join(valid_types)}")
        return 1
    
    # 创建分析管理器
    manager = StockAnalysisManager("/Users/thinkway/.openclaw/workspace/stock_system")
    
    # 执行完整的分析流程
    result = manager.analyze(analysis_type)
    
    if result['success']:
        # 输出简洁的结果摘要（用于推送）
        summary = result['summary']
        buy_count = len(summary.buy_recommendations)
        sell_count = len(summary.sell_recommendations)
        hold_count = len(summary.hold_recommendations)
        market_sentiment = "中性"
        
        print(f"A股{get_analysis_type_name(analysis_type)}分析完成。")
        print(f"市场情绪{market_sentiment}，买入{buy_count}只，卖出{sell_count}只，持有{hold_count}只。")
        
        # 如果有买入推荐，显示前两只
        if buy_count > 0:
            top_buys = summary.buy_recommendations[:2]
            buy_stocks = [f"{r.stock.name}({r.stock.symbol})" for r in top_buys]
            print(f"买入推荐: {', '.join(buy_stocks)}")
        
        # 如果有卖出推荐，显示前两只
        if sell_count > 0:
            top_sells = summary.sell_recommendations[:2]
            sell_stocks = [f"{r.stock.name}({r.stock.symbol})" for r in top_sells]
            print(f"卖出推荐: {', '.join(sell_stocks)}")
        
        return 0
    else:
        print(f"❌ 分析失败: {result.get('error', '未知错误')}")
        return 1

def get_analysis_type_name(analysis_type: str) -> str:
    """获取分析类型中文名称"""
    names = {
        'morning': '早盘',
        'afternoon': '午盘',
        'evening': '收盘',
        'weekly': '周度'
    }
    return names.get(analysis_type, analysis_type)

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
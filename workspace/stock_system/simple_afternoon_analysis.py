#!/usr/bin/env python3
"""
Simple A-share afternoon analysis script
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'refactored'))

from predict_then_summarize import StockAnalyzer, ConfigManager, PredictionEngine, SummaryEngine
from datetime import datetime

def main():
    print('🚀 启动A股午盘分析')
    print('=' * 70)
    print(f'系统时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('=' * 70)
    
    # Get stocks but limit to first 5 for speed
    stocks = ConfigManager.get_core_stocks()[:5]
    print(f'分析股票数量: {len(stocks)}')
    for i, stock in enumerate(stocks):
        print(f'  {i+1}. {stock.name} ({stock.symbol})')
    
    # Execute analysis
    try:
        # Step 1: Generate predictions
        print('\n📊 第一步: 生成个股预测...')
        engine = PredictionEngine()
        predictions = []
        
        for i, stock in enumerate(stocks):
            print(f'  分析 {stock.name}...', end='', flush=True)
            pred = engine.predict_stock(stock)
            predictions.append(pred)
            print(f' 评分: {pred.final_score}/10, 信号: {pred.signal}')
        
        print(f'✅ 预测完成，共{len(predictions)}只股票')
        
        # Step 2: Generate summary
        print('\n📋 第二步: 生成总结报告...')
        summary_engine = SummaryEngine()
        summary = summary_engine.generate_summary(predictions, 'afternoon')
        
        print('✅ 总结报告生成完成')
        
        # Display results
        buy_count = len(summary.buy_recommendations)
        sell_count = len(summary.sell_recommendations)
        hold_count = len(summary.hold_recommendations)
        
        print(f'\n📈 结果摘要:')
        print(f'  买入推荐: {buy_count}只')
        print(f'  卖出推荐: {sell_count}只') 
        print(f'  持有推荐: {hold_count}只')
        print(f'  分析股票: {len(predictions)}只')
        
        # Display specific recommendations
        if summary.buy_recommendations:
            print(f'\n【买入推荐】')
            for i, rec in enumerate(summary.buy_recommendations, 1):
                print(f'  {i}. {rec.stock.name} ({rec.stock.symbol}) - 评分:{rec.final_score}')
        
        if summary.sell_recommendations:
            print(f'\n【卖出推荐】')
            for i, rec in enumerate(summary.sell_recommendations, 1):
                print(f'  {i}. {rec.stock.name} ({rec.stock.symbol}) - 评分:{rec.final_score}')
        
        if summary.hold_recommendations:
            print(f'\n【持有推荐】')
            for i, rec in enumerate(summary.hold_recommendations, 1):
                print(f'  {i}. {rec.stock.name} ({rec.stock.symbol}) - 评分:{rec.final_score}')
        
        # Market overview
        print(f'\n【市场概况】')
        market = summary.market_overview
        print(f'  总股票数: {market["total_stocks"]}')
        print(f'  市场情绪: {market["market_sentiment"]}')
        
        # Sector analysis
        if summary.sector_analysis:
            print(f'\n【行业分析】')
            for sector, data in summary.sector_analysis.items():
                print(f'  {sector}: 平均评分{data["avg_score"]} ({data["trend"]}, {data["stock_count"]}只股票)')
        
        # Risk alerts
        if summary.risk_alerts:
            print(f'\n【风险提示】')
            for i, alert in enumerate(summary.risk_alerts, 1):
                print(f'  {i}. {alert}')
        
        # Next actions
        if summary.next_actions:
            print(f'\n【下一步行动】')
            for i, action in enumerate(summary.next_actions, 1):
                print(f'  {i}. {action}')
        
        print('\n✅ 午盘分析完成！')
        
    except Exception as e:
        print(f'❌ 分析失败: {e}')
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
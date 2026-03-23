#!/usr/bin/env python3
"""
清晰版本的股票分析演示
"""

import random
from datetime import datetime

def clean_stock_analysis():
    """清晰的股票分析演示"""
    
    print("📈 股票分析报告")
    print("=" * 50)
    print(f"分析时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)
    
    # 模拟股票数据
    stocks = [
        {'symbol': 'AAPL', 'name': '苹果', 'base_price': 180.0},
        {'symbol': 'MSFT', 'name': '微软', 'base_price': 380.0},
        {'symbol': 'NVDA', 'name': '英伟达', 'base_price': 850.0},
        {'symbol': 'GOOGL', 'name': '谷歌', 'base_price': 140.0},
        {'symbol': 'TSLA', 'name': '特斯拉', 'base_price': 250.0},
    ]
    
    buy_recommendations = []
    hold_recommendations = []
    sell_recommendations = []
    
    for stock in stocks:
        # 模拟价格波动 (-3% 到 +3%)
        change = random.uniform(-0.03, 0.03)
        current_price = stock['base_price'] * (1 + change)
        change_percent = change * 100
        
        # 模拟RSI (20-80)
        rsi = random.randint(20, 80)
        
        # 模拟成交量 (相对前一天的变化)
        volume_change = random.uniform(-0.2, 0.3)
        
        # 生成建议逻辑
        if rsi < 30 and change_percent < -1:
            recommendation = "🟢 买入"
            reason = "超卖反弹机会"
            buy_recommendations.append(stock['name'])
        elif rsi > 70 and change_percent > 2:
            recommendation = "🔴 谨慎"
            reason = "超买风险"
            sell_recommendations.append(stock['name'])
        elif change_percent < -2:
            recommendation = "🟡 关注"
            reason = "短期超跌"
            hold_recommendations.append(stock['name'])
        elif change_percent > 3:
            recommendation = "🟡 观望"
            reason = "涨幅较大"
            hold_recommendations.append(stock['name'])
        else:
            recommendation = "🟡 持有"
            reason = "正常波动"
            hold_recommendations.append(stock['name'])
        
        # 输出个股分析
        print(f"\n📊 {stock['name']} ({stock['symbol']})")
        print("-" * 30)
        print(f"💰 当前价格: ${current_price:.2f}")
        print(f"📈 日涨跌: {change_percent:+.2f}%")
        print(f"📊 RSI指标: {rsi}")
        print(f"🎯 投资建议: {recommendation}")
        print(f"💡 理由: {reason}")
    
    # 总结建议
    print(f"\n📋 操作总结")
    print("=" * 50)
    
    if buy_recommendations:
        print(f"🟢 建议买入: {', '.join(buy_recommendations)}")
    
    if hold_recommendations:
        print(f"🟡 建议持有: {', '.join(hold_recommendations)}")
        
    if sell_recommendations:
        print(f"🔴 建议观望: {', '.join(sell_recommendations)}")
    
    print(f"\n📈 市场概况")
    print("-" * 30)
    total = len(stocks)
    print(f"分析股票总数: {total}")
    print(f"买入建议: {len(buy_recommendations)} ({len(buy_recommendations)/total*100:.0f}%)")
    print(f"持有建议: {len(hold_recommendations)} ({len(hold_recommendations)/total*100:.0f}%)")
    print(f"观望建议: {len(sell_recommendations)} ({len(sell_recommendations)/total*100:.0f}%)")
    
    print(f"\n⚠️  重要提醒")
    print("-" * 30)
    print("• 以上分析仅供参考，不构成投资建议")
    print("• 投资有风险，入市需谨慎")
    print("• 请结合个人风险承受能力做出决策")
    print("• 建议咨询专业投资顾问")

if __name__ == "__main__":
    clean_stock_analysis()
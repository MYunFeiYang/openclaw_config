#!/usr/bin/env python3
"""
简化版股票分析 - 适合定时任务
直接输出结果，便于消息推送
"""

import json
import random
from datetime import datetime, timedelta

def quick_stock_analysis():
    """快速股票分析"""
    
    # 股票池
    stocks = [
        ('AAPL', '苹果', 180.0),
        ('MSFT', '微软', 380.0), 
        ('NVDA', '英伟达', 850.0),
        ('GOOGL', '谷歌', 140.0),
        ('TSLA', '特斯拉', 250.0)
    ]
    
    recommendations = {
        'buy': [],
        'hold': [],
        'sell': []
    }
    
    print("📈 每日股票速览")
    print(f"⏰ {datetime.now().strftime('%m月%d日 %H:%M')}")
    print("=" * 30)
    
    for symbol, name, base_price in stocks:
        # 模拟当前价格
        change = random.uniform(-0.03, 0.03)
        current_price = base_price * (1 + change)
        change_percent = change * 100
        
        # 简单评分
        score = 0
        
        # 基于价格变动评分
        if change_percent < -2:
            score += 2  # 超跌反弹机会
        elif change_percent > 3:
            score -= 1  # 涨幅较大需谨慎
        else:
            score += 1
        
        # 基于RSI评分 (模拟)
        rsi = random.uniform(20, 80)
        if rsi < 30:
            score += 2
        elif rsi > 70:
            score -= 1
        
        # 生成建议
        if score >= 3:
            recommendation = "🟢 关注"
            recommendations['buy'].append((symbol, name, current_price, change_percent))
        elif score >= 0:
            recommendation = "🟡 持有"
            recommendations['hold'].append((symbol, name, current_price, change_percent))
        else:
            recommendation = "🔴 谨慎"
            recommendations['sell'].append((symbol, name, current_price, change_percent))
        
        print(f"{name} {symbol}")
        print(f"  价格: ${current_price:.1f} ({change_percent:+.1f}%)")
        print(f"  建议: {recommendation}")
        print()
    
    # 总结
    print("📋 操作建议")
    print("-" * 20)
    
    if recommendations['buy']:
        print("🟢 关注买入:")
        for symbol, name, price, change in recommendations['buy']:
            print(f"  • {name} ${price:.1f}")
    
    if recommendations['sell']:
        print("🔴 谨慎观望:")
        for symbol, name, price, change in recommendations['sell']:
            print(f"  • {name} ${price:.1f}")
    
    print("\n⚠️  风险提示: 以上分析仅供参考，不构成投资建议")
    
    return recommendations

if __name__ == "__main__":
    quick_stock_analysis()
#!/usr/bin/env python3
"""
企业微信兼容的股票分析演示
避免使用特殊字符和复杂格式
"""

import random
from datetime import datetime

def wechat_stock_analysis():
    """企业微信版本的股票分析"""
    
    # 企业微信兼容的格式
    print("【每日股票分析】")
    print(f"时间: {datetime.now().strftime('%m月%d日 %H:%M')}")
    print("=" * 30)
    
    # 模拟股票数据
    stocks = [
        {'symbol': 'AAPL', 'name': '苹果', 'base_price': 180.0},
        {'symbol': 'MSFT', 'name': '微软', 'base_price': 380.0},
        {'symbol': 'NVDA', 'name': '英伟达', 'base_price': 850.0},
        {'symbol': 'GOOGL', 'name': '谷歌', 'base_price': 140.0},
        {'symbol': 'TSLA', 'name': '特斯拉', 'base_price': 250.0},
    ]
    
    buy_list = []
    hold_list = []
    sell_list = []
    
    for stock in stocks:
        # 模拟价格波动 (-3% 到 +3%)
        change = random.uniform(-0.03, 0.03)
        current_price = stock['base_price'] * (1 + change)
        change_percent = change * 100
        
        # 模拟RSI (20-80)
        rsi = random.randint(20, 80)
        
        # 生成建议逻辑
        if rsi < 30 and change_percent < -1:
            recommendation = "买入"
            reason = "超卖反弹"
            buy_list.append(f"{stock['name']}({stock['symbol']})")
        elif rsi > 70 and change_percent > 2:
            recommendation = "观望"
            reason = "超买风险"
            sell_list.append(f"{stock['name']}({stock['symbol']})")
        elif change_percent < -2:
            recommendation = "关注"
            reason = "短期超跌"
            hold_list.append(f"{stock['name']}({stock['symbol']})")
        elif change_percent > 3:
            recommendation = "谨慎"
            reason = "涨幅较大"
            hold_list.append(f"{stock['name']}({stock['symbol']})")
        else:
            recommendation = "持有"
            reason = "正常波动"
            hold_list.append(f"{stock['name']}({stock['symbol']})")
        
        # 输出个股分析 (简化格式)
        print(f"\n{stock['name']} {stock['symbol']}")
        print(f"价格: ${current_price:.2f} ({change_percent:+.2f}%)")
        print(f"RSI: {rsi}")
        print(f"建议: {recommendation} ({reason})")
    
    # 总结建议 (更简洁)
    print(f"\n【操作总结】")
    print("-" * 20)
    
    if buy_list:
        print(f"买入: {', '.join(buy_list)}")
    
    if hold_list:
        print(f"持有: {', '.join(hold_list)}")
        
    if sell_list:
        print(f"观望: {', '.join(sell_list)}")
    
    print(f"\n【免责声明】")
    print("以上分析仅供参考，不构成投资建议")
    print("投资有风险，请谨慎决策")

def ultra_simple_stock_report():
    """极简版本 - 适合企业微信"""
    
    stocks = [
        ('AAPL', '苹果', 180.0, -1.2),
        ('MSFT', '微软', 380.0, +0.8), 
        ('NVDA', '英伟达', 850.0, -2.1),
        ('GOOGL', '谷歌', 140.0, +1.5),
        ('TSLA', '特斯拉', 250.0, +2.3),
    ]
    
    print("股票日报")
    print(datetime.now().strftime('%m月%d日'))
    print("")
    
    for symbol, name, base_price, change in stocks:
        current_price = base_price * (1 + change/100)
        if change < -2:
            signal = "关注"
        elif change > +3:
            signal = "谨慎"
        else:
            signal = "持有"
        
        print(f"{name}: ${current_price:.1f} ({change:+.1f}%) {signal}")
    
    print("")
    print("仅供参考，风险自负")

if __name__ == "__main__":
    # 测试企业微信版本
    wechat_stock_analysis()
    
    print("\n" + "="*50 + "\n")
    
    # 测试极简版本
    ultra_simple_stock_report()
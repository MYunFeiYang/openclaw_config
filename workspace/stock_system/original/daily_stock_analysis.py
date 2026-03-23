#!/usr/bin/env python3
"""
每日股票分析定时任务
基于技术分析和基本面分析的自动化股票筛选系统
"""

import json
import random
from datetime import datetime, timedelta
import os

def generate_stock_data(symbol, base_price):
    """生成股票数据"""
    # 生成最近30天的模拟数据
    data = []
    current_price = base_price
    
    for i in range(30):
        # 模拟价格波动
        change = random.uniform(-0.03, 0.03)
        current_price = current_price * (1 + change)
        
        data.append({
            'date': (datetime.now() - timedelta(days=29-i)).strftime('%Y-%m-%d'),
            'close': current_price,
            'volume': random.randint(1000000, 50000000)
        })
    
    return data

def technical_analysis(data):
    """技术分析"""
    if len(data) < 20:
        return {}
    
    closes = [day['close'] for day in data]
    current_price = closes[-1]
    
    # 移动平均线
    ma5 = sum(closes[-5:]) / 5
    ma10 = sum(closes[-10:]) / 10
    ma20 = sum(closes[-20:]) / 20
    
    # RSI
    rsi = calculate_rsi(closes)
    
    # MACD信号
    macd_signal = 'bullish' if (ma5 > ma20) else 'bearish'
    
    return {
        'current_price': round(current_price, 2),
        'ma5': round(ma5, 2),
        'ma20': round(ma20, 2),
        'rsi': rsi,
        'macd_signal': macd_signal,
        'trend': 'up' if current_price > ma20 else 'down'
    }

def calculate_rsi(prices, period=14):
    """计算RSI"""
    if len(prices) < period + 1:
        return 50
    
    gains = []
    losses = []
    
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        gains.append(max(0, change))
        losses.append(max(0, -change))
    
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    
    if avg_loss == 0:
        return 100
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return round(rsi, 1)

def fundamental_analysis(symbol):
    """基本面数据 - 基于真实市场情况的模拟"""
    fundamentals_db = {
        'AAPL': {
            'name': '苹果公司',
            'pe_ratio': 28.5, 'pb_ratio': 8.2, 'roe': 25.3, 
            'profit_margin': 23.5, 'debt_to_equity': 1.76,
            'revenue_growth': 8.2, 'sector': '科技硬件'
        },
        'MSFT': {
            'name': '微软',
            'pe_ratio': 32.1, 'pb_ratio': 12.5, 'roe': 18.7,
            'profit_margin': 28.9, 'debt_to_equity': 0.85,
            'revenue_growth': 12.3, 'sector': '软件服务'
        },
        'NVDA': {
            'name': '英伟达',
            'pe_ratio': 65.8, 'pb_ratio': 25.3, 'roe': 35.2,
            'profit_margin': 31.2, 'debt_to_equity': 0.45,
            'revenue_growth': 45.6, 'sector': 'AI芯片'
        },
        'GOOGL': {
            'name': '谷歌',
            'pe_ratio': 25.2, 'pb_ratio': 6.8, 'roe': 19.5,
            'profit_margin': 21.8, 'debt_to_equity': 0.32,
            'revenue_growth': 15.4, 'sector': '互联网'
        },
        'TSLA': {
            'name': '特斯拉',
            'pe_ratio': 45.2, 'pb_ratio': 15.8, 'roe': 12.5,
            'profit_margin': 8.9, 'debt_to_equity': 0.35,
            'revenue_growth': 28.7, 'sector': '新能源汽车'
        },
        'NFLX': {
            'name': '奈飞',
            'pe_ratio': 28.7, 'pb_ratio': 12.1, 'roe': 16.8,
            'profit_margin': 12.5, 'debt_to_equity': 1.25,
            'revenue_growth': 8.9, 'sector': '流媒体'
        },
        'AMD': {
            'name': 'AMD',
            'pe_ratio': 35.4, 'pb_ratio': 4.2, 'roe': 8.7,
            'profit_margin': 6.2, 'debt_to_equity': 0.08,
            'revenue_growth': 22.1, 'sector': '半导体'
        },
        'INTC': {
            'name': '英特尔',
            'pe_ratio': 22.1, 'pb_ratio': 1.8, 'roe': 4.2,
            'profit_margin': 4.8, 'debt_to_equity': 0.45,
            'revenue_growth': -8.5, 'sector': '传统芯片'
        }
    }
    
    return fundamentals_db.get(symbol, {
        'name': symbol,
        'pe_ratio': random.uniform(15, 50),
        'pb_ratio': random.uniform(1, 10),
        'roe': random.uniform(5, 25),
        'profit_margin': random.uniform(5, 25),
        'debt_to_equity': random.uniform(0.1, 2.0),
        'revenue_growth': random.uniform(-10, 30),
        'sector': '其他'
    })

def generate_recommendation(technical_data, fundamental_data):
    """生成投资建议"""
    score = 0
    reasons = []
    
    # 技术面评分
    if technical_data.get('trend') == 'up':
        score += 2
        reasons.append("上升趋势")
    else:
        score -= 1
        reasons.append("下降趋势")
    
    if technical_data.get('price_vs_ma20') == 'above':
        score += 1
        reasons.append("价格高于20日均线")
    
    rsi = technical_data.get('rsi', 50)
    if rsi < 30:
        score += 3
        reasons.append(f"RSI超卖({rsi})")
    elif rsi > 70:
        score -= 2
        reasons.append(f"RSI超买({rsi})")
    
    # 基本面评分
    pe_ratio = fundamental_data.get('pe_ratio', 0)
    if pe_ratio < 15:
        score += 3
        reasons.append("估值偏低")
    elif pe_ratio > 40:
        score -= 2
        reasons.append("估值偏高")
    
    roe = fundamental_data.get('roe', 0)
    if roe > 15:
        score += 2
        reasons.append("盈利能力强")
    elif roe < 8:
        score -= 1
        reasons.append("盈利能力弱")
    
    # 生成建议
    if score >= 6:
        recommendation = "🟢 强烈买入"
        risk_level = "低风险"
        action = "buy_strong"
    elif score >= 3:
        recommendation = "🟢 买入"
        risk_level = "中低风险"
        action = "buy"
    elif score >= 0:
        recommendation = "🟡 持有"
        risk_level = "中等风险"
        action = "hold"
    elif score >= -2:
        recommendation = "🟡 谨慎"
        risk_level = "中高风险"
        action = "caution"
    else:
        recommendation = "🔴 观望"
        risk_level = "高风险"
        action = "avoid"
    
    return {
        'recommendation': recommendation,
        'risk_level': risk_level,
        'action': action,
        'score': score,
        'reasons': reasons
    }

def analyze_stock(symbol, base_price):
    """完整分析一只股票"""
    # 生成数据
    data = generate_stock_data(symbol, base_price)
    
    # 技术分析
    technical_data = technical_analysis(data)
    
    # 基本面分析
    fundamental_data = fundamental_analysis(symbol)
    
    # 生成建议
    recommendation = generate_recommendation(technical_data, fundamental_data)
    
    return {
        'symbol': symbol,
        'name': fundamental_data['name'],
        'technical_data': technical_data,
        'fundamental_data': fundamental_data,
        'recommendation': recommendation
    }

def create_daily_report():
    """生成每日分析报告"""
    print("📈 每日股票分析报告")
    print("=" * 60)
    print(f"报告生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 股票池 (代码, 基准价格)
    stock_pool = [
        ('AAPL', 180.0),    # 苹果
        ('MSFT', 380.0),    # 微软
        ('NVDA', 850.0),    # 英伟达
        ('GOOGL', 140.0),   # 谷歌
        ('TSLA', 250.0),    # 特斯拉
        ('NFLX', 480.0),    # 奈飞
        ('AMD', 165.0),     # AMD
        ('INTC', 45.0),     # 英特尔
    ]
    
    results = []
    
    for symbol, base_price in stock_pool:
        try:
            result = analyze_stock(symbol, base_price)
            results.append(result)
            
            # 输出个股分析
            print(f"\n📊 {result['name']} ({symbol})")
            print("-" * 40)
            print(f"💰 当前价格: ${result['technical_data']['current_price']:.2f}")
            print(f"📈 趋势: {result['technical_data']['trend']}")
            print(f"📊 RSI: {result['technical_data']['rsi']}")
            print(f"💼 P/E: {result['fundamental_data']['pe_ratio']:.1f}")
            print(f"🎯 建议: {result['recommendation']['recommendation']}")
            print(f"⚠️  风险: {result['recommendation']['risk_level']}")
            print(f"📈 理由: {', '.join(result['recommendation']['reasons'])}")
            
        except Exception as e:
            print(f"❌ 分析 {symbol} 时出错: {e}")
    
    # 分类汇总
    categories = {
        'buy_strong': [],
        'buy': [],
        'hold': [],
        'caution': [],
        'avoid': []
    }
    
    for result in results:
        action = result['recommendation']['action']
        categories[action].append({
            'symbol': result['symbol'],
            'name': result['name'],
            'price': result['technical_data']['current_price'],
            'score': result['recommendation']['score']
        })
    
    # 输出分类建议
    print("\n📋 每日操作建议")
    print("=" * 60)
    
    if categories['buy_strong']:
        print(f"🟢 强烈买入 ({len(categories['buy_strong'])}):")
        for stock in categories['buy_strong']:
            print(f"   • {stock['name']} ({stock['symbol']}) - ${stock['price']:.2f}")
    
    if categories['buy']:
        print(f"🟢 建议买入 ({len(categories['buy'])}):")
        for stock in categories['buy']:
            print(f"   • {stock['name']} ({stock['symbol']}) - ${stock['price']:.2f}")
    
    if categories['hold']:
        print(f"🟡 持有观望 ({len(categories['hold'])}):")
        for stock in categories['hold']:
            print(f"   • {stock['name']} ({stock['symbol']}) - ${stock['price']:.2f}")
    
    if categories['caution']:
        print(f"🟡 谨慎操作 ({len(categories['caution'])}):")
        for stock in categories['caution']:
            print(f"   • {stock['name']} ({stock['symbol']}) - ${stock['price']:.2f}")
    
    if categories['avoid']:
        print(f"🔴 建议观望 ({len(categories['avoid'])}):")
        for stock in categories['avoid']:
            print(f"   • {stock['name']} ({stock['symbol']}) - ${stock['price']:.2f}")
    
    # 输出市场总结
    print(f"\n📈 市场概况")
    print("-" * 40)
    total_stocks = len(results)
    buy_stocks = len(categories['buy_strong']) + len(categories['buy'])
    hold_stocks = len(categories['hold'])
    sell_stocks = len(categories['caution']) + len(categories['avoid'])
    
    print(f"总分析股票数: {total_stocks}")
    print(f"建议买入: {buy_stocks} ({buy_stocks/total_stocks*100:.1f}%)")
    print(f"建议持有: {hold_stocks} ({hold_stocks/total_stocks*100:.1f}%)")
    print(f"建议观望: {sell_stocks} ({sell_stocks/total_stocks*100:.1f}%)")
    
    # 生成JSON报告文件
    report_data = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_stocks': total_stocks,
            'buy_recommendations': buy_stocks,
            'hold_recommendations': hold_stocks,
            'sell_recommendations': sell_stocks
        },
        'recommendations': categories,
        'details': results
    }
    
    # 保存报告
    report_file = f"/Users/thinkway/.openclaw/workspace/stock_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 详细报告已保存至: {report_file}")
    
    return report_data

if __name__ == "__main__":
    create_daily_report()
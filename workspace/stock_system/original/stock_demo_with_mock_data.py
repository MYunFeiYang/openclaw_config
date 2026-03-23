#!/usr/bin/env python3
"""
股票分析演示 - 使用模拟数据展示分析框架
"""

import json
from datetime import datetime, timedelta
import random

def generate_mock_stock_data(symbol, base_price, volatility=0.02):
    """生成模拟股票数据"""
    data = []
    current_price = base_price
    
    # 生成最近30天的数据
    for i in range(30):
        date = datetime.now() - timedelta(days=29-i)
        
        # 模拟价格波动
        change = random.uniform(-volatility, volatility)
        current_price = current_price * (1 + change)
        
        # 生成当日OHLC
        open_price = current_price * random.uniform(0.99, 1.01)
        high = max(open_price, current_price) * random.uniform(1.00, 1.02)
        low = min(open_price, current_price) * random.uniform(0.98, 1.00)
        close = current_price
        volume = random.randint(1000000, 50000000)
        
        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'open': round(open_price, 2),
            'high': round(high, 2),
            'low': round(low, 2),
            'close': round(close, 2),
            'volume': volume
        })
    
    return data

def calculate_technical_indicators(data):
    """计算技术指标"""
    if len(data) < 20:
        return {}
    
    closes = [day['close'] for day in data]
    
    # 简单移动平均线
    ma5 = sum(closes[-5:]) / 5
    ma10 = sum(closes[-10:]) / 10
    ma20 = sum(closes[-20:]) / 20
    
    # 当前价格
    current_price = closes[-1]
    
    # 计算RSI (简化版)
    rsi = calculate_rsi(closes)
    
    # 计算MACD (简化版)
    macd_signal = calculate_macd(closes)
    
    return {
        'ma5': round(ma5, 2),
        'ma10': round(ma10, 2),
        'ma20': round(ma20, 2),
        'rsi': rsi,
        'macd_signal': macd_signal,
        'price_vs_ma5': 'above' if current_price > ma5 else 'below',
        'price_vs_ma20': 'above' if current_price > ma20 else 'below'
    }

def calculate_rsi(prices, period=14):
    """计算RSI指标"""
    if len(prices) < period + 1:
        return 50
    
    gains = []
    losses = []
    
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        if change > 0:
            gains.append(change)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(change))
    
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    
    if avg_loss == 0:
        return 100
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return round(rsi, 1)

def calculate_macd(prices):
    """简化版MACD计算"""
    if len(prices) < 26:
        return 'neutral'
    
    # 计算EMA12和EMA26 (简化)
    ema12 = sum(prices[-12:]) / 12
    ema26 = sum(prices[-26:]) / 26
    
    macd = ema12 - ema26
    
    if macd > 0:
        return 'bullish'
    else:
        return 'bearish'

def fundamental_analysis(symbol):
    """基本面分析 - 模拟数据"""
    # 基于股票代码生成合理的模拟基本面数据
    fundamentals = {
        'AAPL': {
            'pe_ratio': 28.5,
            'pb_ratio': 8.2,
            'roe': 25.3,
            'profit_margin': 23.5,
            'debt_to_equity': 1.76,
            'revenue_growth': 8.2,
            'sector': 'Technology',
            'market_cap': 3000000000000
        },
        'MSFT': {
            'pe_ratio': 32.1,
            'pb_ratio': 12.5,
            'roe': 18.7,
            'profit_margin': 28.9,
            'debt_to_equity': 0.85,
            'revenue_growth': 12.3,
            'sector': 'Technology',
            'market_cap': 2800000000000
        },
        'NVDA': {
            'pe_ratio': 65.8,
            'pb_ratio': 25.3,
            'roe': 35.2,
            'profit_margin': 31.2,
            'debt_to_equity': 0.45,
            'revenue_growth': 45.6,
            'sector': 'Technology',
            'market_cap': 1500000000000
        },
        'TSLA': {
            'pe_ratio': 45.2,
            'pb_ratio': 15.8,
            'roe': 12.5,
            'profit_margin': 8.9,
            'debt_to_equity': 0.35,
            'revenue_growth': 28.7,
            'sector': 'Automotive',
            'market_cap': 800000000000
        }
    }
    
    return fundamentals.get(symbol, {
        'pe_ratio': random.uniform(15, 40),
        'pb_ratio': random.uniform(2, 8),
        'roe': random.uniform(10, 25),
        'profit_margin': random.uniform(5, 25),
        'debt_to_equity': random.uniform(0.3, 2.0),
        'revenue_growth': random.uniform(5, 20),
        'sector': 'Unknown',
        'market_cap': random.uniform(100000000000, 2000000000000)
    })

def generate_investment_recommendation(technical_data, fundamental_data, recent_performance):
    """生成投资建议"""
    score = 0
    reasons = []
    
    # 技术面评分
    if technical_data:
        if technical_data.get('price_vs_ma20') == 'above':
            score += 2
            reasons.append("股价高于20日均线")
        else:
            score -= 1
            reasons.append("股价低于20日均线")
        
        rsi = technical_data.get('rsi', 50)
        if rsi < 30:
            score += 3
            reasons.append(f"RSI为{rsi}，超卖状态")
        elif rsi > 70:
            score -= 2
            reasons.append(f"RSI为{rsi}，超买状态")
        else:
            score += 1
            reasons.append(f"RSI为{rsi}，正常范围")
        
        if technical_data.get('macd_signal') == 'bullish':
            score += 2
            reasons.append("MACD显示多头信号")
        else:
            score -= 1
            reasons.append("MACD显示空头信号")
    
    # 基本面评分
    pe_ratio = fundamental_data.get('pe_ratio', 0)
    if pe_ratio < 15:
        score += 3
        reasons.append(f"P/E为{pe_ratio}，估值偏低")
    elif pe_ratio > 30:
        score -= 2
        reasons.append(f"P/E为{pe_ratio}，估值偏高")
    else:
        score += 1
        reasons.append(f"P/E为{pe_ratio}，估值合理")
    
    roe = fundamental_data.get('roe', 0)
    if roe > 20:
        score += 2
        reasons.append(f"ROE为{roe}%，盈利能力强")
    elif roe < 10:
        score -= 1
        reasons.append(f"ROE为{roe}%，盈利能力较弱")
    
    # 近期表现
    if recent_performance['change_percent'] < -5:
        score += 2
        reasons.append("近期跌幅较大，可能反弹")
    elif recent_performance['change_percent'] > 10:
        score -= 1
        reasons.append("近期涨幅较大，需要谨慎")
    
    # 生成建议
    if score >= 6:
        recommendation = "🟢 强烈买入"
        risk_level = "低风险"
    elif score >= 3:
        recommendation = "🟢 买入"
        risk_level = "中低风险"
    elif score >= 0:
        recommendation = "🟡 持有观望"
        risk_level = "中等风险"
    elif score >= -3:
        recommendation = "🟡 谨慎持有"
        risk_level = "中高风险"
    else:
        recommendation = "🔴 考虑卖出"
        risk_level = "高风险"
    
    return {
        'recommendation': recommendation,
        'risk_level': risk_level,
        'score': score,
        'reasons': reasons
    }

def analyze_stock(symbol, base_price):
    """完整分析一只股票"""
    print(f"\n📊 分析 {symbol}")
    print("-" * 40)
    
    # 生成模拟数据
    historical_data = generate_mock_stock_data(symbol, base_price)
    current_price = historical_data[-1]['close']
    previous_close = historical_data[-2]['close']
    change_percent = ((current_price - previous_close) / previous_close) * 100
    
    # 技术分析
    technical_data = calculate_technical_indicators(historical_data)
    
    # 基本面分析
    fundamental_data = fundamental_analysis(symbol)
    
    # 近期表现
    recent_performance = {
        'current_price': current_price,
        'change_percent': change_percent,
        'volume': historical_data[-1]['volume']
    }
    
    # 生成投资建议
    recommendation = generate_investment_recommendation(
        technical_data, fundamental_data, recent_performance
    )
    
    # 输出分析结果
    print(f"💰 当前价格: ${current_price:.2f}")
    print(f"📊 日涨跌: {change_percent:+.2f}%")
    print(f"📈 成交量: {recent_performance['volume']:,}")
    
    if technical_data:
        print(f"📉 技术指标:")
        print(f"   MA5: ${technical_data['ma5']:.2f}")
        print(f"   MA20: ${technical_data['ma20']:.2f}")
        print(f"   RSI: {technical_data['rsi']}")
        print(f"   MACD: {technical_data['macd_signal']}")
    
    print(f"💼 基本面:")
    print(f"   P/E: {fundamental_data['pe_ratio']:.1f}")
    print(f"   ROE: {fundamental_data['roe']:.1f}%")
    print(f"   利润率: {fundamental_data['profit_margin']:.1f}%")
    print(f"   行业: {fundamental_data['sector']}")
    
    print(f"🎯 投资建议: {recommendation['recommendation']}")
    print(f"⚠️  风险等级: {recommendation['risk_level']}")
    print(f"📈 分析理由:")
    for reason in recommendation['reasons']:
        print(f"   • {reason}")
    
    return {
        'symbol': symbol,
        'current_price': current_price,
        'change_percent': change_percent,
        'technical_data': technical_data,
        'fundamental_data': fundamental_data,
        'recommendation': recommendation
    }

def main():
    """主函数"""
    print("📈 智能股票分析系统")
    print("=" * 60)
    print(f"分析时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 分析股票列表 (代码, 基准价格)
    stocks_to_analyze = [
        ('AAPL', 180.0),    # 苹果
        ('MSFT', 380.0),    # 微软
        ('NVDA', 850.0),    # 英伟达
        ('TSLA', 250.0),    # 特斯拉
    ]
    
    results = []
    
    for symbol, base_price in stocks_to_analyze:
        try:
            result = analyze_stock(symbol, base_price)
            results.append(result)
        except Exception as e:
            print(f"❌ 分析 {symbol} 时出错: {e}")
    
    # 生成总结报告
    print("\n📋 投资组合建议")
    print("=" * 60)
    
    strong_buy = []
    buy = []
    hold = []
    sell = []
    
    for result in results:
        rec = result['recommendation']['recommendation']
        if '强烈买入' in rec:
            strong_buy.append(result['symbol'])
        elif '买入' in rec and '强烈' not in rec:
            buy.append(result['symbol'])
        elif '持有观望' in rec:
            hold.append(result['symbol'])
        elif '考虑卖出' in rec:
            sell.append(result['symbol'])
    
    print(f"🟢 强烈买入 ({len(strong_buy)}): {', '.join(strong_buy) if strong_buy else '无'}")
    print(f"🟢 建议买入 ({len(buy)}): {', '.join(buy) if buy else '无'}")
    print(f"🟡 持有观望 ({len(hold)}): {', '.join(hold) if hold else '无'}")
    print(f"🔴 考虑卖出 ({len(sell)}): {', '.join(sell) if sell else '无'}")
    
    print("\n💡 操作建议:")
    print("• 强烈买入: 技术面和基本面都较好，适合加仓")
    print("• 建议买入: 有一定机会，可适量参与")
    print("• 持有观望: 等待更好时机，保持现有仓位")
    print("• 考虑卖出: 风险较高，建议减仓或观望")
    
    print("\n⚠️  风险提示:")
    print("• 以上分析仅供参考，不构成投资建议")
    print("• 投资有风险，入市需谨慎")
    print("• 建议结合个人风险承受能力做出投资决策")
    
    return results

if __name__ == "__main__":
    results = main()
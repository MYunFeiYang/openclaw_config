#!/usr/bin/env python3
"""
股票分析演示脚本
基于现有工具的组合使用
"""

import json
import requests
from datetime import datetime, timedelta
import subprocess

def get_stock_data(symbol):
    """获取股票基础数据"""
    try:
        # 使用Yahoo Finance API获取数据
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {
            'range': '1mo',
            'interval': '1d'
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
            result = data['chart']['result'][0]
            meta = result['meta']
            timestamps = result['timestamp']
            indicators = result['indicators']['quote'][0]
            
            current_price = meta['regularMarketPrice']
            previous_close = meta['previousClose']
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100
            
            # 获取最近10天的数据
            recent_data = []
            for i in range(max(0, len(timestamps)-10), len(timestamps)):
                recent_data.append({
                    'date': datetime.fromtimestamp(timestamps[i]).strftime('%Y-%m-%d'),
                    'open': indicators['open'][i],
                    'high': indicators['high'][i],
                    'low': indicators['low'][i],
                    'close': indicators['close'][i],
                    'volume': indicators['volume'][i]
                })
            
            return {
                'symbol': symbol,
                'current_price': current_price,
                'change': change,
                'change_percent': change_percent,
                'market_cap': meta.get('marketCap', 0),
                'pe_ratio': None,  # 需要从其他接口获取
                'recent_data': recent_data
            }
    except Exception as e:
        print(f"获取{symbol}数据失败: {e}")
        return None

def analyze_stock_basic(data):
    """基础分析"""
    if not data:
        return None
    
    analysis = {
        'symbol': data['symbol'],
        'current_price': data['current_price'],
        'change_percent': data['change_percent'],
        'trend': '上涨' if data['change_percent'] > 0 else '下跌',
        'strength': '强势' if abs(data['change_percent']) > 2 else '平稳'
    }
    
    # 简单的技术指标分析
    recent_prices = [day['close'] for day in data['recent_data']]
    if len(recent_prices) >= 5:
        ma5 = sum(recent_prices[-5:]) / 5
        current_price = data['current_price']
        
        if current_price > ma5 * 1.02:
            analysis['ma_signal'] = '高于5日均线，短期强势'
        elif current_price < ma5 * 0.98:
            analysis['ma_signal'] = '低于5日均线，短期弱势'
        else:
            analysis['ma_signal'] = '围绕5日均线震荡'
    
    return analysis

def generate_recommendation(analysis):
    """生成买卖建议"""
    if not analysis:
        return "数据不足，无法分析"
    
    change_percent = analysis['change_percent']
    
    # 简单的买卖逻辑（仅作演示）
    if change_percent < -3:
        return "🔴 强烈关注 - 短期超跌，可能反弹"
    elif change_percent < -1:
        return "🟡 关注 - 适度下跌，观察机会"
    elif change_percent > 3:
        return "🟢 谨慎 - 短期涨幅较大，等待回调"
    elif change_percent > 1:
        return "🟢 观望 - 上涨趋势，但不宜追高"
    else:
        return "🟡 持币观望 - 震荡行情，等待方向"

def main():
    """主函数 - 分析演示"""
    print("📈 股票分析演示")
    print("=" * 50)
    
    # 测试股票列表
    symbols = [
        'AAPL',      # 苹果
        'MSFT',      # 微软  
        'NVDA',      # 英伟达
        'TSLA',      # 特斯拉
        '600519.SS', # 贵州茅台
        '000858.SZ', # 五粮液
        '0700.HK',   # 腾讯
        '3690.HK'    # 美团
    ]
    
    results = []
    
    for symbol in symbols:
        print(f"\n📊 分析 {symbol}...")
        
        data = get_stock_data(symbol)
        if data:
            analysis = analyze_stock_basic(data)
            recommendation = generate_recommendation(analysis)
            
            result = {
                'symbol': symbol,
                'analysis': analysis,
                'recommendation': recommendation
            }
            results.append(result)
            
            print(f"💰 当前价格: ${analysis['current_price']:.2f}")
            print(f"📊 涨跌幅: {analysis['change_percent']:.2f}%")
            print(f"📈 趋势: {analysis['trend']} | {analysis['strength']}")
            if 'ma_signal' in analysis:
                print(f"📉 均线信号: {analysis['ma_signal']}")
            print(f"🎯 建议: {recommendation}")
            print("-" * 40)
        else:
            print(f"❌ 无法获取 {symbol} 的数据")
    
    # 生成总结报告
    print("\n📋 分析总结")
    print("=" * 50)
    
    strong_buy = []
    buy = []
    sell = []
    
    for result in results:
        rec = result['recommendation']
        if '强烈关注' in rec:
            strong_buy.append(result['symbol'])
        elif '关注' in rec and '强烈' not in rec:
            buy.append(result['symbol'])
        elif '谨慎' in rec or '观望' in rec:
            sell.append(result['symbol'])
    
    print(f"🟢 强烈关注 ({len(strong_buy)}): {', '.join(strong_buy) if strong_buy else '无'}")
    print(f"🟡 适度关注 ({len(buy)}): {', '.join(buy) if buy else '无'}")
    print(f"🔴 谨慎观望 ({len(sell)}): {', '.join(sell) if sell else '无'}")
    
    return results

if __name__ == "__main__":
    main()
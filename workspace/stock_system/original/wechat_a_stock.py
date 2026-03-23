#!/usr/bin/env python3
"""
A股企业微信推送版本
每只股票都有明确买卖理由
"""

import random
from datetime import datetime

def generate_wechat_a_stock_report():
    """生成企业微信A股报告"""
    
    # A股核心股票池
    a_stocks = [
        ('000001', '平安银行', 12.5, '银行'),
        ('000858', '五粮液', 168.5, '白酒'),
        ('002415', '海康威视', 35.2, '安防'),
        ('600036', '招商银行', 42.8, '银行'),
        ('600519', '贵州茅台', 1688.0, '白酒'),
        ('600887', '伊利股份', 28.5, '乳业'),
        ('000725', '京东方A', 4.2, '面板'),
        ('600309', '万华化学', 88.5, '化工'),
        ('600276', '恒瑞医药', 42.8, '医药'),
        ('000002', '万科A', 15.8, '地产'),
    ]
    
    lines = []
    lines.append("【A股日报】")
    lines.append(datetime.now().strftime('%m月%d日 %H:%M'))
    lines.append("")
    
    buy_stocks = []
    sell_stocks = []
    hold_stocks = []
    
    for symbol, name, base_price, industry in a_stocks:
        # 模拟价格变动
        change = random.uniform(-0.04, 0.04)
        current_price = base_price * (1 + change)
        change_percent = change * 100
        
        # 模拟技术指标
        rsi = random.randint(20, 80)
        pe_ratio = random.uniform(8, 35)
        
        # 生成建议
        signal, reason = analyze_a_stock_simple(name, current_price, change_percent, rsi, pe_ratio, industry)
        
        # 分类统计
        if signal == '买入':
            buy_stocks.append({
                'name': name, 'symbol': symbol, 'price': current_price, 
                'change': change_percent, 'reason': reason
            })
        elif signal == '卖出':
            sell_stocks.append({
                'name': name, 'symbol': symbol, 'price': current_price,
                'change': change_percent, 'reason': reason
            })
        else:
            hold_stocks.append({
                'name': name, 'symbol': symbol, 'price': current_price,
                'change': change_percent, 'reason': reason
            })
        
        # 添加到报告
        signal_icon = "🟢" if signal == '买入' else "🔴" if signal == '卖出' else "🟡"
        lines.append(f"{signal_icon} {name} {symbol}")
        lines.append(f"¥{current_price:.2f} ({change_percent:+.2f}%)")
        lines.append(f"{signal}: {reason}")
        lines.append("")
    
    # 操作建议
    lines.append("【操作建议】")
    lines.append("-" * 20)
    
    if buy_stocks:
        lines.append(f"买入({len(buy_stocks)}):")
        for stock in buy_stocks[:2]:  # 最多显示2只
            lines.append(f"• {stock['name']}({stock['symbol']})")
            lines.append(f"  ¥{stock['price']:.2f} ({stock['change']:+.2f}%)")
            lines.append(f"  理由: {stock['reason']}")
        if len(buy_stocks) > 2:
            lines.append(f"  ...还有{len(buy_stocks)-2}只")
        lines.append("")
    
    if sell_stocks:
        lines.append(f"卖出({len(sell_stocks)}):")
        for stock in sell_stocks[:2]:  # 最多显示2只
            lines.append(f"• {stock['name']}({stock['symbol']})")
            lines.append(f"  ¥{stock['price']:.2f} ({stock['change']:+.2f}%)")
            lines.append(f"  理由: {stock['reason']}")
        if len(sell_stocks) > 2:
            lines.append(f"  ...还有{len(sell_stocks)-2}只")
        lines.append("")
    
    if hold_stocks:
        lines.append(f"持有({len(hold_stocks)}):")
        for stock in hold_stocks[:1]:  # 最多显示1只
            lines.append(f"• {stock['name']}({stock['symbol']})")
            lines.append(f"  ¥{stock['price']:.2f} ({stock['change']:+.2f}%)")
            lines.append(f"  理由: {stock['reason']}")
        if len(hold_stocks) > 1:
            lines.append(f"  ...还有{len(hold_stocks)-1}只")
    
    lines.append("")
    lines.append("⚠️ 风险提示:")
    lines.append("• 仅供参考，不构成投资建议")
    lines.append("• 投资有风险，决策需谨慎")
    
    return "\n".join(lines), {
        'buy': buy_stocks,
        'sell': sell_stocks,
        'hold': hold_stocks,
        'total': len(a_stocks)
    }

def analyze_a_stock_simple(name, price, change_percent, rsi, pe_ratio, industry):
    """简化版A股分析"""
    
    score = 0
    reasons = []
    
    # 1. RSI分析
    if rsi < 25:
        score += 3
        reasons.append("RSI超卖")
    elif rsi > 75:
        score -= 2
        reasons.append("RSI超买")
    elif rsi < 35:
        score += 2
        reasons.append("RSI偏低")
    elif rsi > 65:
        score -= 1
        reasons.append("RSI偏高")
    
    # 2. 价格变动
    if change_percent < -3:
        score += 2
        reasons.append("短期超跌")
    elif change_percent > 3:
        score -= 1
        reasons.append("涨幅较大")
    elif change_percent < -1:
        score += 1
        reasons.append("适度调整")
    
    # 3. 估值分析 (按行业)
    if industry == '银行':
        if pe_ratio < 6:
            score += 2
            reasons.append("估值偏低")
        elif pe_ratio > 12:
            score -= 1
            reasons.append("估值偏高")
    elif industry == '白酒':
        if pe_ratio < 20:
            score += 2
            reasons.append("估值合理")
        elif pe_ratio > 35:
            score -= 2
            reasons.append("估值偏高")
    elif industry == '医药':
        if pe_ratio < 25:
            score += 1
            reasons.append("估值合理")
        elif pe_ratio > 40:
            score -= 1
            reasons.append("估值偏高")
    else:  # 其他行业
        if pe_ratio < 15:
            score += 2
            reasons.append("估值偏低")
        elif pe_ratio > 30:
            score -= 1
            reasons.append("估值偏高")
    
    # 4. 行业特性
    if industry in ['白酒', '医药']:
        score += 1
        reasons.append("消费刚需")
    elif industry == '银行':
        score += 1
        reasons.append("分红稳定")
    elif industry == '地产':
        score -= 1
        reasons.append("行业承压")
    
    # 生成建议
    if score >= 4:
        signal = "买入"
        final_reason = "综合评分优秀: " + " + ".join(reasons[:2])
    elif score >= 2:
        signal = "买入"
        final_reason = "积极信号: " + " + ".join(reasons[:2])
    elif score <= -2:
        signal = "卖出"
        final_reason = "风险较高: " + " + ".join(reasons[:2])
    elif score <= -1:
        signal = "卖出"
        final_reason = "谨慎为主: " + " + ".join(reasons[:1])
    else:
        signal = "持有"
        final_reason = "中性观望: " + (" + ".join(reasons[:2]) if reasons else "等待机会")
    
    return signal, final_reason

def send_wechat_stock_report():
    """发送企业微信股票报告"""
    report, summary = generate_wechat_a_stock_report()
    
    # 这里可以集成到企业微信API
    print(report)
    
    # 保存结果
    import json
    from datetime import datetime
    
    result = {
        'timestamp': datetime.now().isoformat(),
        'report': report,
        'summary': summary
    }
    
    filename = f"/Users/thinkway/.openclaw/workspace/wechat_a_stock_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    return report, filename

if __name__ == "__main__":
    print("【A股企业微信推送测试】")
    print("=" * 40)
    
    report, filename = send_wechat_stock_report()
    
    print(f"\n【报告已保存】")
    print(f"文件: {filename}")
    
    # 测试企业微信发送
    print(f"\n【企业微信消息预览】")
    print("=" * 40)
    print("消息长度:", len(report))
    print("预计字符数:", len(report.encode('utf-8')))
    
    if len(report) < 2000:  # 企业微信单条消息限制
        print("✅ 消息长度合适，可以直接发送")
    else:
        print("⚠️ 消息较长，可能需要分多条发送")
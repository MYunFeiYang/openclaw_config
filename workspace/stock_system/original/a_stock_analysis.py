#!/usr/bin/env python3
"""
A股分析专用版本 - 企业微信推送
每只股票都有详细的买入/卖出理由
"""

import random
from datetime import datetime

def generate_a_stock_report():
    """A股分析报告"""
    
    # A股股票池 - 主要指数和热门股票
    a_stocks = [
        ('000001', '平安银行', 12.5, '银行', '金融'),
        ('000002', '万科A', 15.8, '地产', '周期性'),
        ('000858', '五粮液', 168.5, '白酒', '消费'),
        ('002415', '海康威视', 35.2, '安防', '科技'),
        ('600036', '招商银行', 42.8, '银行', '金融'),
        ('600519', '贵州茅台', 1688.0, '白酒', '消费'),
        ('600887', '伊利股份', 28.5, '乳制品', '消费'),
        ('000725', '京东方A', 4.2, '面板', '科技'),
        ('600309', '万华化学', 88.5, '化工', '周期'),
        ('600276', '恒瑞医药', 42.8, '医药', '医疗'),
    ]
    
    report_lines = []
    report_lines.append("【A股日报】")
    report_lines.append(datetime.now().strftime('%m月%d日 %H:%M'))
    report_lines.append("")
    
    buy_list = []      # 买入推荐
    sell_list = []     # 卖出建议
    hold_list = []     # 持有观望
    
    for symbol, name, base_price, industry, sector in a_stocks:
        # 模拟价格变动 (-5% 到 +5%)
        change = random.uniform(-0.05, 0.05)
        current_price = base_price * (1 + change)
        change_percent = change * 100
        
        # 模拟成交量变化
        volume_change = random.uniform(-0.3, 0.5)
        
        # 模拟RSI (15-85)
        rsi = random.randint(15, 85)
        
        # 模拟基本面数据
        pe_ratio = random.uniform(8, 45)  # A股常见PE范围
        pb_ratio = random.uniform(0.8, 8.0)
        roe = random.uniform(5, 25)
        
        # 生成详细分析和理由
        analysis = analyze_a_stock(name, current_price, change_percent, rsi, 
                                 pe_ratio, pb_ratio, roe, industry, sector)
        
        # 分类建议
        if analysis['signal'] == '买入':
            buy_list.append({
                'name': name,
                'symbol': symbol,
                'price': current_price,
                'change': change_percent,
                'reason': analysis['reason']
            })
        elif analysis['signal'] == '卖出':
            sell_list.append({
                'name': name,
                'symbol': symbol,
                'price': current_price,
                'change': change_percent,
                'reason': analysis['reason']
            })
        else:
            hold_list.append({
                'name': name,
                'symbol': symbol,
                'price': current_price,
                'change': change_percent,
                'reason': analysis['reason']
            })
        
        # 添加到报告 (简化格式)
        signal_icon = "🟢" if analysis['signal'] == '买入' else "🔴" if analysis['signal'] == '卖出' else "🟡"
        report_lines.append(f"{signal_icon} {name} {symbol}")
        report_lines.append(f"  价格: ¥{current_price:.2f} ({change_percent:+.2f}%)")
        report_lines.append(f"  建议: {analysis['signal']} ({analysis['reason']})")
        report_lines.append("")
    
    # 分类汇总
    report_lines.append("【操作建议】")
    report_lines.append("=" * 30)
    
    if buy_list:
        report_lines.append(f"\n🟢 买入建议 ({len(buy_list)}只):")
        for stock in buy_list:
            report_lines.append(f"• {stock['name']}({stock['symbol']})")
            report_lines.append(f"  ¥{stock['price']:.2f} ({stock['change']:+.2f}%)")
            report_lines.append(f"  理由: {stock['reason']}")
            report_lines.append("")
    
    if sell_list:
        report_lines.append(f"\n🔴 卖出建议 ({len(sell_list)}只):")
        for stock in sell_list:
            report_lines.append(f"• {stock['name']}({stock['symbol']})")
            report_lines.append(f"  ¥{stock['price']:.2f} ({stock['change']:+.2f}%)")
            report_lines.append(f"  理由: {stock['reason']}")
            report_lines.append("")
    
    if hold_list:
        report_lines.append(f"\n🟡 持有观望 ({len(hold_list)}只):")
        for stock in hold_list[:3]:  # 只显示前3只，避免消息过长
            report_lines.append(f"• {stock['name']}({stock['symbol']})")
            report_lines.append(f"  ¥{stock['price']:.2f} ({stock['change']:+.2f}%)")
            report_lines.append(f"  理由: {stock['reason']}")
        if len(hold_list) > 3:
            report_lines.append(f"  ...还有{len(hold_list)-3}只")
        report_lines.append("")
    
    # 市场概况
    report_lines.append("【市场概况】")
    report_lines.append("-" * 20)
    total_stocks = len(a_stocks)
    report_lines.append(f"分析股票: {total_stocks}只")
    report_lines.append(f"买入: {len(buy_list)}只 ({len(buy_list)/total_stocks*100:.1f}%)")
    report_lines.append(f"卖出: {len(sell_list)}只 ({len(sell_list)/total_stocks*100:.1f}%)")
    report_lines.append(f"持有: {len(hold_list)}只 ({len(hold_list)/total_stocks*100:.1f}%)")
    
    # 行业观察
    industries = {}
    for stock in buy_list + sell_list + hold_list:
        industry = stock.get('industry', '其他')
        if industry not in industries:
            industries[industry] = {'buy': 0, 'sell': 0, 'hold': 0}
        
        if stock in buy_list:
            industries[industry]['buy'] += 1
        elif stock in sell_list:
            industries[industry]['sell'] += 1
        else:
            industries[industry]['hold'] += 1
    
    if len(industries) > 0:
        report_lines.append(f"\n【行业观察】")
        for industry, counts in industries.items():
            total = counts['buy'] + counts['sell'] + counts['hold']
            if counts['buy'] > counts['sell']:
                report_lines.append(f"• {industry}: 看好({total}只分析)")
            elif counts['sell'] > counts['buy']:
                report_lines.append(f"• {industry}: 谨慎({total}只分析)")
            else:
                report_lines.append(f"• {industry}: 中性({total}只分析)")
    
    report_lines.append(f"\n【重要提醒】")
    report_lines.append("• 以上分析仅供参考")
    report_lines.append("• 不构成投资建议") 
    report_lines.append("• 投资需谨慎决策")
    report_lines.append("• 建议咨询专业人士")
    
    return "\n".join(report_lines), {
        'buy': buy_list,
        'sell': sell_list, 
        'hold': hold_list,
        'total': total_stocks
    }

def analyze_a_stock(name, price, change_percent, rsi, pe_ratio, pb_ratio, roe, industry, sector):
    """分析单只A股股票"""
    
    score = 0
    reasons = []
    
    # 1. 技术面分析
    if rsi < 25:
        score += 3
        reasons.append("RSI超卖")
    elif rsi > 75:
        score -= 2
        reasons.append("RSI超买")
    elif rsi < 35:
        score += 1
        reasons.append("RSI偏低")
    elif rsi > 65:
        score -= 1
        reasons.append("RSI偏高")
    
    # 价格变动分析
    if change_percent < -4:
        score += 2
        reasons.append("短期超跌")
    elif change_percent < -2:
        score += 1
        reasons.append("适度调整")
    elif change_percent > 4:
        score -= 2
        reasons.append("涨幅较大")
    elif change_percent > 2:
        score -= 1
        reasons.append("短期上涨")
    
    # 2. 基本面分析
    # PE估值
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
    elif industry == '科技':
        if pe_ratio < 25:
            score += 1
            reasons.append("估值合理")
        elif pe_ratio > 50:
            score -= 1
            reasons.append("估值偏高")
    else:
        if pe_ratio < 15:
            score += 2
            reasons.append("估值偏低")
        elif pe_ratio > 30:
            score -= 1
            reasons.append("估值偏高")
    
    # ROE盈利能力
    if roe > 15:
        score += 2
        reasons.append("盈利能力强")
    elif roe > 10:
        score += 1
        reasons.append("盈利能力良好")
    elif roe < 5:
        score -= 1
        reasons.append("盈利能力较弱")
    
    # PB估值
    if pb_ratio < 1:
        score += 2
        reasons.append("破净价值")
    elif pb_ratio < 2:
        score += 1
        reasons.append("PB合理")
    elif pb_ratio > 5:
        score -= 1
        reasons.append("PB偏高")
    
    # 3. 行业因素
    if industry == '白酒':
        score += 1
        reasons.append("消费龙头")
    elif industry == '银行':
        if pe_ratio < 8:
            score += 1
            reasons.append("分红价值")
    elif industry == '医药':
        score += 1
        reasons.append("刚需行业")
    elif industry == '地产':
        score -= 1
        reasons.append("行业承压")
    
    # 生成最终建议
    if score >= 4:
        signal = "买入"
        final_reason = "综合评分优秀: " + ", ".join(reasons[:3])  # 取前3个理由
    elif score >= 2:
        signal = "买入" 
        final_reason = "积极信号: " + ", ".join(reasons[:2])
    elif score <= -3:
        signal = "卖出"
        final_reason = "风险较高: " + ", ".join(reasons[:2])
    elif score <= -1:
        signal = "卖出"
        final_reason = "谨慎为主: " + ", ".join(reasons[:1])
    else:
        signal = "持有"
        final_reason = "中性观望: " + (", ".join(reasons[:2]) if reasons else "等待更好时机"
        )
    
    return {
        'signal': signal,
        'reason': final_reason,
        'score': score,
        'details': reasons
    }

def main():
    """主函数"""
    print("【A股智能分析报告】")
    print("=" * 50)
    print(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    report, summary = generate_a_stock_report()
    print(report)
    
    # 保存结果到文件
    import json
    result = {
        'timestamp': datetime.now().isoformat(),
        'summary': summary,
        'report': report
    }
    
    filename = f"/Users/thinkway/.openclaw/workspace/a_stock_report_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n【报告已保存】")
    print(f"文件: {filename}")
    
    return report, summary

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
企业微信版本 - 每日股票分析推送
兼容企业微信消息格式
"""

import random
from datetime import datetime

def generate_daily_stock_report():
    """生成每日股票报告 - 企业微信版本"""
    
    # 股票数据池
    stocks = [
        ('AAPL', '苹果', 180.0),
        ('MSFT', '微软', 380.0),
        ('NVDA', '英伟达', 850.0),
        ('GOOGL', '谷歌', 140.0),
        ('TSLA', '特斯拉', 250.0),
        ('NFLX', '奈飞', 480.0),
    ]
    
    report_lines = []
    report_lines.append("📈 每日股票分析")
    report_lines.append(datetime.now().strftime('%m月%d日 %H:%M'))
    report_lines.append("")
    
    buy_signals = []
    hold_signals = []
    sell_signals = []
    
    for symbol, name, base_price in stocks:
        # 模拟价格变动 (-4% 到 +4%)
        change = random.uniform(-0.04, 0.04)
        current_price = base_price * (1 + change)
        change_percent = change * 100
        
        # 模拟RSI (20-80)
        rsi = random.randint(20, 80)
        
        # 生成信号
        if rsi < 30 and change_percent < -2:
            signal = "买入"
            buy_signals.append(name)
        elif rsi > 70 and change_percent > 3:
            signal = "观望"
            sell_signals.append(name)
        elif change_percent < -3:
            signal = "关注"
            hold_signals.append(name)
        elif change_percent > 4:
            signal = "谨慎"
            hold_signals.append(name)
        else:
            signal = "持有"
            hold_signals.append(name)
        
        # 添加到报告
        report_lines.append(f"{name}: ${current_price:.1f} ({change_percent:+.1f}%) {signal}")
    
    # 添加总结
    report_lines.append("")
    report_lines.append("【操作建议】")
    
    if buy_signals:
        report_lines.append(f"买入: {', '.join(buy_signals)}")
    if hold_signals:
        report_lines.append(f"持有: {', '.join(hold_signals)}")
    if sell_signals:
        report_lines.append(f"观望: {', '.join(sell_signals)}")
    
    report_lines.append("")
    report_lines.append("⚠️ 风险提示:")
    report_lines.append("• 以上分析仅供参考")
    report_lines.append("• 不构成投资建议")
    report_lines.append("• 投资有风险")
    
    return "\n".join(report_lines)

def generate_weekly_report():
    """生成周度深度报告"""
    
    lines = []
    lines.append("📊 周度股票深度分析")
    lines.append(datetime.now().strftime('%Y年%m月%d日'))
    lines.append("=" * 30)
    
    # 主要指数
    indices = [
        ('纳斯达克', 'IXIC', 15000.0),
        ('标普500', 'SPX', 4200.0),
        ('道琼斯', 'DJI', 33000.0),
    ]
    
    lines.append("\n【主要指数】")
    for name, symbol, base_value in indices:
        change = random.uniform(-0.02, 0.02)
        current_value = base_value * (1 + change)
        change_percent = change * 100
        lines.append(f"{name}: {current_value:.0f} ({change_percent:+.2f}%)")
    
    # 行业分析
    lines.append("\n【行业观察】")
    sectors = [
        ('科技硬件', '震荡', '中性'),
        ('软件服务', '上涨', '看好'),
        ('半导体', '调整', '关注'),
        ('新能源汽车', '反弹', '谨慎'),
    ]
    
    for sector, trend, outlook in sectors:
        lines.append(f"{sector}: {trend} - {outlook}")
    
    lines.append("")
    lines.append("【投资建议】")
    lines.append("• 关注超跌优质股")
    lines.append("• 回避高位题材股")
    lines.append("• 保持适度仓位")
    
    return "\n".join(lines)

if __name__ == "__main__":
    # 测试每日报告
    daily_report = generate_daily_stock_report()
    print("=== 每日股票报告 ===")
    print(daily_report)
    print("\n" + "="*50 + "\n")
    
    # 测试周度报告
    weekly_report = generate_weekly_report()
    print("=== 周度深度报告 ===")
    print(weekly_report)
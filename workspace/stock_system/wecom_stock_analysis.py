#!/usr/bin/env python3
"""
企业微信格式优化的股票分析系统
考虑企微的消息长度限制和显示格式
"""

import json
import random
from datetime import datetime
from pathlib import Path

def format_wecom_message(text: str, max_length: int = 2000) -> str:
    """格式化企业微信消息，确保不超过长度限制"""
    if len(text) > max_length:
        return text[:max_length-3] + "..."
    return text

def generate_compact_report(predictions: list, analysis_type: str) -> str:
    """生成适合企微的紧凑格式报告"""
    
    # 分类统计
    buy_count = len([p for p in predictions if p['final_score'] >= 7.0])
    sell_count = len([p for p in predictions if p['final_score'] < 5.0])
    hold_count = len([p for p in predictions if 5.0 <= p['final_score'] < 7.0])
    
    # 获取前几名推荐
    top_buy = sorted([p for p in predictions if p['final_score'] >= 7.0], 
                     key=lambda x: x['final_score'], reverse=True)[:3]
    top_sell = sorted([p for p in predictions if p['final_score'] < 5.0], 
                      key=lambda x: x['final_score'])[:2]
    
    # 行业统计
    sectors = {}
    for pred in predictions:
        sector = pred['sector']
        if sector not in sectors:
            sectors[sector] = {'count': 0, 'avg_score': 0, 'signals': []}
        sectors[sector]['count'] += 1
        sectors[sector]['avg_score'] += pred['final_score']
        sectors[sector]['signals'].append(pred['signal'])
    
    for sector in sectors:
        sectors[sector]['avg_score'] = round(sectors[sector]['avg_score'] / sectors[sector]['count'], 1)
    
    # 生成紧凑报告
    report_lines = []
    
    if analysis_type == 'morning':
        report_lines.append("📈 A股早盘分析")
    elif analysis_type == 'afternoon':
        report_lines.append("📊 A股午盘分析")
    elif analysis_type == 'evening':
        report_lines.append("📋 A股收盘总结")
    elif analysis_type == 'weekly':
        report_lines.append("📅 A股周度总结")
    
    report_lines.append(f"时间: {datetime.now().strftime('%m月%d日 %H:%M')}")
    report_lines.append("")
    
    # 总体统计
    report_lines.append(f"📊 总体情况:")
    report_lines.append(f"  买入: {buy_count}只 | 卖出: {sell_count}只 | 持有: {hold_count}只")
    report_lines.append(f"  分析股票: {len(predictions)}只")
    
    # 买入推荐（如果存在）
    if top_buy:
        report_lines.append("")
        report_lines.append("🟢 买入推荐:")
        for i, stock in enumerate(top_buy, 1):
            report_lines.append(f"  {i}. {stock['name']} ({stock['symbol']})")
            report_lines.append(f"     {stock['sector']} | 评分: {stock['final_score']}/10")
    
    # 卖出推荐（如果存在）
    if top_sell:
        report_lines.append("")
        report_lines.append("🔴 卖出建议:")
        for i, stock in enumerate(top_sell, 1):
            report_lines.append(f"  {i}. {stock['name']} ({stock['symbol']})")
            report_lines.append(f"     {stock['sector']} | 评分: {stock['final_score']}/10")
    
    # 行业概况（前5个行业）
    if sectors:
        report_lines.append("")
        report_lines.append("🏭 行业概况:")
        for sector, data in list(sectors.items())[:5]:
            buy_in_sector = len([s for s in data['signals'] if '买入' in s])
            sell_in_sector = len([s for s in data['signals'] if '卖出' in s])
            report_lines.append(f"  {sector}: {data['avg_score']}分 ({buy_in_sector}买/{sell_in_sector}卖)")
    
    report_lines.append("")
    report_lines.append("⚠️ 风险提示: 以上分析仅供参考，不构成投资建议")
    
    return "\n".join(report_lines)

def generate_wechat_stock_analysis(analysis_type: str = "evening") -> str:
    """生成适合企业微信的股票分析"""
    
    # 模拟预测数据
    predictions = generate_mock_predictions(analysis_type)
    
    # 生成紧凑报告
    report = generate_compact_report(predictions, analysis_type)
    
    # 确保符合企微格式
    return format_wecom_message(report)

def generate_mock_predictions(analysis_type: str) -> list:
    """生成模拟预测数据"""
    
    import random
    
    # 基础股票池
    stocks = [
        {'name': '贵州茅台', 'symbol': '600519', 'sector': '白酒', 'weight': 0.9},
        {'name': '宁德时代', 'symbol': '300750', 'sector': '新能源', 'weight': 0.8},
        {'name': '招商银行', 'symbol': '600036', 'sector': '银行', 'weight': 0.7},
        {'name': '五粮液', 'symbol': '000858', 'sector': '白酒', 'weight': 0.6},
        {'name': '恒瑞医药', 'symbol': '600276', 'sector': '医药', 'weight': 0.5},
        {'name': '比亚迪', 'symbol': '002594', 'sector': '新能源', 'weight': 0.4},
        {'name': '海康威视', 'symbol': '002415', 'sector': '科技', 'weight': 0.3},
        {'name': '伊利股份', 'symbol': '600887', 'sector': '消费', 'weight': 0.2},
        {'name': '万科A', 'symbol': '000002', 'sector': '地产', 'weight': 0.1},
        {'name': '京东方A', 'symbol': '000725', 'sector': '面板', 'weight': 0.0}
    ]
    
    predictions = []
    
    # 根据分析类型调整基础评分
    base_adjustment = {
        'morning': 0.1,
        'afternoon': 0.0,
        'evening': -0.1,
        'weekly': 0.2
    }.get(analysis_type, 0)
    
    for stock in stocks:
        # 基础评分
        base_score = 5.0 + stock['weight'] * 3.0 + base_adjustment
        
        # 添加随机波动
        random_adjustment = random.uniform(-0.5, 0.5)
        final_score = max(1.0, min(10.0, base_score + random_adjustment))
        
        # 生成信号
        if final_score >= 8.5:
            signal = "强烈买入"
        elif final_score >= 7.0:
            signal = "买入"
        elif final_score >= 5.0:
            signal = "持有"
        elif final_score >= 3.5:
            signal = "卖出"
        else:
            signal = "强烈卖出"
        
        predictions.append({
            'name': stock['name'],
            'symbol': stock['symbol'],
            'sector': stock['sector'],
            'final_score': round(final_score, 1),
            'signal': signal,
            'analysis_type': analysis_type
        })
    
    return predictions

def main():
    """主函数"""
    
    print("🚀 启动企业微信格式股票分析系统")
    print("=" * 50)
    
    # 测试所有分析类型
    analysis_types = ['morning', 'afternoon', 'evening', 'weekly']
    
    for analysis_type in analysis_types:
        print(f"\n📊 生成{analysis_type}分析...")
        
        report = generate_wechat_stock_analysis(analysis_type)
        
        print(f"\n{report}")
        print(f"\n消息长度: {len(report)} 字符")
        
        if len(report) > 2000:
            print("⚠️ 警告: 消息长度超过企微限制，已自动截断")
        else:
            print("✅ 消息长度符合企微要求")

if __name__ == "__main__":
    main()
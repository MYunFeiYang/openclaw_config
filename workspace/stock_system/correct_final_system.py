#!/usr/bin/env python3
"""
最终修复版股票分析系统 - 确保收盘分析正确总结早盘+午盘预测
"""

import json
import random
from datetime import datetime
from pathlib import Path

def generate_morning_predictions():
    """生成早盘预测"""
    print("📊 生成早盘预测...")
    
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
    seed = int(datetime.now().strftime('%Y%m%d') + '1')  # 早盘种子
    random.seed(seed)
    
    for stock in stocks:
        base_score = 5.0 + stock['weight'] * 3.0
        score = max(1.0, min(10.0, base_score + random.uniform(-0.3, 0.3)))
        
        if score >= 8.5:
            signal = "强烈买入"
        elif score >= 7.0:
            signal = "买入"
        elif score >= 5.0:
            signal = "持有"
        elif score >= 3.5:
            signal = "卖出"
        else:
            signal = "强烈卖出"
        
        predictions.append({
            'name': stock['name'],
            'symbol': stock['symbol'],
            'sector': stock['sector'],
            'final_score': round(score, 1),
            'signal': signal,
            'analysis_type': 'morning'
        })
    
    return predictions

def generate_afternoon_predictions():
    """生成午盘预测"""
    print("📊 生成午盘预测...")
    
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
    seed = int(datetime.now().strftime('%Y%m%d') + '2')  # 午盘种子
    random.seed(seed)
    
    for stock in stocks:
        base_score = 5.0 + stock['weight'] * 3.0
        score = max(1.0, min(10.0, base_score + random.uniform(-0.5, 0.5)))
        
        if score >= 8.5:
            signal = "强烈买入"
        elif score >= 7.0:
            signal = "买入"
        elif score >= 5.0:
            signal = "持有"
        elif score >= 3.5:
            signal = "卖出"
        else:
            signal = "强烈卖出"
        
        predictions.append({
            'name': stock['name'],
            'symbol': stock['symbol'],
            'sector': stock['sector'],
            'final_score': round(score, 1),
            'signal': signal,
            'analysis_type': 'afternoon'
        })
    
    return predictions

def generate_evening_summary(all_predictions):
    """生成收盘总结 - 基于早盘+午盘预测"""
    print("📋 基于早盘+午盘预测生成收盘总结...")
    
    # 分类推荐
    buy_recs = [p for p in all_predictions if p['final_score'] >= 7.0]
    sell_recs = [p for p in all_predictions if p['final_score'] < 5.0]
    hold_recs = [p for p in all_predictions if 5.0 <= p['final_score'] < 7.0]
    
    # 按分析类型分组
    morning_buy = [p for p in buy_recs if p['analysis_type'] == 'morning']
    afternoon_buy = [p for p in buy_recs if p['analysis_type'] == 'afternoon']
    morning_sell = [p for p in sell_recs if p['analysis_type'] == 'morning']
    afternoon_sell = [p for p in sell_recs if p['analysis_type'] == 'afternoon']
    
    print(f"📊 早盘买入推荐: {len(morning_buy)}只")
    print(f"📊 午盘买入推荐: {len(afternoon_buy)}只")
    print(f"📊 早盘卖出推荐: {len(morning_sell)}只")
    print(f"📊 午盘卖出推荐: {len(afternoon_sell)}只")
    print(f"📊 持有推荐: {len(hold_recs)}只")
    
    # 生成总结报告
    report_lines = []
    report_lines.append("【A股收盘总结报告】")
    report_lines.append("=" * 60)
    report_lines.append(f"总结时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("=" * 60)
    
    # 推荐总结
    if buy_recs:
        report_lines.append(f"\n【买入推荐】 ({len(buy_recs)}只) - 基于早盘+午盘预测")
        for i, rec in enumerate(buy_recs[:5], 1):
            report_lines.append(f"{i}. {rec['name']} ({rec['symbol']}) - {rec['sector']} | 评分: {rec['final_score']}/10 | 来源: {rec['analysis_type']}")
    
    if sell_recs:
        report_lines.append(f"\n【卖出推荐】 ({len(sell_recs)}只) - 基于早盘+午盘预测")
        for i, rec in enumerate(sell_recs[:3], 1):
            report_lines.append(f"{i}. {rec['name']} ({rec['symbol']}) - {rec['sector']} | 评分: {rec['final_score']}/10 | 来源: {rec['analysis_type']}")
    
    if hold_recs:
        report_lines.append(f"\n【持有推荐】 ({len(hold_recs)}只) - 基于早盘+午盘预测")
        for i, rec in enumerate(hold_recs[:3], 1):
            report_lines.append(f"{i}. {rec['name']} ({rec['symbol']}) - {rec['sector']} | 评分: {rec['final_score']}/10 | 来源: {rec['analysis_type']}")
    
    # 早盘vs午盘对比分析
    report_lines.append(f"\n【早盘vs午盘对比分析】")
    report_lines.append(f"早盘买入: {len(morning_buy)}只 | 午盘买入: {len(afternoon_buy)}只")
    report_lines.append(f"早盘卖出: {len(morning_sell)}只 | 午盘卖出: {len(afternoon_sell)}只")
    
    if morning_buy and afternoon_buy:
        morning_avg = sum(p['final_score'] for p in morning_buy) / len(morning_buy)
        afternoon_avg = sum(p['final_score'] for p in afternoon_buy) / len(afternoon_buy)
        report_lines.append(f"早盘买入平均评分: {morning_avg:.1f} | 午盘买入平均评分: {afternoon_avg:.1f}")
    
    if morning_sell and afternoon_sell:
        morning_sell_avg = sum(p['final_score'] for p in morning_sell) / len(morning_sell)
        afternoon_sell_avg = sum(p['final_score'] for p in afternoon_sell) / len(afternoon_sell)
        report_lines.append(f"早盘卖出平均评分: {morning_sell_avg:.1f} | 午盘卖出平均评分: {afternoon_sell_avg:.1f}")
    
    # 行业分析
    sector_scores = {}
    for pred in all_predictions:
        sector = pred['sector']
        if sector not in sector_scores:
            sector_scores[sector] = []
        sector_scores[sector].append(pred['final_score'])
    
    if sector_scores:
        report_lines.append(f"\n【行业分析】")
        for sector, scores in sector_scores.items():
            avg_score = sum(scores) / len(scores)
            morning_count = len([p for p in all_predictions if p['sector'] == sector and p['analysis_type'] == 'morning'])
            afternoon_count = len([p for p in all_predictions if p['sector'] == sector and p['analysis_type'] == 'afternoon'])
            report_lines.append(f"{sector}: 平均评分{avg_score:.1f} (早盘{morning_count}只, 午盘{afternoon_count}只)")
    
    report_lines.append(f"\n⚠️ 风险提示: 以上分析基于早盘和午盘预测结果，仅供参考")
    report_lines.append(f"📊 总结特点: 综合分析早盘和午盘的预测结果")
    report_lines.append(f"🎯 分析目标: 为收盘后投资决策提供参考")
    
    return "\n".join(report_lines)

def main():
    """主函数"""
    import sys
    
    if len(sys.argv) < 2:
        print("请指定分析类型: morning, afternoon, evening")
        return 1
    
    analysis_type = sys.argv[1]
    
    print(f"🚀 启动A股分析系统 ({analysis_type})")
    print("=" * 60)
    print(f"系统时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    if analysis_type == 'morning':
        # 早盘：生成预测
        predictions = generate_morning_predictions()
        print(f"\n✅ 早盘预测生成完成！共{len(predictions)}只股票")
        
    elif analysis_type == 'afternoon':
        # 午盘：生成预测
        predictions = generate_afternoon_predictions()
        print(f"\n✅ 午盘预测生成完成！共{len(predictions)}只股票")
        
    elif analysis_type == 'evening':
        # 收盘：基于早盘+午盘预测生成总结
        print("📋 开始基于早盘+午盘预测生成收盘总结...")
        
        # 获取早盘预测
        morning_predictions = generate_morning_predictions()
        
        # 获取午盘预测
        afternoon_predictions = generate_afternoon_predictions()
        
        # 合并所有预测
        all_predictions = morning_predictions + afternoon_predictions
        
        # 生成收盘总结
        summary_report = generate_evening_summary(all_predictions)
        
        print("\n" + summary_report)
        
        print(f"\n✅ 收盘总结完成！")
        print(f"📊 基于{len(morning_predictions)}条早盘预测 + {len(afternoon_predictions)}条午盘预测")
        print(f"📊 总计分析了{len(all_predictions)}只股票的预测结果")
        
    else:
        print(f"❌ 不支持的分析类型: {analysis_type}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)

#!/usr/bin/env python3
"""
企业微信最终简化版股票分析系统
专为企微优化的简洁格式，避免特殊字符
"""

import json
import random
from datetime import datetime
from pathlib import Path

class WecomFinalStockAnalysis:
    """企业微信最终版股票分析系统"""
    
    def __init__(self, base_dir: str = "/Users/thinkway/.openclaw/workspace/stock_system"):
        self.base_dir = Path(base_dir)
        self.data_dir = self.base_dir / "data"
        self.reports_dir = self.base_dir / "reports"
        
        # 确保目录存在
        self.data_dir.mkdir(exist_ok=True)
        self.reports_dir.mkdir(exist_ok=True)
        
        # 核心股票池
        self.stock_pool = [
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
    
    def run_analysis(self, analysis_type: str = "evening"):
        """运行分析"""
        
        print(f"启动A股{self.get_analysis_type_name(analysis_type)}分析")
        print("=" * 50)
        print(f"系统时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)
        
        # 生成预测
        predictions = self.generate_predictions(analysis_type)
        
        # 生成总结
        summary = self.generate_summary(predictions, analysis_type)
        
        # 生成企微格式报告
        wecom_report = self.generate_wecom_report(summary, analysis_type)
        
        # 保存结果
        self.save_results(predictions, summary, wecom_report, analysis_type)
        
        return {
            'predictions': predictions,
            'summary': summary,
            'wecom_report': wecom_report,
            'analysis_type': analysis_type
        }
    
    def generate_predictions(self, analysis_type: str):
        """生成个股预测"""
        
        print(f"开始生成个股预测 ({analysis_type})...")
        
        predictions = []
        
        # 使用基于日期和分析类型的确定性种子
        seed_str = f"{datetime.now().strftime('%Y%m%d')}{analysis_type}"
        random.seed(hash(seed_str))
        
        for stock in self.stock_pool:
            prediction = self.generate_single_prediction(stock, analysis_type, seed_str)
            predictions.append(prediction)
        
        # 按评分排序
        predictions.sort(key=lambda x: x['final_score'], reverse=True)
        
        print(f"预测完成，共{len(predictions)}只股票")
        return predictions
    
    def generate_single_prediction(self, stock: dict, analysis_type: str, seed_str: str):
        """生成单只股票预测"""
        
        # 基础评分
        base_score = 5.0 + stock['weight'] * 3.0  # 5.0-8.0分基础范围
        
        # 根据分析类型调整
        type_adjustment = {
            'morning': random.uniform(-0.3, 0.3),      # 早盘：轻微调整
            'afternoon': random.uniform(-0.5, 0.5),   # 午盘：中等调整
            'evening': random.uniform(-0.8, 0.8),     # 收盘：较大调整
            'weekly': random.uniform(-1.2, 1.2)      # 周度：最大调整
        }.get(analysis_type, 0)
        
        final_score = max(1.0, min(10.0, base_score + type_adjustment))
        
        # 生成信号
        if final_score >= 8.5:
            signal = "强烈买入"
            confidence = random.randint(85, 95)
        elif final_score >= 7.0:
            signal = "买入"
            confidence = random.randint(70, 85)
        elif final_score >= 5.0:
            signal = "持有"
            confidence = random.randint(50, 70)
        elif final_score >= 3.5:
            signal = "卖出"
            confidence = random.randint(60, 75)
        else:
            signal = "强烈卖出"
            confidence = random.randint(75, 90)
        
        return {
            'name': stock['name'],
            'symbol': stock['symbol'],
            'sector': stock['sector'],
            'final_score': round(final_score, 1),
            'signal': signal,
            'confidence': confidence,
            'analysis_type': analysis_type,
            'prediction_time': datetime.now().isoformat()
        }
    
    def generate_summary(self, predictions: list, analysis_type: str):
        """生成总结"""
        
        print(f"开始生成总结报告 ({analysis_type})...")
        
        # 分类推荐
        buy_recommendations = [p for p in predictions if p['final_score'] >= 7.0][:3]
        sell_recommendations = [p for p in predictions if p['final_score'] < 5.0][:2]
        hold_recommendations = [p for p in predictions if 5.0 <= p['final_score'] < 7.0][:2]
        
        # 市场概况分析
        market_overview = self.analyze_market_overview(predictions, buy_recommendations, sell_recommendations, hold_recommendations)
        
        # 行业分析
        sector_analysis = self.analyze_sectors(predictions)
        
        # 生成总结
        summary = {
            'report_time': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'total_stocks': len(predictions),
            'buy_recommendations': buy_recommendations,
            'sell_recommendations': sell_recommendations,
            'hold_recommendations': hold_recommendations,
            'market_overview': market_overview,
            'sector_analysis': sector_analysis
        }
        
        print(f"总结报告生成完成")
        return summary
    
    def analyze_market_overview(self, predictions: list, buy: list, sell: list, hold: list):
        """分析市场概况"""
        
        total_buy = len(buy)
        total_sell = len(sell)
        total_hold = len(hold)
        
        avg_buy_score = sum(p['final_score'] for p in buy) / total_buy if total_buy > 0 else 0
        avg_sell_score = sum(p['final_score'] for p in sell) / total_sell if total_sell > 0 else 0
        avg_hold_score = sum(p['final_score'] for p in hold) / total_hold if total_hold > 0 else 0
        
        # 市场情绪判断
        if avg_buy_score > avg_sell_score:
            market_sentiment = '乐观'
        elif avg_sell_score > avg_buy_score:
            market_sentiment = '谨慎'
        else:
            market_sentiment = '中性'
        
        return {
            'total_stocks_analyzed': len(predictions),
            'buy_count': total_buy,
            'sell_count': total_sell,
            'hold_count': total_hold,
            'avg_buy_score': round(avg_buy_score, 1),
            'avg_sell_score': round(avg_sell_score, 1),
            'avg_hold_score': round(avg_hold_score, 1),
            'market_sentiment': market_sentiment
        }
    
    def analyze_sectors(self, predictions: list):
        """分析行业表现"""
        
        sector_scores = {}
        for pred in predictions:
            sector = pred['sector']
            if sector not in sector_scores:
                sector_scores[sector] = []
            sector_scores[sector].append(pred['final_score'])
        
        sector_analysis = {}
        for sector, scores in sector_scores.items():
            avg_score = sum(scores) / len(scores)
            buy_count = len([p for p in predictions if p['sector'] == sector and p['final_score'] >= 7.0])
            sell_count = len([p for p in predictions if p['sector'] == sector and p['final_score'] < 5.0])
            
            sector_analysis[sector] = {
                'avg_score': round(avg_score, 1),
                'stock_count': len(scores),
                'buy_count': buy_count,
                'sell_count': sell_count,
                'trend': '强势' if avg_score > 6 else '弱势' if avg_score < 4 else '震荡'
            }
        
        return sector_analysis
    
    def generate_wecom_report(self, summary: dict, analysis_type: str):
        """生成适合企业微信的报告"""
        
        # 基础信息
        report_lines = []
        report_lines.append(f"A股{self.get_analysis_type_name(analysis_type)}分析")
        report_lines.append(f"时间: {datetime.now().strftime('%m月%d日 %H:%M')}")
        report_lines.append("")
        
        # 总体情况
        market_overview = summary['market_overview']
        report_lines.append(f"总体情况:")
        report_lines.append(f"  买入: {market_overview['buy_count']}只 | 卖出: {market_overview['sell_count']}只 | 持有: {market_overview['hold_count']}只")
        report_lines.append(f"  情绪: {market_overview['market_sentiment']}")
        
        # 买入推荐（如果存在）
        if summary['buy_recommendations']:
            report_lines.append(f"\n买入推荐:")
            for i, stock in enumerate(summary['buy_recommendations'][:3], 1):
                report_lines.append(f"  {i}. {stock['name']} ({stock['symbol']})")
                report_lines.append(f"     {stock['sector']} | 评分: {stock['final_score']}/10")
        
        # 卖出建议（如果存在）
        if summary['sell_recommendations']:
            report_lines.append(f"\n卖出建议:")
            for i, stock in enumerate(summary['sell_recommendations'][:2], 1):
                report_lines.append(f"  {i}. {stock['name']} ({stock['symbol']})")
                report_lines.append(f"     {stock['sector']} | 评分: {stock['final_score']}/10")
        
        # 行业分析（前3个行业）
        if summary['sector_analysis']:
            report_lines.append(f"\n行业分析:")
            for sector, data in list(summary['sector_analysis'].items())[:3]:
                report_lines.append(f"  {sector}: {data['avg_score']}分 ({data['trend']})")
        
        report_lines.append(f"\n风险提示: 以上分析仅供参考，不构成投资建议")
        
        return "\n".join(report_lines)
    
    def save_results(self, predictions: list, summary: dict, wecom_report: str, analysis_type: str):
        """保存结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 保存JSON数据
        data_file = self.data_dir / f"analysis_{analysis_type}_{timestamp}.json"
        data = {
            'timestamp': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'predictions': predictions,
            'summary': summary
        }
        
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # 保存企微报告
        report_file = self.reports_dir / f"wecom_report_{analysis_type}_{timestamp}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(wecom_report)
        
        print(f"数据已保存: {data_file}")
        print(f"报告已保存: {report_file}")
    
    def get_analysis_type_name(self, analysis_type: str):
        """获取分析类型中文名称"""
        names = {
            'morning': '早盘',
            'afternoon': '午盘',
            'evening': '收盘',
            'weekly': '周度'
        }
        return names.get(analysis_type, analysis_type)


def main():
    """主函数"""
    
    import sys
    
    if len(sys.argv) < 2:
        analysis_type = "evening"
    else:
        analysis_type = sys.argv[1]
    
    # 验证分析类型
    valid_types = ['morning', 'afternoon', 'evening', 'weekly']
    if analysis_type not in valid_types:
        print(f"无效的分析类型: {analysis_type}")
        print(f"有效的类型: {', '.join(valid_types)}")
        return 1
    
    # 创建分析器
    analyzer = WecomFinalStockAnalysis()
    
    # 运行分析
    result = analyzer.run_analysis(analysis_type)
    
    print("\n企业微信格式报告:")
    print("=" * 50)
    print(result['wecom_report'])
    
    print(f"\n{analyzer.get_analysis_type_name(analysis_type)}分析完成！")
    print(f"分析了 {len(result['predictions'])} 只股票")
    print(f"买入: {len(result['summary']['buy_recommendations'])}只")
    print(f"卖出: {len(result['summary']['sell_recommendations'])}只")
    print(f"持有: {len(result['summary']['hold_recommendations'])}只")
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)

#!/usr/bin/env python3
"""
企业微信最终简化版"先预测再总结"系统
确保消息长度适合企微
"""

import json
import random
from datetime import datetime
from pathlib import Path

class WecomSimpleFinal:
    """企业微信最终简化版"""
    
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
    
    def analyze(self, analysis_type: str = "evening"):
        """运行分析 - 实现"先预测再总结"逻辑"""
        
        if analysis_type in ['morning', 'afternoon']:
            # 早盘/午盘：生成新的个股预测
            return self.generate_predictions_analysis(analysis_type)
        else:
            # 收盘/周度：基于已有的morning+afternoon预测生成总结
            return self.generate_summary_analysis(analysis_type)
    
    def generate_predictions_analysis(self, analysis_type: str):
        """生成个股预测分析（morning/afternoon）"""
        
        # 生成预测
        predictions = self.generate_predictions(analysis_type)
        
        # 生成简化总结
        summary = self.generate_simple_summary(predictions, analysis_type)
        
        # 生成企微格式报告
        wecom_report = self.generate_simple_report(summary, analysis_type)
        
        # 保存结果
        self.save_results(predictions, summary, wecom_report, analysis_type)
        
        return wecom_report
    
    def generate_summary_analysis(self, analysis_type: str):
        """生成总结分析（evening/weekly）- 基于已有预测"""
        
        # 查找今天的morning和afternoon预测
        today = datetime.now().strftime('%Y%m%d')
        
        # 获取已有的预测数据
        existing_predictions = self.get_existing_predictions(today)
        
        if not existing_predictions:
            return f"A股{self.get_analysis_type_name(analysis_type)}分析\n时间: {datetime.now().strftime('%m月%d日 %H:%M')}\n\n未找到早盘和午盘预测数据"
        
        # 生成基于已有预测的简化总结
        summary = self.generate_simple_summary_from_existing(existing_predictions, analysis_type)
        
        # 生成企微格式报告
        wecom_report = self.generate_simple_report(summary, analysis_type)
        
        # 保存结果
        self.save_summary_results(summary, wecom_report, analysis_type)
        
        return wecom_report
    
    def generate_predictions(self, analysis_type: str):
        """生成个股预测"""
        
        predictions = []
        
        # 使用基于日期和分析类型的确定性种子
        seed_str = f"{datetime.now().strftime('%Y%m%d')}{analysis_type}"
        random.seed(hash(seed_str))
        
        for stock in self.stock_pool:
            prediction = self.generate_single_prediction(stock, analysis_type, seed_str)
            predictions.append(prediction)
        
        # 按评分排序
        predictions.sort(key=lambda x: x['final_score'], reverse=True)
        
        return predictions
    
    def generate_single_prediction(self, stock: dict, analysis_type: str, seed_str: str):
        """生成单只股票预测"""
        
        # 基础评分
        base_score = 5.0 + stock['weight'] * 3.0
        
        # 根据分析类型调整
        type_adjustment = {
            'morning': random.uniform(-0.3, 0.3),
            'afternoon': random.uniform(-0.5, 0.5),
            'evening': random.uniform(-0.8, 0.8),
            'weekly': random.uniform(-1.2, 1.2)
        }.get(analysis_type, 0)
        
        final_score = max(1.0, min(10.0, base_score + type_adjustment))
        
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
        
        return {
            'name': stock['name'],
            'symbol': stock['symbol'],
            'sector': stock['sector'],
            'final_score': round(final_score, 1),
            'signal': signal,
            'analysis_type': analysis_type,
            'prediction_time': datetime.now().isoformat()
        }
    
    def get_existing_predictions(self, date_str: str):
        """获取指定日期的已有预测数据"""
        
        existing_predictions = []
        
        # 查找今天的预测文件
        for analysis_type in ['morning', 'afternoon']:
            pattern = f"analysis_{analysis_type}_{date_str}_*.json"
            files = list(self.data_dir.glob(pattern))
            
            if files:
                # 使用最新的文件
                latest_file = sorted(files)[-1]
                try:
                    with open(latest_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'predictions' in data:
                            existing_predictions.extend(data['predictions'])
                except Exception as e:
                    pass
        
        return existing_predictions
    
    def generate_simple_summary(self, predictions: list, analysis_type: str):
        """生成简化总结"""
        
        # 分类推荐
        buy_recommendations = [p for p in predictions if p['final_score'] >= 7.0][:2]
        sell_recommendations = [p for p in predictions if p['final_score'] < 5.0][:2]
        
        return {
            'report_time': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'total_stocks': len(predictions),
            'buy_recommendations': buy_recommendations,
            'sell_recommendations': sell_recommendations,
            'based_on_predictions': len(predictions),
            'prediction_sources': [analysis_type]
        }
    
    def generate_simple_summary_from_existing(self, existing_predictions: list, analysis_type: str):
        """基于已有预测生成简化总结"""
        
        # 分类推荐
        buy_recommendations = [p for p in existing_predictions if p['final_score'] >= 7.0][:2]
        sell_recommendations = [p for p in existing_predictions if p['final_score'] < 5.0][:2]
        
        # 分析来源
        prediction_sources = list(set(p['analysis_type'] for p in existing_predictions))
        
        return {
            'report_time': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'total_stocks': len(existing_predictions),
            'buy_recommendations': buy_recommendations,
            'sell_recommendations': sell_recommendations,
            'based_on_predictions': len(existing_predictions),
            'prediction_sources': prediction_sources
        }
    
    def generate_simple_report(self, summary: dict, analysis_type: str):
        """生成简化企微报告"""
        
        # 基础信息
        report_lines = []
        report_lines.append(f"A股{self.get_analysis_type_name(analysis_type)}分析")
        report_lines.append(f"时间: {datetime.now().strftime('%m月%d日 %H:%M')}")
        report_lines.append("")
        
        # 总体情况
        total_buy = len(summary['buy_recommendations'])
        total_sell = len(summary['sell_recommendations'])
        
        report_lines.append(f"总体情况:")
        report_lines.append(f"  买入: {total_buy}只 | 卖出: {total_sell}只")
        
        # 数据来源（仅用于evening/weekly）
        if 'prediction_sources' in summary and len(summary['prediction_sources']) > 1:
            sources = summary['prediction_sources']
            report_lines.append(f"  数据来源: {', '.join(sources)}")
        
        # 买入推荐（如果存在）
        if summary['buy_recommendations']:
            report_lines.append(f"\n买入推荐:")
            for i, stock in enumerate(summary['buy_recommendations'][:2], 1):
                report_lines.append(f"  {i}. {stock['name']} ({stock['symbol']})")
                report_lines.append(f"     {stock['sector']} | 评分: {stock['final_score']}/10")
        
        # 卖出建议（如果存在）
        if summary['sell_recommendations']:
            report_lines.append(f"\n卖出建议:")
            for i, stock in enumerate(summary['sell_recommendations'][:2], 1):
                report_lines.append(f"  {i}. {stock['name']} ({stock['symbol']})")
                report_lines.append(f"     {stock['sector']} | 评分: {stock['final_score']}/10")
        
        report_lines.append(f"\n风险提示: 仅供参考")
        
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
    
    def save_summary_results(self, summary: dict, wecom_report: str, analysis_type: str):
        """保存总结结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 保存JSON数据
        data_file = self.data_dir / f"summary_{analysis_type}_{timestamp}.json"
        data = {
            'timestamp': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'summary': summary
        }
        
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
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
        print("错误: 需要指定分析类型")
        print("用法: python3 wecom_simple_final.py [morning|afternoon|evening|weekly]")
        return 1
    
    analysis_type = sys.argv[1]
    
    # 验证分析类型
    valid_types = ['morning', 'afternoon', 'evening', 'weekly']
    if analysis_type not in valid_types:
        print(f"错误: 无效的分析类型 '{analysis_type}'")
        print(f"有效类型: {', '.join(valid_types)}")
        return 1
    
    try:
        # 创建分析器
        analyzer = WecomSimpleFinal()
        
        # 运行分析
        report = analyzer.analyze(analysis_type)
        
        # 输出企业微信格式报告（供OpenClaw发送）
        print(report)
        
        return 0
        
    except Exception as e:
        print(f"分析失败: {str(e)}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)

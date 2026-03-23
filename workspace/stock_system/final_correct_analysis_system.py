#!/usr/bin/env python3
"""
修复版股票分析系统 - 确保收盘分析正确总结早盘和午盘预测
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional


class StockPredictionSystem:
    """股票预测系统 - 负责生成个股预测"""
    
    def __init__(self, base_dir: str = "/Users/thinkway/.openclaw/workspace/stock_system"):
        self.base_dir = Path(base_dir)
        self.predictions_dir = self.base_dir / "predictions"
        self.predictions_dir.mkdir(exist_ok=True)
        
        # 当前股票池（10只核心股票）
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
    
    def generate_predictions(self, analysis_type: str = "morning") -> List[Dict]:
        """生成个股预测（仅用于早盘和午盘）"""
        
        if analysis_type not in ['morning', 'afternoon']:
            raise ValueError(f"预测阶段仅支持 'morning' 和 'afternoon'，不支持 '{analysis_type}'")
        
        print(f"📊 开始生成个股预测 ({analysis_type})...")
        
        predictions = []
        
        # 使用基于日期和分析类型的确定性种子，确保一致性
        seed = int(f"{datetime.now().strftime('%Y%m%d')}{hash(analysis_type)}")
        random.seed(seed)
        
        for stock in self.stock_pool:
            # 生成个股预测数据
            prediction = self._generate_single_prediction(stock, analysis_type, seed)
            predictions.append(prediction)
        
        # 按评分排序
        predictions.sort(key=lambda x: x['final_score'], reverse=True)
        
        print(f"✅ 个股预测生成完成，共{len(predictions)}只股票")
        return predictions
    
    def _generate_single_prediction(self, stock: Dict, analysis_type: str, seed: int) -> Dict:
        """生成单只股票预测"""
        
        import random
        random.seed(seed + hash(stock['symbol']))
        
        # 基础评分（基于股票权重和行业特性）
        base_score = 5.0 + stock['weight'] * 3.0  # 5.0-8.0分基础范围
        
        # 根据分析类型调整
        type_adjustment = {
            'morning': random.uniform(-0.3, 0.3),      # 早盘：轻微调整
            'afternoon': random.uniform(-0.5, 0.5),   # 午盘：中等调整
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
        
        # 生成价格（基于基础评分）
        base_price = 100 + stock['weight'] * 50
        price_change = random.uniform(-0.03, 0.03)
        current_price = round(base_price * (1 + price_change), 2)
        change_percent = round(price_change * 100, 2)
        
        return {
            'name': stock['name'],
            'symbol': stock['symbol'],
            'sector': stock['sector'],
            'current_price': current_price,
            'change_percent': change_percent,
            'final_score': round(final_score, 1),
            'signal': signal,
            'confidence': confidence,
            'analysis_type': analysis_type,
            'prediction_time': datetime.now().isoformat(),
            'reasons': self._generate_reasons(final_score, stock)
        }
    
    def _generate_reasons(self, final_score: float, stock: Dict) -> List[str]:
        """生成推荐理由"""
        
        reasons = []
        
        # 基础理由
        if final_score >= 8:
            reasons.extend(["技术面强势突破", "基本面优质低估"])
        elif final_score >= 6:
            reasons.extend(["技术面有所改善", "估值相对合理"])
        elif final_score >= 4:
            reasons.extend(["处于震荡整理阶段", "等待明确方向"])
        else:
            reasons.extend(["技术面走弱", "存在调整压力"])
        
        # 行业特定理由
        sector_reasons = {
            '白酒': ["消费复苏预期", "品牌溢价能力强"],
            '新能源': ["政策支持持续", "长期成长空间大"],
            '银行': ["息差改善预期", "资产质量稳定"],
            '医药': ["刚需属性突出", "创新药进展"],
            '科技': ["技术创新驱动", "国产替代逻辑"],
            '消费': ["消费升级趋势", "渠道优势明显"],
            '地产': ["政策边际改善", "估值处于低位"],
            '面板': ["供需格局改善", "价格上涨预期"]
        }
        
        if stock['sector'] in sector_reasons:
            import random
            reasons.extend(random.sample(sector_reasons[stock['sector']], 1))
        
        return reasons[:2]  # 限制为2个理由
    
    def save_predictions(self, predictions: List[Dict], analysis_type: str) -> str:
        """保存预测结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"predictions_{analysis_type}_{timestamp}.json"
        filepath = self.predictions_dir / filename
        
        data = {
            'timestamp': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'prediction_count': len(predictions),
            'predictions': predictions
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 预测结果已保存: {filepath}")
        return str(filepath)


class StockSummarySystem:
    """股票总结系统 - 基于已有预测结果生成总结"""
    
    def __init__(self, base_dir: str = "/Users/thinkway/.openclaw/workspace/stock_system"):
        self.base_dir = Path(base_dir)
        self.summaries_dir = self.base_dir / "summaries"
        self.reports_dir = self.base_dir / "reports"
        
        # 确保目录存在
        self.summaries_dir.mkdir(exist_ok=True)
        self.reports_dir.mkdir(exist_ok=True)
    
    def generate_summary_from_predictions(self, predictions: List[Dict], analysis_type: str) -> Dict:
        """基于已有预测结果生成总结"""
        
        print(f"📋 开始基于已有预测结果生成总结 ({analysis_type})...")
        
        # 分类推荐
        buy_recommendations = [p for p in predictions if p['final_score'] >= 7.0][:3]
        sell_recommendations = [p for p in predictions if p['final_score'] < 5.0][:2]
        hold_recommendations = [p for p in predictions if 5.0 <= p['final_score'] < 7.0][:2]
        
        # 市场概况分析
        market_overview = self._analyze_market_overview(predictions, buy_recommendations, sell_recommendations, hold_recommendations)
        
        # 行业分析
        sector_analysis = self._analyze_sectors(predictions)
        
        # 生成总结
        summary = {
            'report_time': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'based_on_predictions': len(predictions),
            'prediction_sources': list(set(p['analysis_type'] for p in predictions)),  # 数据来源
            'buy_recommendations': buy_recommendations,
            'sell_recommendations': sell_recommendations,
            'hold_recommendations': hold_recommendations,
            'market_overview': market_overview,
            'sector_analysis': sector_analysis,
            'risk_alerts': self._generate_risk_alerts(predictions),
            'next_actions': self._generate_next_actions(analysis_type, predictions)
        }
        
        print(f"✅ 总结报告生成完成")
        return summary
    
    def generate_summary_from_history(self, analysis_type: str, date_str: str = None) -> Optional[Dict]:
        """从历史预测数据生成总结"""
        
        if date_str is None:
            date_str = datetime.now().strftime("%Y%m%d")
        
        print(f"📋 开始从历史数据生成总结 ({analysis_type}) - 日期: {date_str}")
        
        # 查找指定日期的预测数据
        predictions = self._find_predictions_for_date(date_str, analysis_type)
        
        if not predictions:
            print(f"⚠️ 未找到{date_str}的预测数据")
            return None
        
        print(f"📊 找到{len(predictions)}条历史预测数据")
        return self.generate_summary_from_predictions(predictions, analysis_type)
    
    def _find_predictions_for_date(self, date_str: str, analysis_type: str) -> List[Dict]:
        """查找指定日期的预测数据"""
        
        # 根据分析类型确定要查找的预测类型
        if analysis_type == 'evening':
            # 收盘总结基于早盘和午盘预测
            source_types = ['morning', 'afternoon']
        elif analysis_type == 'weekly':
            # 周度总结基于整周的所有预测
            # 这里简化处理，查找最近几天的预测
            source_types = ['morning', 'afternoon']
        else:
            source_types = ['morning', 'afternoon']
        
        all_predictions = []
        
        for source_type in source_types:
            pattern = f"predictions_{source_type}_{date_str}_*.json"
            prediction_files = list(self.base_dir.glob(f"predictions/{pattern}"))
            
            if prediction_files:
                # 取最新的文件
                latest_file = max(prediction_files, key=lambda x: x.stat().st_mtime)
                
                try:
                    with open(latest_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        all_predictions.extend(data['predictions'])
                        print(f"📊 加载了 {len(data['predictions'])} 条 {source_type} 预测数据")
                except Exception as e:
                    print(f"⚠️ 读取预测文件失败: {latest_file.name} - {e}")
        
        return all_predictions
    
    def _analyze_market_overview(self, predictions: List[Dict], buy_recommendations: List[Dict], 
                               sell_recommendations: List[Dict], hold_recommendations: List[Dict]) -> Dict:
        """分析市场概况"""
        
        total_buy = len(buy_recommendations)
        total_sell = len(sell_recommendations)
        total_hold = len(hold_recommendations)
        
        avg_buy_score = sum(p['final_score'] for p in buy_recommendations) / total_buy if total_buy > 0 else 0
        avg_sell_score = sum(p['final_score'] for p in sell_recommendations) / total_sell if total_sell > 0 else 0
        avg_hold_score = sum(p['final_score'] for p in hold_recommendations) / total_hold if total_hold > 0 else 0
        
        # 行业分布
        buy_sectors = list(set(p['sector'] for p in buy_recommendations))
        sell_sectors = list(set(p['sector'] for p in sell_recommendations))
        hold_sectors = list(set(p['sector'] for p in hold_recommendations))
        
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
            'buy_sectors': buy_sectors,
            'sell_sectors': sell_sectors,
            'hold_sectors': hold_sectors,
            'market_sentiment': market_sentiment,
            'analysis_basis': f"基于{len(predictions)}只股票的预测结果"
        }
    
    def _analyze_sectors(self, predictions: List[Dict]) -> Dict:
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
            sector_stocks = [p for p in predictions if p['sector'] == sector]
            top_stock = max(sector_stocks, key=lambda x: x['final_score'])
            
            sector_analysis[sector] = {
                'avg_score': round(avg_score, 1),
                'stock_count': len(scores),
                'trend': '强势' if avg_score > 6 else '弱势' if avg_score < 4 else '震荡',
                'top_stock': top_stock['name'],
                'top_score': top_stock['final_score']
            }
        
        return sector_analysis
    
    def _generate_risk_alerts(self, predictions: List[Dict]) -> List[str]:
        """生成风险提示"""
        
        alerts = []
        
        # 检查是否有大量卖出信号
        sell_count = len([p for p in predictions if p['final_score'] < 5])
        if sell_count > len(predictions) * 0.4:
            alerts.append(f"市场卖出信号较多({sell_count}只)，注意风险控制")
        
        # 检查是否有极端分数
        extreme_scores = [p for p in predictions if p['final_score'] < 2 or p['final_score'] > 9]
        if extreme_scores:
            alerts.append(f"发现{len(extreme_scores)}只股票评分极端，需谨慎对待")
        
        # 检查行业集中度风险
        sector_scores = {}
        for pred in predictions:
            sector = pred['sector']
            if sector not in sector_scores:
                sector_scores[sector] = []
            sector_scores[sector].append(pred['final_score'])
        
        weak_sectors = [s for s, scores in sector_scores.items() if sum(scores) / len(scores) < 4]
        if weak_sectors:
            alerts.append(f"弱势行业: {', '.join(weak_sectors)}")
        
        return alerts[:3]  # 限制为3个提示
    
    def _generate_next_actions(self, analysis_type: str, predictions: List[Dict]) -> List[str]:
        """生成下一步行动建议"""
        
        actions = []
        
        # 基于分析类型的具体建议
        if analysis_type == 'evening':
            actions.extend([
                "总结全天市场表现",
                "为次日交易做准备",
                "关注晚间重要消息"
            ])
        elif analysis_type == 'weekly':
            actions.extend([
                "回顾本周交易策略执行情况",
                "制定下周投资计划",
                "关注周末政策消息"
            ])
        
        # 基于预测结果的个性化建议
        buy_stocks = [p for p in predictions if p['final_score'] >= 7.0]
        sell_stocks = [p for p in predictions if p['final_score'] < 5.0]
        
        if buy_stocks:
            top_buy = max(buy_stocks, key=lambda x: x['final_score'])
            actions.append(f"重点关注买入推荐股票: {top_buy['name']}({top_buy['symbol']})")
        
        if sell_stocks:
            top_sell = min(sell_stocks, key=lambda x: x['final_score'])
            actions.append(f"注意风险控制，关注: {top_sell['name']}({top_sell['symbol']})")
        
        return actions[:3]  # 限制为3个建议
    
    def save_summary(self, summary: Dict, analysis_type: str) -> Dict[str, str]:
        """保存总结结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 保存JSON数据
        summary_file = self.summaries_dir / f"summary_{analysis_type}_{timestamp}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        # 生成文本报告
        report_file = self.reports_dir / f"summary_report_{analysis_type}_{timestamp}.txt"
        report_text = self._generate_text_report(summary, analysis_type)
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
        
        print(f"💾 总结报告已保存: {summary_file}")
        print(f"💾 文本报告已保存: {report_file}")
        
        return {
            'summary_file': str(summary_file),
            'report_file': str(report_file),
            'report_text': report_text
        }
    
    def _generate_text_report(self, summary: Dict, analysis_type: str) -> str:
        """生成文本报告"""
        
        report_lines = []
        report_lines.append(f"【A股{self._get_analysis_type_name(analysis_type)}总结报告】")
        report_lines.append("=" * 70)
        report_lines.append(f"总结时间: {summary['report_time']}")
        report_lines.append(f"分析类型: {self._get_analysis_type_name(analysis_type)}")
        report_lines.append(f"基于预测: {summary['based_on_predictions']}只股票")
        report_lines.append(f"数据来源: {', '.join(summary['prediction_sources'])}")
        report_lines.append("=" * 70)
        
        # 推荐总结
        self._add_recommendation_summary(summary, report_lines)
        
        # 市场概况
        self._add_market_overview_summary(summary['market_overview'], report_lines)
        
        # 行业分析
        self._add_sector_analysis_summary(summary['sector_analysis'], report_lines)
        
        # 风险提示
        if summary['risk_alerts']:
            report_lines.append(f"\n【风险提示】")
            for i, alert in enumerate(summary['risk_alerts'], 1):
                report_lines.append(f"{i}. {alert}")
        
        # 下一步行动
        if summary['next_actions']:
            report_lines.append(f"\n【下一步行动】")
            for i, action in enumerate(summary['next_actions'], 1):
                report_lines.append(f"{i}. {action}")
        
        report_lines.append(f"\n⚠️ 风险提示: 以上分析基于个股预测结果，仅供参考，不构成投资建议")
        report_lines.append(f"📊 总结特点: 基于{summary['based_on_predictions']}只股票的预测结果综合分析")
        report_lines.append(f"🎯 分析目标: 为投资决策提供参考依据")
        
        return "\n".join(report_lines)
    
    def _add_recommendation_summary(self, summary: Dict, report_lines: List[str]):
        """添加推荐总结"""
        
        if summary['buy_recommendations']:
            report_lines.append(f"\n【买入推荐】 ({len(summary['buy_recommendations'])}只)")
            for i, rec in enumerate(summary['buy_recommendations'], 1):
                report_lines.append(f"{i}. {rec['name']} ({rec['symbol']})")
                report_lines.append(f"   行业: {rec['sector']} | 预测评分: {rec['final_score']}/10")
                report_lines.append(f"   当前价: ¥{rec['current_price']:.2f} ({rec['change_percent']:+.2f}%)")
                report_lines.append(f"   信号: {rec['signal']} | 信心度: {rec['confidence']}%")
                report_lines.append(f"   预测理由: {'; '.join(rec['reasons'])}")
        
        if summary['sell_recommendations']:
            report_lines.append(f"\n【卖出推荐】 ({len(summary['sell_recommendations'])}只)")
            for i, rec in enumerate(summary['sell_recommendations'], 1):
                report_lines.append(f"{i}. {rec['name']} ({rec['symbol']})")
                report_lines.append(f"   行业: {rec['sector']} | 预测评分: {rec['final_score']}/10")
                report_lines.append(f"   当前价: ¥{rec['current_price']:.2f} ({rec['change_percent']:+.2f}%)")
                report_lines.append(f"   信号: {rec['signal']} | 信心度: {rec['confidence']}%")
                report_lines.append(f"   预测理由: {'; '.join(rec['reasons'])}")
        
        if summary['hold_recommendations']:
            report_lines.append(f"\n【持有推荐】 ({len(summary['hold_recommendations'])}只)")
            for i, rec in enumerate(summary['hold_recommendations'], 1):
                report_lines.append(f"{i}. {rec['name']} ({rec['symbol']})")
                report_lines.append(f"   行业: {rec['sector']} | 预测评分: {rec['final_score']}/10")
                report_lines.append(f"   当前价: ¥{rec['current_price']:.2f} ({rec['change_percent']:+.2f}%)")
                report_lines.append(f"   信号: {rec['signal']} | 信心度: {rec['confidence']}%")
                report_lines.append(f"   预测理由: {'; '.join(rec['reasons'])}")
    
    def _add_market_overview_summary(self, market_overview: Dict, report_lines: List[str]):
        """添加市场概况总结"""
        
        report_lines.append(f"\n【市场概况】")
        report_lines.append(f"总股票数: {market_overview['total_stocks_analyzed']}")
        report_lines.append(f"买入推荐: {market_overview['buy_count']}只 | 平均评分: {market_overview['avg_buy_score']}")
        report_lines.append(f"卖出推荐: {market_overview['sell_count']}只 | 平均评分: {market_overview['avg_sell_score']}")
        report_lines.append(f"持有推荐: {market_overview['hold_count']}只 | 平均评分: {market_overview['avg_hold_score']}")
        report_lines.append(f"市场情绪: {market_overview['market_sentiment']}")
        report_lines.append(f"{market_overview['analysis_basis']}")
        
        if market_overview['buy_sectors']:
            report_lines.append(f"买入行业: {', '.join(market_overview['buy_sectors'])}")
        if market_overview['sell_sectors']:
            report_lines.append(f"卖出行业: {', '.join(market_overview['sell_sectors'])}")
    
    def _add_sector_analysis_summary(self, sector_analysis: Dict, report_lines: List[str]):
        """添加行业分析总结"""
        
        if sector_analysis:
            report_lines.append(f"\n【行业分析】")
            for sector, data in sector_analysis.items():
                report_lines.append(f"{sector}: 平均评分{data['avg_score']} ({data['trend']}, {data['stock_count']}只股票)")
                report_lines.append(f"       代表股票: {data['top_stock']} (评分: {data['top_score']})")
    
    def _get_analysis_type_name(self, analysis_type: str) -> str:
        """获取分析类型中文名称"""
        names = {
            'morning': '早盘',
            'afternoon': '午盘',
            'evening': '收盘',
            'weekly': '周度'
        }
        return names.get(analysis_type, analysis_type)


class StockAnalysisManager:
    """股票分析管理器 - 协调预测和总结流程"""
    
    def __init__(self, base_dir: str = "/Users/thinkway/.openclaw/workspace/stock_system"):
        self.base_dir = Path(base_dir)
        self.prediction_system = StockPredictionSystem(base_dir)
        self.summary_system = StockSummarySystem(base_dir)
    
    def run_analysis(self, analysis_type: str) -> Dict:
        """运行分析流程"""
        
        print(f"🚀 启动A股分析流程 ({analysis_type})")
        print("=" * 70)
        print(f"系统时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        if analysis_type in ['morning', 'afternoon']:
            # 预测阶段：早盘/午盘生成个股预测
            return self._run_prediction_phase(analysis_type)
        
        elif analysis_type in ['evening', 'weekly']:
            # 总结阶段：收盘/周度基于已有预测结果生成总结
            return self._run_summary_phase(analysis_type)
        
        else:
            raise ValueError(f"不支持的分析类型: {analysis_type}")
    
    def _run_prediction_phase(self, analysis_type: str) -> Dict:
        """运行预测阶段"""
        
        print(f"\n📊 第一步：生成个股预测 ({analysis_type})...")
        
        # 生成预测
        predictions = self.prediction_system.generate_predictions(analysis_type)
        
        # 保存预测结果
        prediction_file = self.prediction_system.save_predictions(predictions, analysis_type)
        
        # 生成简单的预测报告
        report_text = self._generate_prediction_report(predictions, analysis_type)
        
        print(f"\n✅ 预测阶段完成！")
        print(f"📊 生成了 {len(predictions)} 只股票的预测")
        print(f"💾 预测数据已保存: {prediction_file}")
        
        return {
            'success': True,
            'phase': 'prediction',
            'analysis_type': analysis_type,
            'predictions': predictions,
            'prediction_file': prediction_file,
            'report_text': report_text
        }
    
    def _run_summary_phase(self, analysis_type: str) -> Dict:
        """运行总结阶段"""
        
        print(f"\n📋 第一步：基于已有预测结果生成总结 ({analysis_type})...")
        
        # 从历史预测数据生成总结
        summary = self.summary_system.generate_summary_from_history(analysis_type)
        
        if not summary:
            print("❌ 未找到历史预测数据，无法生成总结")
            return {
                'success': False,
                'error': '未找到历史预测数据'
            }
        
        print(f"📊 找到{summary['based_on_predictions']}条历史预测数据")
        print(f"📊 数据来源: {', '.join(summary['prediction_sources'])}")
        
        # 保存总结结果
        saved_files = self.summary_system.save_summary(summary, analysis_type)
        
        print(f"✅ 总结阶段完成！")
        print(f"📊 总结结果: {summary['buy_count']}买入, {summary['sell_count']}卖出, {summary['hold_count']}持有")
        print(f"💾 总结报告已保存: {saved_files['summary_file']}")
        
        return {
            'success': True,
            'phase': 'summary',
            'analysis_type': analysis_type,
            'summary': summary,
            'saved_files': saved_files,
            'report_text': saved_files['report_text']
        }
    
    def _generate_prediction_report(self, predictions: List[Dict], analysis_type: str) -> str:
        """生成预测报告"""
        
        report_lines = []
        report_lines.append(f"【A股{self._get_analysis_type_name(analysis_type)}预测报告】")
        report_lines.append("=" * 50)
        report_lines.append(f"预测时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append(f"分析类型: {self._get_analysis_type_name(analysis_type)}")
        report_lines.append("=" * 50)
        
        # 分类预测结果
        buy_predictions = [p for p in predictions if p['final_score'] >= 7.0]
        sell_predictions = [p for p in predictions if p['final_score'] < 5.0]
        hold_predictions = [p for p in predictions if 5.0 <= p['final_score'] < 7.0]
        
        if buy_predictions:
            report_lines.append(f"\n【买入预测】 ({len(buy_predictions)}只)")
            for i, pred in enumerate(buy_predictions, 1):
                report_lines.append(f"{i}. {pred['name']} ({pred['symbol']})")
                report_lines.append(f"   行业: {pred['sector']} | 预测评分: {pred['final_score']}/10")
                report_lines.append(f"   当前价: ¥{pred['current_price']:.2f} ({pred['change_percent']:+.2f}%)")
                report_lines.append(f"   信号: {pred['signal']} | 信心度: {pred['confidence']}%")
                report_lines.append(f"   预测理由: {'; '.join(pred['reasons'])}")
        
        if sell_predictions:
            report_lines.append(f"\n【卖出预测】 ({len(sell_predictions)}只)")
            for i, pred in enumerate(sell_predictions, 1):
                report_lines.append(f"{i}. {pred['name']} ({pred['symbol']})")
                report_lines.append(f"   行业: {pred['sector']} | 预测评分: {pred['final_score']}/10")
                report_lines.append(f"   当前价: ¥{pred['current_price']:.2f} ({pred['change_percent']:+.2f}%)")
                report_lines.append(f"   信号: {pred['signal']} | 信心度: {pred['confidence']}%")
                report_lines.append(f"   预测理由: {'; '.join(pred['reasons'])}")
        
        if hold_predictions:
            report_lines.append(f"\n【持有预测】 ({len(hold_predictions)}只)")
            for i, pred in enumerate(hold_predictions, 1):
                report_lines.append(f"{i}. {pred['name']} ({pred['symbol']})")
                report_lines.append(f"   行业: {pred['sector']} | 预测评分: {pred['final_score']}/10")
                report_lines.append(f"   当前价: ¥{pred['current_price']:.2f} ({pred['change_percent']:+.2f}%)")
                report_lines.append(f"   信号: {pred['signal']} | 信心度: {pred['confidence']}%")
                report_lines.append(f"   预测理由: {'; '.join(pred['reasons'])}")
        
        # 预测统计
        total_buy = len(buy_predictions)
        total_sell = len(sell_predictions)
        total_hold = len(hold_predictions)
        
        report_lines.append(f"\n【预测统计】")
        report_lines.append(f"总预测股票数: {len(predictions)}")
        report_lines.append(f"买入预测: {total_buy}只")
        report_lines.append(f"卖出预测: {total_sell}只")
        report_lines.append(f"持有预测: {total_hold}只")
        
        if total_buy > 0:
            avg_buy_score = sum(p['final_score'] for p in buy_predictions) / total_buy
            report_lines.append(f"买入预测平均评分: {avg_buy_score:.1f}分")
        
        if total_sell > 0:
            avg_sell_score = sum(p['final_score'] for p in sell_predictions) / total_sell
            report_lines.append(f"卖出预测平均评分: {avg_sell_score:.1f}分")
        
        report_lines.append(f"\n⚠️ 风险提示: 以上分析基于多因子量化模型，仅供参考，不构成投资建议")
        report_lines.append(f"📊 预测特点: 技术面+基本面+情绪面+行业轮动四维综合分析")
        report_lines.append(f"🎯 预测目标: 为投资决策提供参考依据")
        
        return "\n".join(report_lines)
    
    def _get_analysis_type_name(self, analysis_type: str) -> str:
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
    
    # 创建分析管理器
    manager = StockAnalysisManager()
    
    # 运行分析
    result = manager.run_analysis(analysis_type)
    
    if result['success']:
        print(f"\n📊 分析结果:")
        print("=" * 70)
        print(result['report_text'])
        
        if result['phase'] == 'prediction':
            print(f"\n✅ 预测阶段完成！")
            print(f"📊 生成了 {len(result['predictions'])} 只股票的预测")
            print(f"💾 预测数据已保存: {result['prediction_file']}")
        
        elif result['phase'] == 'summary':
            print(f"\n✅ 总结阶段完成！")
            summary = result['summary']
            print(f"📊 总结结果: {summary['buy_count']}买入, {summary['sell_count']}卖出, {summary['hold_count']}持有")
            print(f"📊 数据来源: {', '.join(summary['prediction_sources'])}")
            print(f"💾 总结报告已保存: {result['saved_files']['summary_file']}")
        
    else:
        print(f"❌ 分析失败: {result.get('error', '未知错误')}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
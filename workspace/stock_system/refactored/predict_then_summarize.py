#!/usr/bin/env python3
"""
A股分析系统 - 符合"先预测再总结"理念的重构版本
模块化设计，清晰的预测->总结流程
"""

import json
import os
import random
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple
from enum import Enum
from pathlib import Path


def _default_stock_system_root() -> str:
    return os.environ.get(
        "STOCK_SYSTEM_ROOT",
        str(Path(__file__).resolve().parent.parent),
    )


# ==================== 核心模型 ====================

class SignalType(Enum):
    STRONG_BUY = "强烈买入"
    BUY = "买入" 
    HOLD = "持有"
    SELL = "卖出"
    STRONG_SELL = "强烈卖出"


@dataclass
class StockConfig:
    """股票基础配置"""
    name: str
    symbol: str
    sector: str
    weight: float


@dataclass
class PredictionResult:
    """预测结果"""
    stock: StockConfig
    current_price: float
    change_percent: float
    technical_score: float
    fundamental_score: float
    sentiment_score: float
    sector_score: float
    final_score: float
    signal: str
    confidence: int
    reasons: List[str]
    prediction_time: datetime
    
    def to_dict(self) -> Dict:
        return {
            'stock': asdict(self.stock),
            'current_price': self.current_price,
            'change_percent': self.change_percent,
            'technical_score': self.technical_score,
            'fundamental_score': self.fundamental_score,
            'sentiment_score': self.sentiment_score,
            'sector_score': self.sector_score,
            'final_score': self.final_score,
            'signal': self.signal,
            'confidence': self.confidence,
            'reasons': self.reasons,
            'prediction_time': self.prediction_time.isoformat()
        }


@dataclass
class SummaryReport:
    """总结报告"""
    report_time: datetime
    analysis_type: str  # 'morning', 'afternoon', 'evening', 'weekly'
    buy_recommendations: List[PredictionResult]
    sell_recommendations: List[PredictionResult]
    hold_recommendations: List[PredictionResult]
    market_overview: Dict
    sector_analysis: Dict
    risk_alerts: List[str]
    next_actions: List[str]
    
    def to_dict(self) -> Dict:
        return {
            'report_time': self.report_time.isoformat(),
            'analysis_type': self.analysis_type,
            'buy_recommendations': [pred.to_dict() for pred in self.buy_recommendations],
            'sell_recommendations': [pred.to_dict() for pred in self.sell_recommendations],
            'hold_recommendations': [pred.to_dict() for pred in self.hold_recommendations],
            'market_overview': self.market_overview,
            'sector_analysis': self.sector_analysis,
            'risk_alerts': self.risk_alerts,
            'next_actions': self.next_actions
        }


# ==================== 预测引擎 ====================

class PredictionEngine:
    """预测引擎 - 核心预测逻辑"""
    
    def __init__(self):
        self.data_generator = DataGenerator()
        self.scoring_engine = ScoringEngine()
        self.signal_generator = SignalGenerator()
    
    def predict_stock(self, stock: StockConfig) -> PredictionResult:
        """对单只股票进行预测"""
        
        # 1. 生成基础数据
        price_data = self.data_generator.generate_price_data(stock)
        technical_data = self.data_generator.generate_technical_data()
        fundamental_data = self.data_generator.generate_fundamental_data(stock)
        sentiment_data = self.data_generator.generate_sentiment_data()
        sector_data = self.data_generator.generate_sector_data()
        
        # 2. 计算各项评分
        technical_score = self.scoring_engine.calculate_technical_score(technical_data)
        fundamental_score = self.scoring_engine.calculate_fundamental_score(fundamental_data, stock.sector)
        sentiment_score = self.scoring_engine.calculate_sentiment_score(sentiment_data)
        sector_score = self.scoring_engine.calculate_sector_score(sector_data)
        
        # 3. 计算综合评分
        final_score = self.scoring_engine.calculate_final_score(
            technical_score, fundamental_score, sentiment_score, sector_score
        )
        
        # 4. 生成信号和理由
        signal, confidence, reasons = self.signal_generator.generate_signal(final_score, stock)
        
        return PredictionResult(
            stock=stock,
            current_price=price_data[0],
            change_percent=price_data[1],
            technical_score=technical_score,
            fundamental_score=fundamental_score,
            sentiment_score=sentiment_score,
            sector_score=sector_score,
            final_score=final_score,
            signal=signal,
            confidence=confidence,
            reasons=reasons,
            prediction_time=datetime.now()
        )
    
    def predict_portfolio(self, stocks: List[StockConfig]) -> List[PredictionResult]:
        """对股票组合进行预测"""
        
        results = []
        for stock in stocks:
            result = self.predict_stock(stock)
            results.append(result)
        
        # 按综合评分排序
        results.sort(key=lambda x: x.final_score, reverse=True)
        return results


# ==================== 数据生成器 ====================

class DataGenerator:
    """数据生成器 - 模拟真实市场数据"""
    
    @staticmethod
    def generate_price_data(stock: StockConfig) -> Tuple[float, float]:
        """生成价格数据"""
        base_price = 100 + stock.weight * 50
        price_change = random.uniform(-0.03, 0.03)
        current_price = base_price * (1 + price_change)
        return round(current_price, 2), round(price_change * 100, 2)
    
    @staticmethod
    def generate_technical_data() -> Dict:
        """生成技术指标数据"""
        return {
            'rsi': random.randint(20, 80),
            'macd_signal': random.choice(['金叉', '死叉', '中性']),
            'bollinger_position': random.uniform(-2, 2),
            'volume_ratio': random.uniform(0.6, 1.8),
            'momentum_5d': random.uniform(-0.05, 0.05)
        }
    
    @staticmethod
    def generate_fundamental_data(stock: StockConfig) -> Dict:
        """生成基本面数据"""
        sector_benchmarks = ConfigManager.get_sector_benchmark(stock.sector)
        
        return {
            'pe_ratio': random.uniform(sector_benchmarks['pe_avg'] * 0.7, sector_benchmarks['pe_avg'] * 1.3),
            'pb_ratio': random.uniform(sector_benchmarks['pb_avg'] * 0.7, sector_benchmarks['pb_avg'] * 1.3),
            'roe': random.uniform(sector_benchmarks['roe_avg'] * 0.8, sector_benchmarks['roe_avg'] * 1.2),
            'growth_rate': random.uniform(sector_benchmarks['growth_avg'] * 0.5, sector_benchmarks['growth_avg'] * 1.5),
            'debt_ratio': random.uniform(0.2, 0.7),
            'dividend_yield': random.uniform(0.5, 4.0)
        }
    
    @staticmethod
    def generate_sentiment_data() -> Dict:
        """生成情绪数据"""
        return {
            'market_heat': random.randint(1, 10),
            'institution_attention': random.randint(1, 10),
            'retail_sentiment': random.choice(['恐慌', '谨慎', '中性', '乐观', '狂热']),
            'news_sentiment': random.choice(['负面', '中性', '正面'])
        }
    
    @staticmethod
    def generate_sector_data() -> Dict:
        """生成行业数据"""
        return {
            'prosperity': random.randint(3, 9),
            'policy_support': random.randint(3, 9),
            'capital_flow': random.randint(2, 9),
            'rotation_position': random.randint(3, 9)
        }


# ==================== 评分引擎 ====================

class ScoringEngine:
    """评分引擎 - 计算各项评分"""
    
    def calculate_technical_score(self, data: Dict) -> float:
        """计算技术面评分"""
        
        # RSI评分 (0-10分)
        rsi = data['rsi']
        rsi_score = 9 if rsi < 25 else 7 if rsi < 35 else 5 if rsi < 45 else 4 if rsi < 55 else 3 if rsi < 65 else 2 if rsi < 75 else 1
        
        # MACD评分
        macd_scores = {'金叉': 9, '死叉': 2, '中性': 5}
        macd_score = macd_scores.get(data['macd_signal'], 5)
        
        # 布林带评分
        bollinger = data['bollinger_position']
        bollinger_score = 9 if bollinger < -1.5 else 7 if bollinger < -0.5 else 5 if bollinger < 0.5 else 3 if bollinger < 1.5 else 1
        
        # 成交量评分
        volume = data['volume_ratio']
        volume_score = 8 if volume > 1.4 else 6 if volume > 1.1 else 4 if volume > 0.8 else 2
        
        # 动量评分
        momentum = data['momentum_5d']
        momentum_score = 8 if momentum > 0.02 else 6 if momentum > 0 else 4 if momentum > -0.02 else 2
        
        return round((rsi_score + macd_score + bollinger_score + volume_score + momentum_score) / 5, 1)
    
    def calculate_fundamental_score(self, data: Dict, sector: str) -> float:
        """计算基本面评分"""
        
        benchmark = ConfigManager.get_sector_benchmark(sector)
        
        # 估值评分
        pe_score = 8 if data['pe_ratio'] < benchmark['pe_avg'] * 0.8 else 6 if data['pe_ratio'] < benchmark['pe_avg'] else 4 if data['pe_ratio'] < benchmark['pe_avg'] * 1.2 else 2
        pb_score = 8 if data['pb_ratio'] < benchmark['pb_avg'] * 0.8 else 6 if data['pb_ratio'] < benchmark['pb_avg'] else 4 if data['pb_ratio'] < benchmark['pb_avg'] * 1.2 else 2
        
        # 盈利能力评分
        roe_score = 9 if data['roe'] > benchmark['roe_avg'] * 1.2 else 7 if data['roe'] > benchmark['roe_avg'] else 5 if data['roe'] > benchmark['roe_avg'] * 0.8 else 3
        growth_score = 9 if data['growth_rate'] > benchmark['growth_avg'] * 1.2 else 7 if data['growth_rate'] > benchmark['growth_avg'] else 5 if data['growth_rate'] > benchmark['growth_avg'] * 0.8 else 3
        
        # 财务健康评分
        debt_score = 8 if data['debt_ratio'] < 0.3 else 6 if data['debt_ratio'] < 0.5 else 4 if data['debt_ratio'] < 0.7 else 2
        dividend_score = 8 if data['dividend_yield'] > 3 else 6 if data['dividend_yield'] > 2 else 4 if data['dividend_yield'] > 1 else 2
        
        return round((pe_score + pb_score + roe_score + growth_score + debt_score + dividend_score) / 6, 1)
    
    def calculate_sentiment_score(self, data: Dict) -> float:
        """计算情绪面评分"""
        
        heat_score = data['market_heat']
        attention_score = data['institution_attention']
        
        sentiment_map = {'恐慌': 2, '谨慎': 4, '中性': 6, '乐观': 8, '狂热': 4}
        retail_score = sentiment_map.get(data['retail_sentiment'], 6)
        
        news_scores = {'负面': 3, '中性': 6, '正面': 8}
        news_score = news_scores.get(data['news_sentiment'], 6)
        
        return round((heat_score + attention_score + retail_score + news_score) / 4, 1)
    
    def calculate_sector_score(self, data: Dict) -> float:
        """计算行业评分"""
        
        return round((data['prosperity'] + data['policy_support'] + data['capital_flow'] + data['rotation_position']) / 4, 1)
    
    def calculate_final_score(self, technical: float, fundamental: float, sentiment: float, sector: float) -> float:
        """计算综合评分"""
        
        weights = ConfigManager.SCORE_WEIGHTS
        final_score = (
            technical * weights['technical'] +
            fundamental * weights['fundamental'] +
            sentiment * weights['sentiment'] +
            sector * weights['sector']
        )
        return round(final_score, 1)


# ==================== 信号生成器 ====================

class SignalGenerator:
    """信号生成器 - 生成交易信号和理由"""
    
    def generate_signal(self, final_score: float, stock: StockConfig) -> Tuple[str, int, List[str]]:
        """生成交易信号"""
        
        thresholds = ConfigManager.SIGNAL_THRESHOLDS
        
        if final_score >= thresholds['strong_buy']:
            signal = SignalType.STRONG_BUY
            confidence = random.randint(85, 95)
        elif final_score >= thresholds['buy']:
            signal = SignalType.BUY
            confidence = random.randint(70, 85)
        elif final_score >= thresholds['hold']:
            signal = SignalType.HOLD
            confidence = random.randint(50, 70)
        elif final_score >= thresholds['sell']:
            signal = SignalType.SELL
            confidence = random.randint(60, 75)
        else:
            signal = SignalType.STRONG_SELL
            confidence = random.randint(75, 90)
        
        reasons = self._generate_reasons(final_score, stock)
        
        return signal.value, confidence, reasons
    
    def _generate_reasons(self, final_score: float, stock: StockConfig) -> List[str]:
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
        
        if stock.sector in sector_reasons:
            reasons.extend(random.sample(sector_reasons[stock.sector], 1))
        
        return reasons[:2]  # 限制为2个理由


# ==================== 总结引擎 ====================

class SummaryEngine:
    """总结引擎 - 基于预测结果生成总结报告"""
    
    def generate_summary(self, predictions: List[PredictionResult], analysis_type: str) -> SummaryReport:
        """生成总结报告"""
        
        # 分类推荐
        buy_recommendations = [p for p in predictions if p.final_score >= 7.0][:3]
        sell_recommendations = [p for p in predictions if p.final_score < 5.0][:2]
        hold_recommendations = [p for p in predictions if 5.0 <= p.final_score < 7.0][:2]
        
        # 市场概况
        market_overview = self._generate_market_overview(predictions, buy_recommendations, sell_recommendations, hold_recommendations)
        
        # 行业分析
        sector_analysis = self._generate_sector_analysis(predictions)
        
        # 风险提示
        risk_alerts = self._generate_risk_alerts(predictions)
        
        # 下一步行动
        next_actions = self._generate_next_actions(analysis_type, predictions)
        
        return SummaryReport(
            report_time=datetime.now(),
            analysis_type=analysis_type,
            buy_recommendations=buy_recommendations,
            sell_recommendations=sell_recommendations,
            hold_recommendations=hold_recommendations,
            market_overview=market_overview,
            sector_analysis=sector_analysis,
            risk_alerts=risk_alerts,
            next_actions=next_actions
        )
    
    def _generate_market_overview(self, predictions: List[PredictionResult], buy: List[PredictionResult], 
                                sell: List[PredictionResult], hold: List[PredictionResult]) -> Dict:
        """生成市场概况"""
        
        total_buy = len(buy)
        total_sell = len(sell)
        total_hold = len(hold)
        
        avg_buy_score = sum(p.final_score for p in buy) / total_buy if total_buy > 0 else 0
        avg_sell_score = sum(p.final_score for p in sell) / total_sell if total_sell > 0 else 0
        avg_hold_score = sum(p.final_score for p in hold) / total_hold if total_hold > 0 else 0
        
        buy_sectors = list(set(p.stock.sector for p in buy))
        sell_sectors = list(set(p.stock.sector for p in sell))
        hold_sectors = list(set(p.stock.sector for p in hold))
        
        return {
            'total_stocks': len(predictions),
            'buy_count': total_buy,
            'sell_count': total_sell,
            'hold_count': total_hold,
            'avg_buy_score': round(avg_buy_score, 1),
            'avg_sell_score': round(avg_sell_score, 1),
            'avg_hold_score': round(avg_hold_score, 1),
            'buy_sectors': buy_sectors,
            'sell_sectors': sell_sectors,
            'hold_sectors': hold_sectors,
            'market_sentiment': '乐观' if avg_buy_score > avg_sell_score else '谨慎' if avg_sell_score > avg_buy_score else '中性'
        }
    
    def _generate_sector_analysis(self, predictions: List[PredictionResult]) -> Dict:
        """生成行业分析"""
        
        sector_scores = {}
        for pred in predictions:
            sector = pred.stock.sector
            if sector not in sector_scores:
                sector_scores[sector] = []
            sector_scores[sector].append(pred.final_score)
        
        sector_analysis = {}
        for sector, scores in sector_scores.items():
            avg_score = sum(scores) / len(scores)
            sector_analysis[sector] = {
                'avg_score': round(avg_score, 1),
                'stock_count': len(scores),
                'trend': '强势' if avg_score > 6 else '弱势' if avg_score < 4 else '震荡'
            }
        
        return sector_analysis
    
    def _generate_risk_alerts(self, predictions: List[PredictionResult]) -> List[str]:
        """生成风险提示"""
        
        alerts = []
        
        # 检查是否有大量卖出信号
        sell_count = len([p for p in predictions if p.final_score < 5])
        if sell_count > len(predictions) * 0.4:
            alerts.append("市场卖出信号较多，注意风险控制")
        
        # 检查是否有极端分数
        extreme_scores = [p for p in predictions if p.final_score < 2 or p.final_score > 9]
        if extreme_scores:
            alerts.append(f"发现{len(extreme_scores)}只股票评分极端，需谨慎对待")
        
        # 检查行业风险
        sector_analysis = self._generate_sector_analysis(predictions)
        weak_sectors = [s for s, data in sector_analysis.items() if data['avg_score'] < 4]
        if weak_sectors:
            alerts.append(f"弱势行业: {', '.join(weak_sectors)}")
        
        return alerts[:3]  # 限制为3个提示
    
    def _generate_next_actions(self, analysis_type: str, predictions: List[PredictionResult]) -> List[str]:
        """生成下一步行动建议"""
        
        actions = []
        
        if analysis_type == 'morning':
            actions.append("关注开盘后的量价配合情况")
            actions.append("观察昨夜美股对A股的影响")
            actions.append("留意早盘资金流入方向")
        elif analysis_type == 'afternoon':
            actions.append("关注午后资金动向")
            actions.append("观察上午强势股的持续性")
            actions.append("留意尾盘异动情况")
        elif analysis_type == 'evening':
            actions.append("总结全天市场表现")
            actions.append("为次日交易做准备")
            actions.append("关注晚间重要消息")
        elif analysis_type == 'weekly':
            actions.append("回顾本周交易策略执行情况")
            actions.append("制定下周投资计划")
            actions.append("关注周末政策消息")
        
        return actions


# ==================== 配置管理器 ====================

class ConfigManager:
    """配置管理器"""
    
    # 股票池配置
    CORE_STOCKS = [
        StockConfig('贵州茅台', '600519', '白酒', 0.9),
        StockConfig('宁德时代', '300750', '新能源', 0.8),
        StockConfig('招商银行', '600036', '银行', 0.7),
        StockConfig('五粮液', '000858', '白酒', 0.6),
        StockConfig('恒瑞医药', '600276', '医药', 0.5),
        StockConfig('比亚迪', '002594', '新能源', 0.4),
        StockConfig('海康威视', '002415', '科技', 0.3),
        StockConfig('伊利股份', '600887', '消费', 0.2),
        StockConfig('万科A', '000002', '地产', 0.1),
        StockConfig('京东方A', '000725', '面板', 0.0)
    ]
    
    # 行业基准配置
    SECTOR_BENCHMARKS = {
        '白酒': {'pe_avg': 28, 'pb_avg': 7, 'roe_avg': 22, 'growth_avg': 15},
        '新能源': {'pe_avg': 35, 'pb_avg': 4, 'roe_avg': 16, 'growth_avg': 25},
        '银行': {'pe_avg': 6, 'pb_avg': 0.9, 'roe_avg': 12, 'growth_avg': 8},
        '医药': {'pe_avg': 32, 'pb_avg': 4, 'roe_avg': 15, 'growth_avg': 18},
        '科技': {'pe_avg': 38, 'pb_avg': 5, 'roe_avg': 18, 'growth_avg': 20},
        '消费': {'pe_avg': 26, 'pb_avg': 4, 'roe_avg': 16, 'growth_avg': 12},
        '地产': {'pe_avg': 8, 'pb_avg': 1.2, 'roe_avg': 10, 'growth_avg': 5},
        '面板': {'pe_avg': 15, 'pb_avg': 2, 'roe_avg': 12, 'growth_avg': 10}
    }
    
    # 评分权重配置
    SCORE_WEIGHTS = {
        'technical': 0.40,
        'fundamental': 0.35,
        'sentiment': 0.15,
        'sector': 0.10
    }
    
    # 信号阈值配置
    SIGNAL_THRESHOLDS = {
        'strong_buy': 8.5,
        'buy': 7.0,
        'hold': 5.0,
        'sell': 3.5
    }
    
    @classmethod
    def get_sector_benchmark(cls, sector: str) -> Dict[str, float]:
        """获取行业基准"""
        return cls.SECTOR_BENCHMARKS.get(sector, {
            'pe_avg': 20, 'pb_avg': 3, 'roe_avg': 15, 'growth_avg': 15
        })


# ==================== 报告生成器 ====================

class ReportGenerator:
    """报告生成器 - 生成文本报告"""
    
    def __init__(self, base_dir: Optional[str] = None):
        root = base_dir or _default_stock_system_root()
        self.base_dir = Path(root)
        self.data_dir = self.base_dir / "data"
        self.reports_dir = self.base_dir / "reports"
        self.logs_dir = self.base_dir / "logs"
        
        # 确保目录存在
        self.data_dir.mkdir(exist_ok=True)
        self.reports_dir.mkdir(exist_ok=True)
        self.logs_dir.mkdir(exist_ok=True)
    
    def generate_prediction_report(self, predictions: List[PredictionResult], analysis_type: str) -> str:
        """生成预测报告"""
        
        report_lines = []
        report_lines.append(f"【A股{self._get_analysis_type_name(analysis_type)}预测报告】")
        report_lines.append("=" * 60)
        report_lines.append(f"预测时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append(f"分析类型: {self._get_analysis_type_name(analysis_type)}")
        report_lines.append("=" * 60)
        
        # 分类预测结果
        buy_predictions = [p for p in predictions if p.final_score >= 7.0]
        sell_predictions = [p for p in predictions if p.final_score < 5.0]
        hold_predictions = [p for p in predictions if 5.0 <= p.final_score < 7.0]
        
        # 买入预测
        if buy_predictions:
            report_lines.append(f"\n【买入预测】 ({len(buy_predictions)}只)")
            for i, pred in enumerate(buy_predictions, 1):
                self._add_prediction_detail(i, pred, report_lines)
        
        # 卖出预测
        if sell_predictions:
            report_lines.append(f"\n【卖出预测】 ({len(sell_predictions)}只)")
            for i, pred in enumerate(sell_predictions, 1):
                self._add_prediction_detail(i, pred, report_lines)
        
        # 持有预测
        if hold_predictions:
            report_lines.append(f"\n【持有预测】 ({len(hold_predictions)}只)")
            for i, pred in enumerate(hold_predictions, 1):
                self._add_prediction_detail(i, pred, report_lines)
        
        # 预测统计
        self._add_prediction_statistics(predictions, buy_predictions, sell_predictions, hold_predictions, report_lines)
        
        return "\n".join(report_lines)
    
    def generate_summary_report(self, summary: SummaryReport) -> str:
        """生成总结报告"""
        
        report_lines = []
        report_lines.append(f"【A股{self._get_analysis_type_name(summary.analysis_type)}总结报告】")
        report_lines.append("=" * 60)
        report_lines.append(f"总结时间: {summary.report_time.strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append(f"分析类型: {self._get_analysis_type_name(summary.analysis_type)}")
        report_lines.append("=" * 60)
        
        # 推荐总结
        self._add_recommendation_summary(summary, report_lines)
        
        # 市场概况
        self._add_market_overview_summary(summary.market_overview, report_lines)
        
        # 行业分析
        self._add_sector_analysis_summary(summary.sector_analysis, report_lines)
        
        # 风险提示
        if summary.risk_alerts:
            report_lines.append(f"\n【风险提示】")
            for i, alert in enumerate(summary.risk_alerts, 1):
                report_lines.append(f"{i}. {alert}")
        
        # 下一步行动
        if summary.next_actions:
            report_lines.append(f"\n【下一步行动】")
            for i, action in enumerate(summary.next_actions, 1):
                report_lines.append(f"{i}. {action}")
        
        return "\n".join(report_lines)
    
    def save_results(self, predictions: List[PredictionResult], summary: SummaryReport, 
                    prediction_report: str, summary_report: str, analysis_type: str) -> Dict[str, str]:
        """保存结果到文件"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 保存预测数据
        prediction_data = {
            'timestamp': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'predictions': [pred.to_dict() for pred in predictions],
            'prediction_count': len(predictions)
        }
        
        prediction_file = self.data_dir / f"predictions_{analysis_type}_{timestamp}.json"
        with open(prediction_file, 'w', encoding='utf-8') as f:
            json.dump(prediction_data, f, ensure_ascii=False, indent=2)
        
        # 保存总结数据
        summary_data = {
            'timestamp': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'summary': summary.to_dict(),
            'report_text': summary_report
        }
        
        summary_file = self.data_dir / f"summary_{analysis_type}_{timestamp}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary_data, f, ensure_ascii=False, indent=2)
        
        # 保存预测报告文本
        prediction_report_file = self.reports_dir / f"prediction_report_{analysis_type}_{timestamp}.txt"
        with open(prediction_report_file, 'w', encoding='utf-8') as f:
            f.write(prediction_report)
        
        # 保存总结报告文本
        summary_report_file = self.reports_dir / f"summary_report_{analysis_type}_{timestamp}.txt"
        with open(summary_report_file, 'w', encoding='utf-8') as f:
            f.write(summary_report)
        
        return {
            'prediction_data': str(prediction_file),
            'summary_data': str(summary_file),
            'prediction_report': str(prediction_report_file),
            'summary_report': str(summary_report_file)
        }
    
    def _get_analysis_type_name(self, analysis_type: str) -> str:
        """获取分析类型中文名称"""
        names = {
            'morning': '早盘',
            'afternoon': '午盘',
            'evening': '收盘',
            'weekly': '周度'
        }
        return names.get(analysis_type, analysis_type)
    
    def _add_prediction_detail(self, index: int, pred: PredictionResult, report_lines: List[str]):
        """添加预测详情"""
        report_lines.append(f"{index}. {pred.stock.name} ({pred.stock.symbol})")
        report_lines.append(f"   行业: {pred.stock.sector} | 综合评分: {pred.final_score}/10")
        report_lines.append(f"   当前价: ¥{pred.current_price:.2f} ({pred.change_percent:+.2f}%)")
        report_lines.append(f"   信号: {pred.signal} | 信心度: {pred.confidence}%")
        report_lines.append(f"   技术面: {pred.technical_score}/10 | 基本面: {pred.fundamental_score}/10")
        report_lines.append(f"   情绪面: {pred.sentiment_score}/10 | 行业面: {pred.sector_score}/10")
        report_lines.append(f"   预测理由: {'; '.join(pred.reasons)}")
        report_lines.append("")
    
    def _add_prediction_statistics(self, predictions: List[PredictionResult], 
                                 buy: List[PredictionResult], sell: List[PredictionResult], 
                                 hold: List[PredictionResult], report_lines: List[str]):
        """添加预测统计"""
        
        report_lines.append(f"\n【预测统计】")
        report_lines.append(f"总预测股票数: {len(predictions)}")
        report_lines.append(f"买入预测: {len(buy)}只")
        report_lines.append(f"卖出预测: {len(sell)}只") 
        report_lines.append(f"持有预测: {len(hold)}只")
        
        if buy:
            avg_buy_score = sum(p.final_score for p in buy) / len(buy)
            report_lines.append(f"买入预测平均评分: {avg_buy_score:.1f}分")
        
        if sell:
            avg_sell_score = sum(p.final_score for p in sell) / len(sell)
            report_lines.append(f"卖出预测平均评分: {avg_sell_score:.1f}分")
        
        if hold:
            avg_hold_score = sum(p.final_score for p in hold) / len(hold)
            report_lines.append(f"持有预测平均评分: {avg_hold_score:.1f}分")
        
        # 行业分布
        buy_sectors = list(set(p.stock.sector for p in buy))
        sell_sectors = list(set(p.stock.sector for p in sell))
        
        if buy_sectors:
            report_lines.append(f"买入预测行业: {', '.join(buy_sectors)}")
        if sell_sectors:
            report_lines.append(f"卖出预测行业: {', '.join(sell_sectors)}")
    
    def _add_recommendation_summary(self, summary: SummaryReport, report_lines: List[str]):
        """添加推荐总结"""
        
        report_lines.append(f"\n【推荐总结】")
        
        if summary.buy_recommendations:
            report_lines.append(f"买入推荐 ({len(summary.buy_recommendations)}只):")
            for i, rec in enumerate(summary.buy_recommendations, 1):
                report_lines.append(f"  {i}. {rec.stock.name} ({rec.stock.symbol}) - 评分:{rec.final_score}")
        
        if summary.sell_recommendations:
            report_lines.append(f"卖出推荐 ({len(summary.sell_recommendations)}只):")
            for i, rec in enumerate(summary.sell_recommendations, 1):
                report_lines.append(f"  {i}. {rec.stock.name} ({rec.stock.symbol}) - 评分:{rec.final_score}")
        
        if summary.hold_recommendations:
            report_lines.append(f"持有推荐 ({len(summary.hold_recommendations)}只):")
            for i, rec in enumerate(summary.hold_recommendations, 1):
                report_lines.append(f"  {i}. {rec.stock.name} ({rec.stock.symbol}) - 评分:{rec.final_score}")
    
    def _add_market_overview_summary(self, market_overview: Dict, report_lines: List[str]):
        """添加市场概况总结"""
        
        report_lines.append(f"\n【市场概况】")
        report_lines.append(f"总股票数: {market_overview['total_stocks']}")
        report_lines.append(f"买入推荐: {market_overview['buy_count']}只 | 平均评分: {market_overview['avg_buy_score']}")
        report_lines.append(f"卖出推荐: {market_overview['sell_count']}只 | 平均评分: {market_overview['avg_sell_score']}")
        report_lines.append(f"持有推荐: {market_overview['hold_count']}只 | 平均评分: {market_overview['avg_hold_score']}")
        report_lines.append(f"市场情绪: {market_overview['market_sentiment']}")
    
    def _add_sector_analysis_summary(self, sector_analysis: Dict, report_lines: List[str]):
        """添加行业分析总结"""
        
        if sector_analysis:
            report_lines.append(f"\n【行业分析】")
            for sector, data in sector_analysis.items():
                report_lines.append(f"{sector}: 平均评分{data['avg_score']} ({data['trend']}, {data['stock_count']}只股票)")


# ==================== 主分析器 ====================

class StockAnalyzer:
    """股票分析器 - 遵循"先预测再总结"理念"""
    
    def __init__(self, base_dir: Optional[str] = None):
        root = base_dir or _default_stock_system_root()
        self.prediction_engine = PredictionEngine()
        self.summary_engine = SummaryEngine()
        self.report_generator = ReportGenerator(root)
        self.base_dir = Path(root)
    
    def analyze(self, analysis_type: str = "evening") -> Dict[str, any]:
        """执行完整分析流程 - 先预测再总结"""
        
        print(f"🚀 开始{self._get_analysis_type_name(analysis_type)}分析...")
        print("📊 第一步: 生成个股预测...")
        
        # 第一步: 预测阶段 - 对每只股票进行独立预测
        predictions = self.prediction_engine.predict_portfolio(ConfigManager.CORE_STOCKS)
        
        print(f"✅ 预测完成，共{len(predictions)}只股票")
        print("📋 第二步: 生成总结报告...")
        
        # 第二步: 总结阶段 - 基于所有预测结果生成总结
        summary = self.summary_engine.generate_summary(predictions, analysis_type)
        
        print("✅ 总结报告生成完成")
        print("📝 第三步: 生成文本报告...")
        
        # 第三步: 生成文本报告
        prediction_report = self.report_generator.generate_prediction_report(predictions, analysis_type)
        summary_report = self.report_generator.generate_summary_report(summary)
        
        print("✅ 文本报告生成完成")
        print("💾 第四步: 保存结果...")
        
        # 第四步: 保存所有结果
        saved_files = self.report_generator.save_results(
            predictions, summary, prediction_report, summary_report, analysis_type
        )
        
        print("✅ 结果保存完成")
        
        return {
            'predictions': predictions,
            'summary': summary,
            'prediction_report': prediction_report,
            'summary_report': summary_report,
            'saved_files': saved_files,
            'analysis_type': analysis_type
        }
    
    def _get_analysis_type_name(self, analysis_type: str) -> str:
        """获取分析类型中文名称"""
        names = {
            'morning': '早盘',
            'afternoon': '午盘',
            'evening': '收盘',
            'weekly': '周度'
        }
        return names.get(analysis_type, analysis_type)


# ==================== 主函数 ====================

def main():
    """主函数"""
    
    print("🚀 启动A股分析系统 (符合\"先预测再总结\"理念)")
    print("=" * 70)
    print(f"系统时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # 创建分析器
    analyzer = StockAnalyzer()
    
    # 执行分析（默认收盘分析）
    result = analyzer.analyze("evening")
    
    # 显示结果
    print("\n📊 分析结果:")
    print("=" * 70)
    print(result['summary_report'])
    
    print("\n💾 文件保存位置:")
    for file_type, file_path in result['saved_files'].items():
        print(f"  {file_type}: {file_path}")
    
    print("\n✅ 分析完成！")
    print("🎯 系统特点:")
    print("  ✓ 先预测: 对每只股票进行独立预测分析")
    print("  ✓ 再总结: 基于所有预测结果生成综合总结")
    print("  ✓ 结构化: 清晰的预测->总结流程")
    print("  ✓ 文件管理: 所有文件统一保存在指定目录")


if __name__ == "__main__":
    main()
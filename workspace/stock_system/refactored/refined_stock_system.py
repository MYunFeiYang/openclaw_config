#!/usr/bin/env python3
"""
A股分析系统 - 项目重构方案
提供完整的模块化架构和清晰的代码组织
"""

# 项目结构建议:
"""
stock_analysis_system/
├── core/
│   ├── __init__.py
│   ├── models.py          # 数据模型
│   ├── analyzer.py        # 核心分析器
│   └── config.py          # 配置管理
├── analysis/
│   ├── __init__.py
│   ├── technical.py       # 技术分析
│   ├── fundamental.py     # 基本面分析
│   ├── sentiment.py       # 情绪分析
│   └── sector.py          # 行业分析
├── utils/
│   ├── __init__.py
│   ├── data_provider.py   # 数据获取
│   ├── report_generator.py # 报告生成
│   └── signal_generator.py # 信号生成
├── main.py                # 主程序
├── requirements.txt       # 依赖
└── README.md             # 文档
"""

import json
import random
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple
from enum import Enum
from pathlib import Path


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
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class TechnicalIndicators:
    """技术指标数据"""
    rsi: float
    macd_signal: str
    bollinger_position: float
    volume_ratio: float
    momentum_5d: float
    
    def get_rsi_score(self) -> float:
        """RSI评分 (0-10)"""
        if self.rsi < 25: return 9
        elif self.rsi < 35: return 7
        elif self.rsi < 45: return 5
        elif self.rsi < 55: return 4
        elif self.rsi < 65: return 3
        elif self.rsi < 75: return 2
        else: return 1
    
    def get_macd_score(self) -> float:
        """MACD评分 (0-10)"""
        scores = {'金叉': 9, '死叉': 2, '中性': 5}
        return scores.get(self.macd_signal, 5)
    
    def get_bollinger_score(self) -> float:
        """布林带评分 (0-10)"""
        if self.bollinger_position < -1.5: return 9
        elif self.bollinger_position < -0.5: return 7
        elif self.bollinger_position < 0.5: return 5
        elif self.bollinger_position < 1.5: return 3
        else: return 1
    
    def get_volume_score(self) -> float:
        """成交量评分 (0-10)"""
        if self.volume_ratio > 1.4: return 8
        elif self.volume_ratio > 1.1: return 6
        elif self.volume_ratio > 0.8: return 4
        else: return 2
    
    def get_momentum_score(self) -> float:
        """动量评分 (0-10)"""
        if self.momentum_5d > 0.02: return 8
        elif self.momentum_5d > 0: return 6
        elif self.momentum_5d > -0.02: return 4
        else: return 2


@dataclass
class FundamentalData:
    """基本面数据"""
    pe_ratio: float
    pb_ratio: float
    roe: float
    growth_rate: float
    debt_ratio: float
    dividend_yield: float
    
    def get_pe_score(self, benchmark_pe: float) -> float:
        """PE评分 (0-10)"""
        if self.pe_ratio < benchmark_pe * 0.8: return 8
        elif self.pe_ratio < benchmark_pe: return 6
        elif self.pe_ratio < benchmark_pe * 1.2: return 4
        else: return 2
    
    def get_pb_score(self, benchmark_pb: float) -> float:
        """PB评分 (0-10)"""
        if self.pb_ratio < benchmark_pb * 0.8: return 8
        elif self.pb_ratio < benchmark_pb: return 6
        elif self.pb_ratio < benchmark_pb * 1.2: return 4
        else: return 2
    
    def get_roe_score(self, benchmark_roe: float) -> float:
        """ROE评分 (0-10)"""
        if self.roe > benchmark_roe * 1.2: return 9
        elif self.roe > benchmark_roe: return 7
        elif self.roe > benchmark_roe * 0.8: return 5
        else: return 3
    
    def get_growth_score(self, benchmark_growth: float) -> float:
        """增长评分 (0-10)"""
        if self.growth_rate > benchmark_growth * 1.2: return 9
        elif self.growth_rate > benchmark_growth: return 7
        elif self.growth_rate > benchmark_growth * 0.8: return 5
        else: return 3
    
    def get_debt_score(self) -> float:
        """负债评分 (0-10)"""
        if self.debt_ratio < 0.3: return 8
        elif self.debt_ratio < 0.5: return 6
        elif self.debt_ratio < 0.7: return 4
        else: return 2
    
    def get_dividend_score(self) -> float:
        """股息评分 (0-10)"""
        if self.dividend_yield > 3: return 8
        elif self.dividend_yield > 2: return 6
        elif self.dividend_yield > 1: return 4
        else: return 2


@dataclass
class SentimentData:
    """情绪数据"""
    market_heat: float
    institution_attention: float
    retail_sentiment: str
    news_sentiment: str
    
    def get_heat_score(self) -> float:
        """市场热度评分 (0-10)"""
        return self.market_heat
    
    def get_attention_score(self) -> float:
        """机构关注度评分 (0-10)"""
        return self.institution_attention
    
    def get_retail_score(self) -> float:
        """散户情绪评分 (0-10)"""
        sentiment_map = {'恐慌': 2, '谨慎': 4, '中性': 6, '乐观': 8, '狂热': 4}
        return sentiment_map.get(self.retail_sentiment, 6)
    
    def get_news_score(self) -> float:
        """新闻情绪评分 (0-10)"""
        news_scores = {'负面': 3, '中性': 6, '正面': 8}
        return news_scores.get(self.news_sentiment, 6)


@dataclass
class SectorData:
    """行业数据"""
    prosperity: float
    policy_support: float
    capital_flow: float
    rotation_position: float
    
    def get_prosperity_score(self) -> float:
        """行业景气度评分 (0-10)"""
        return self.prosperity
    
    def get_policy_score(self) -> float:
        """政策支持评分 (0-10)"""
        return self.policy_support
    
    def get_capital_score(self) -> float:
        """资金流入评分 (0-10)"""
        return self.capital_flow
    
    def get_rotation_score(self) -> float:
        """行业轮动评分 (0-10)"""
        return self.rotation_position


@dataclass
class AnalysisResult:
    """分析结果"""
    stock: StockConfig
    current_price: float
    change_percent: float
    final_score: float
    technical_score: float
    fundamental_score: float
    sentiment_score: float
    sector_score: float
    signal: str
    confidence: int
    reasons: List[str]
    analysis_time: datetime
    
    def to_dict(self) -> Dict:
        return {
            'stock': self.stock.to_dict(),
            'current_price': self.current_price,
            'change_percent': self.change_percent,
            'final_score': self.final_score,
            'technical_score': self.technical_score,
            'fundamental_score': self.fundamental_score,
            'sentiment_score': self.sentiment_score,
            'sector_score': self.sector_score,
            'signal': self.signal,
            'confidence': self.confidence,
            'reasons': self.reasons,
            'analysis_time': self.analysis_time.isoformat()
        }


# ==================== 配置管理 ====================

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


# ==================== 数据生成器 ====================

class DataGenerator:
    """数据生成器 - 模拟真实数据"""
    
    @staticmethod
    def generate_technical_data() -> TechnicalIndicators:
        """生成技术指标数据"""
        return TechnicalIndicators(
            rsi=random.randint(20, 80),
            macd_signal=random.choice(['金叉', '死叉', '中性']),
            bollinger_position=random.uniform(-2, 2),
            volume_ratio=random.uniform(0.6, 1.8),
            momentum_5d=random.uniform(-0.04, 0.04)
        )
    
    @staticmethod
    def generate_fundamental_data(stock: StockConfig) -> FundamentalData:
        """生成基本面数据"""
        benchmark = ConfigManager.get_sector_benchmark(stock.sector)
        
        return FundamentalData(
            pe_ratio=random.uniform(benchmark['pe_avg'] * 0.7, benchmark['pe_avg'] * 1.3),
            pb_ratio=random.uniform(benchmark['pb_avg'] * 0.7, benchmark['pb_avg'] * 1.3),
            roe=random.uniform(benchmark['roe_avg'] * 0.8, benchmark['roe_avg'] * 1.2),
            growth_rate=random.uniform(benchmark['growth_avg'] * 0.5, benchmark['growth_avg'] * 1.5),
            debt_ratio=random.uniform(0.2, 0.7),
            dividend_yield=random.uniform(0.5, 4.0)
        )
    
    @staticmethod
    def generate_sentiment_data() -> SentimentData:
        """生成情绪数据"""
        return SentimentData(
            market_heat=random.randint(1, 10),
            institution_attention=random.randint(1, 10),
            retail_sentiment=random.choice(['恐慌', '谨慎', '中性', '乐观', '狂热']),
            news_sentiment=random.choice(['负面', '中性', '正面'])
        )
    
    @staticmethod
    def generate_sector_data() -> SectorData:
        """生成行业数据"""
        return SectorData(
            prosperity=random.randint(3, 9),
            policy_support=random.randint(3, 9),
            capital_flow=random.randint(2, 9),
            rotation_position=random.randint(3, 9)
        )
    
    @staticmethod
    def generate_price_data(stock: StockConfig) -> Tuple[float, float]:
        """生成价格数据"""
        base_price = 100 + stock.weight * 50
        price_change = random.uniform(-0.02, 0.02)
        current_price = base_price * (1 + price_change)
        return round(current_price, 2), round(price_change * 100, 2)


# ==================== 分析器 ====================

class TechnicalAnalyzer:
    """技术分析器"""
    
    def analyze(self, data: TechnicalIndicators) -> float:
        """分析技术指标"""
        scores = [
            data.get_rsi_score(),
            data.get_macd_score(),
            data.get_bollinger_score(),
            data.get_volume_score(),
            data.get_momentum_score()
        ]
        return sum(scores) / len(scores)


class FundamentalAnalyzer:
    """基本面分析器"""
    
    def analyze(self, data: FundamentalData, sector: str) -> float:
        """分析基本面"""
        benchmark = ConfigManager.get_sector_benchmark(sector)
        
        scores = [
            data.get_pe_score(benchmark['pe_avg']),
            data.get_pb_score(benchmark['pb_avg']),
            data.get_roe_score(benchmark['roe_avg']),
            data.get_growth_score(benchmark['growth_avg']),
            data.get_debt_score(),
            data.get_dividend_score()
        ]
        return sum(scores) / len(scores)


class SentimentAnalyzer:
    """情绪分析器"""
    
    def analyze(self, data: SentimentData) -> float:
        """分析情绪指标"""
        scores = [
            data.get_heat_score(),
            data.get_attention_score(),
            data.get_retail_score(),
            data.get_news_score()
        ]
        return sum(scores) / len(scores)


class SectorAnalyzer:
    """行业分析器"""
    
    def analyze(self, data: SectorData) -> float:
        """分析行业数据"""
        scores = [
            data.get_prosperity_score(),
            data.get_policy_score(),
            data.get_capital_score(),
            data.get_rotation_score()
        ]
        return sum(scores) / len(scores)


# ==================== 信号生成器 ====================

class SignalGenerator:
    """信号生成器"""
    
    @staticmethod
    def generate_signal(final_score: float, stock: StockConfig) -> Tuple[str, int, List[str]]:
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
        
        reasons = SignalGenerator._generate_reasons(final_score, stock)
        
        return signal.value, confidence, reasons
    
    @staticmethod
    def _generate_reasons(final_score: float, stock: StockConfig) -> List[str]:
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


# ==================== 主分析器 ====================

class StockAnalyzer:
    """股票分析器主类"""
    
    def __init__(self):
        self.data_generator = DataGenerator()
        self.technical_analyzer = TechnicalAnalyzer()
        self.fundamental_analyzer = FundamentalAnalyzer()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.sector_analyzer = SectorAnalyzer()
        self.signal_generator = SignalGenerator()
    
    def analyze_stock(self, stock: StockConfig) -> AnalysisResult:
        """分析单只股票"""
        
        # 生成数据
        technical_data = self.data_generator.generate_technical_data()
        fundamental_data = self.data_generator.generate_fundamental_data(stock)
        sentiment_data = self.data_generator.generate_sentiment_data()
        sector_data = self.data_generator.generate_sector_data()
        current_price, change_percent = self.data_generator.generate_price_data(stock)
        
        # 各维度分析
        technical_score = self.technical_analyzer.analyze(technical_data)
        fundamental_score = self.fundamental_analyzer.analyze(fundamental_data, stock.sector)
        sentiment_score = self.sentiment_analyzer.analyze(sentiment_data)
        sector_score = self.sector_analyzer.analyze(sector_data)
        
        # 综合评分
        weights = ConfigManager.SCORE_WEIGHTS
        final_score = (
            technical_score * weights['technical'] +
            fundamental_score * weights['fundamental'] +
            sentiment_score * weights['sentiment'] +
            sector_score * weights['sector']
        )
        
        # 生成信号
        signal, confidence, reasons = self.signal_generator.generate_signal(final_score, stock)
        
        return AnalysisResult(
            stock=stock,
            current_price=current_price,
            change_percent=change_percent,
            final_score=round(final_score, 1),
            technical_score=round(technical_score, 1),
            fundamental_score=round(fundamental_score, 1),
            sentiment_score=round(sentiment_score, 1),
            sector_score=round(sector_score, 1),
            signal=signal,
            confidence=confidence,
            reasons=reasons,
            analysis_time=datetime.now()
        )
    
    def analyze_portfolio(self, stocks: List[StockConfig]) -> List[AnalysisResult]:
        """分析股票组合"""
        
        results = []
        for stock in stocks:
            result = self.analyze_stock(stock)
            results.append(result)
        
        # 按综合评分排序
        results.sort(key=lambda x: x.final_score, reverse=True)
        return results


# ==================== 报告生成器 ====================

class ReportGenerator:
    """报告生成器"""
    
    @staticmethod
    def generate_report(results: List[AnalysisResult]) -> str:
        """生成分析报告"""
        
        # 分类推荐
        buy_recommendations = [r for r in results if r.final_score >= 7.0][:3]
        sell_recommendations = [r for r in results if r.final_score < 5.0][:2]
        
        report_lines = []
        report_lines.append("【A股精选5股 - 专业版预测】")
        report_lines.append("=" * 50)
        report_lines.append(f"预测时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("=" * 50)
        
        # 买入推荐
        if buy_recommendations:
            report_lines.append("\n【买入推荐】")
            for i, result in enumerate(buy_recommendations, 1):
                ReportGenerator._add_stock_analysis(i, result, report_lines)
        
        # 卖出推荐
        if sell_recommendations:
            report_lines.append("\n【卖出推荐】")
            for i, result in enumerate(sell_recommendations, 1):
                ReportGenerator._add_stock_analysis(i, result, report_lines)
        
        # 市场概况
        ReportGenerator._add_market_overview(results, buy_recommendations, sell_recommendations, report_lines)
        
        return "\n".join(report_lines)
    
    @staticmethod
    def _add_stock_analysis(index: int, result: AnalysisResult, report_lines: List[str]):
        """添加股票分析"""
        report_lines.append(f"{index}. {result.stock.name} ({result.stock.symbol})")
        report_lines.append(f"   行业: {result.stock.sector} | 综合评分: {result.final_score}/10")
        report_lines.append(f"   当前价: ¥{result.current_price:.2f} ({result.change_percent:+.2f}%)")
        report_lines.append(f"   信号: {result.signal} | 信心度: {result.confidence}%")
        report_lines.append(f"   技术面: {result.technical_score}/10 | 基本面: {result.fundamental_score}/10")
        report_lines.append(f"   风险提示: {'; '.join(result.reasons)}")
    
    @staticmethod
    def _add_market_overview(results: List[AnalysisResult], buy_recommendations: List[AnalysisResult], 
                           sell_recommendations: List[AnalysisResult], report_lines: List[str]):
        """添加市场概况"""
        
        total_buy = len(buy_recommendations)
        total_sell = len(sell_recommendations)
        avg_buy_score = sum(r.final_score for r in buy_recommendations) / total_buy if total_buy > 0 else 0
        avg_sell_score = sum(r.final_score for r in sell_recommendations) / total_sell if total_sell > 0 else 0
        
        report_lines.append(f"\n【市场概况】")
        report_lines.append(f"买入推荐: {total_buy}只 | 平均评分: {avg_buy_score:.1f}分")
        report_lines.append(f"卖出推荐: {total_sell}只 | 平均评分: {avg_sell_score:.1f}分")
        
        # 行业分布
        buy_sectors = [r.stock.sector for r in buy_recommendations]
        sell_sectors = [r.stock.sector for r in sell_recommendations]
        
        if buy_sectors:
            report_lines.append(f"买入行业: {', '.join(set(buy_sectors))}")
        if sell_sectors:
            report_lines.append(f"卖出行业: {', '.join(set(sell_sectors))}")
        
        report_lines.append(f"\n⚠️ 风险提示: 以上分析基于多因子量化模型，仅供参考，不构成投资建议")
        report_lines.append(f"📊 模型特点: 技术面+基本面+情绪面+行业轮动四维综合分析")
        report_lines.append(f"🎯 预测目标: 追求75%+准确率，为投资决策提供专业参考")
    
    @staticmethod
    def save_results(results: List[AnalysisResult], report: str, output_dir: str = "/Users/thinkway/.openclaw/workspace"):
        """保存分析结果"""
        
        timestamp = datetime.now()
        
        # 保存JSON数据
        result_data = {
            'timestamp': timestamp.isoformat(),
            'report': report,
            'recommendations': [
                result.to_dict() for result in results 
                if result.final_score >= 7.0 or result.final_score < 5.0
            ],
            'model_version': '7.0',
            'features': ['模块化架构', '面向对象设计', '配置分离', '可扩展性', '类型安全']
        }
        
        filename = f"{output_dir}/refined_a_stock_analysis_{timestamp.strftime('%Y%m%d_%H%M')}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)
        
        return filename


# ==================== 主程序 ====================

def main():
    """主函数"""
    
    print("🚀 启动A股分析系统 (重构版)")
    print("=" * 50)
    
    # 初始化分析器
    analyzer = StockAnalyzer()
    
    # 分析股票组合
    print("📊 正在分析股票组合...")
    results = analyzer.analyze_portfolio(ConfigManager.CORE_STOCKS)
    
    # 生成报告
    print("📝 正在生成分析报告...")
    report = ReportGenerator.generate_report(results)
    
    # 显示报告
    print(report)
    
    # 保存结果
    print("💾 正在保存分析结果...")
    filename = ReportGenerator.save_results(results, report)
    
    print(f"\n✅ 分析完成！")
    print(f"📁 结果已保存至: {filename}")
    
    return results, report


if __name__ == "__main__":
    main()
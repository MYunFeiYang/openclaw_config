#!/usr/bin/env python3
"""
A 股分析系统（重构版入口）：与 clean 版相同（OpenClaw Agent 取数），保留 ConfigManager / AnalysisResult 等 API。
"""
from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from predict_then_summarize import PredictionEngine, StockConfig


class SignalType:
    STRONG_BUY = "强烈买入"
    BUY = "买入"
    HOLD = "持有"
    SELL = "卖出"
    STRONG_SELL = "强烈卖出"


@dataclass
class AnalysisResult:
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
            "stock": asdict(self.stock),
            "current_price": self.current_price,
            "change_percent": self.change_percent,
            "final_score": self.final_score,
            "technical_score": self.technical_score,
            "fundamental_score": self.fundamental_score,
            "sentiment_score": self.sentiment_score,
            "sector_score": self.sector_score,
            "signal": self.signal,
            "confidence": self.confidence,
            "reasons": self.reasons,
            "analysis_time": self.analysis_time.isoformat(),
        }


class ConfigManager:
    CORE_STOCKS = [
        StockConfig("贵州茅台", "600519", "白酒", 0.9),
        StockConfig("宁德时代", "300750", "新能源", 0.8),
        StockConfig("招商银行", "600036", "银行", 0.7),
        StockConfig("五粮液", "000858", "白酒", 0.6),
        StockConfig("恒瑞医药", "600276", "医药", 0.5),
        StockConfig("比亚迪", "002594", "新能源", 0.4),
        StockConfig("海康威视", "002415", "科技", 0.3),
        StockConfig("伊利股份", "600887", "消费", 0.2),
        StockConfig("万科A", "000002", "地产", 0.1),
        StockConfig("京东方A", "000725", "面板", 0.0),
    ]

    SECTOR_BENCHMARKS = {
        "白酒": {"pe_avg": 28, "pb_avg": 7, "roe_avg": 22, "growth_avg": 15},
        "新能源": {"pe_avg": 35, "pb_avg": 4, "roe_avg": 16, "growth_avg": 25},
        "银行": {"pe_avg": 6, "pb_avg": 0.9, "roe_avg": 12, "growth_avg": 8},
        "医药": {"pe_avg": 32, "pb_avg": 4, "roe_avg": 15, "growth_avg": 18},
        "科技": {"pe_avg": 38, "pb_avg": 5, "roe_avg": 18, "growth_avg": 20},
        "消费": {"pe_avg": 26, "pb_avg": 4, "roe_avg": 16, "growth_avg": 12},
        "地产": {"pe_avg": 8, "pb_avg": 1.2, "roe_avg": 10, "growth_avg": 5},
        "面板": {"pe_avg": 15, "pb_avg": 2, "roe_avg": 12, "growth_avg": 10},
    }

    SCORE_WEIGHTS = {
        "technical": 0.40,
        "fundamental": 0.35,
        "sentiment": 0.15,
        "sector": 0.10,
    }

    SIGNAL_THRESHOLDS = {
        "strong_buy": 8.5,
        "buy": 7.0,
        "hold": 5.0,
        "sell": 3.5,
    }

    @classmethod
    def get_sector_benchmark(cls, sector: str) -> Dict[str, float]:
        return cls.SECTOR_BENCHMARKS.get(
            sector, {"pe_avg": 20, "pb_avg": 3, "roe_avg": 15, "growth_avg": 15}
        )


class StockAnalyzer:
    def __init__(self) -> None:
        self._engine = PredictionEngine()

    def analyze_stock(self, stock: StockConfig) -> AnalysisResult:
        pr = self._engine.predict_stock(stock)
        return AnalysisResult(
            stock=stock,
            current_price=pr.current_price,
            change_percent=pr.change_percent,
            final_score=round(pr.final_score, 1),
            technical_score=round(pr.technical_score, 1),
            fundamental_score=round(pr.fundamental_score, 1),
            sentiment_score=round(pr.sentiment_score, 1),
            sector_score=round(pr.sector_score, 1),
            signal=pr.signal,
            confidence=pr.confidence,
            reasons=list(pr.reasons),
            analysis_time=pr.prediction_time,
        )

    def analyze_portfolio(self, stocks: List[StockConfig]) -> List[AnalysisResult]:
        results = [self.analyze_stock(s) for s in stocks]
        results.sort(key=lambda x: x.final_score, reverse=True)
        return results


class ReportGenerator:
    @staticmethod
    def generate_report(results: List[AnalysisResult]) -> str:
        buy_recommendations = [r for r in results if r.final_score >= 7.0][:3]
        sell_recommendations = [r for r in results if r.final_score < 5.0][:2]

        lines: List[str] = []
        lines.append("【A股精选 - 真实行情预测】")
        lines.append("=" * 50)
        lines.append(f"预测时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("=" * 50)

        if buy_recommendations:
            lines.append("\n【买入推荐】")
            for i, r in enumerate(buy_recommendations, 1):
                lines.append(f"{i}. {r.stock.name} ({r.stock.symbol})")
                lines.append(
                    f"   行业: {r.stock.sector} | 综合评分: {r.final_score}/10"
                )
                lines.append(
                    f"   当前价: ¥{r.current_price:.2f} ({r.change_percent:+.2f}%)"
                )
                lines.append(f"   信号: {r.signal} | 信心度: {r.confidence}%")

        if sell_recommendations:
            lines.append("\n【卖出推荐】")
            for i, r in enumerate(sell_recommendations, 1):
                lines.append(f"{i}. {r.stock.name} ({r.stock.symbol})")
                lines.append(
                    f"   行业: {r.stock.sector} | 综合评分: {r.final_score}/10"
                )

        lines.append("\n⚠️ 风险提示: 仅供参考，不构成投资建议")
        return "\n".join(lines)

    @staticmethod
    def save_results(
        results: List[AnalysisResult], report: str, output_dir: Optional[str] = None
    ) -> str:
        root = output_dir or os.environ.get(
            "STOCK_SYSTEM_ROOT", str(Path(__file__).resolve().parent.parent)
        )
        ts = datetime.now()
        result_data = {
            "timestamp": ts.isoformat(),
            "report": report,
            "recommendations": [
                r.to_dict()
                for r in results
                if r.final_score >= 7.0 or r.final_score < 5.0
            ],
            "model_version": "8.0-real",
        }
        path = Path(root) / f"refined_a_stock_analysis_{ts.strftime('%Y%m%d_%H%M')}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)
        return str(path)


def main() -> None:
    print("🚀 启动A股分析系统 (重构版 / 真实行情)")
    print("=" * 50)
    analyzer = StockAnalyzer()
    results = analyzer.analyze_portfolio(ConfigManager.CORE_STOCKS)
    report = ReportGenerator.generate_report(results)
    print(report)
    fn = ReportGenerator.save_results(results, report)
    print(f"\n✅ 结果已保存: {fn}")


if __name__ == "__main__":
    main()

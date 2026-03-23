#!/usr/bin/env python3
"""
简洁版 A 股分析入口：底层与 predict_then_summarize 一致，经 OpenClaw Agent 取数。
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List

from predict_then_summarize import PredictionEngine, StockConfig


class SignalType:
    """与历史脚本兼容的信号常量命名空间"""

    STRONG_BUY = "强烈买入"
    BUY = "买入"
    HOLD = "持有"
    SELL = "卖出"
    STRONG_SELL = "强烈卖出"


@dataclass
class AnalysisResult:
    name: str
    symbol: str
    sector: str
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


class StockData:
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


class StockAnalyzer:
    def __init__(self) -> None:
        self._engine = PredictionEngine()

    def analyze_stock(self, stock: StockConfig) -> AnalysisResult:
        pr = self._engine.predict_stock(stock)
        return AnalysisResult(
            name=pr.stock.name,
            symbol=pr.stock.symbol,
            sector=pr.stock.sector,
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

        report_lines: List[str] = []
        report_lines.append("【A股精选 - 真实行情预测】")
        report_lines.append("=" * 50)
        report_lines.append(f"预测时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("=" * 50)

        if buy_recommendations:
            report_lines.append("\n【买入推荐】")
            for i, stock in enumerate(buy_recommendations, 1):
                report_lines.append(f"{i}. {stock.name} ({stock.symbol})")
                report_lines.append(
                    f"   行业: {stock.sector} | 综合评分: {stock.final_score}/10"
                )
                report_lines.append(
                    f"   当前价: ¥{stock.current_price:.2f} ({stock.change_percent:+.2f}%)"
                )
                report_lines.append(
                    f"   信号: {stock.signal} | 信心度: {stock.confidence}%"
                )

        if sell_recommendations:
            report_lines.append("\n【卖出推荐】")
            for i, stock in enumerate(sell_recommendations, 1):
                report_lines.append(f"{i}. {stock.name} ({stock.symbol})")
                report_lines.append(
                    f"   行业: {stock.sector} | 综合评分: {stock.final_score}/10"
                )

        report_lines.append("\n⚠️ 风险提示: 仅供参考，不构成投资建议")
        return "\n".join(report_lines)


def main() -> None:
    base = Path(
        os.environ.get(
            "STOCK_SYSTEM_ROOT", str(Path(__file__).resolve().parent.parent)
        )
    )
    analyzer = StockAnalyzer()
    results = analyzer.analyze_portfolio(StockData.CORE_STOCKS)
    report = ReportGenerator.generate_report(results)
    print(report)

    result_data = {
        "timestamp": datetime.now().isoformat(),
        "report": report,
        "recommendations": [
            {
                "name": r.name,
                "symbol": r.symbol,
                "sector": r.sector,
                "final_score": r.final_score,
                "signal": r.signal,
                "confidence": r.confidence,
            }
            for r in results
            if r.final_score >= 7.0 or r.final_score < 5.0
        ],
    }
    filename = base / f"clean_a_stock_analysis_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)
    print(f"\n【分析结果已保存】{filename}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
与测试脚本兼容的一致性分析 CLI：底层为 predict_then_summarize + 真实行情。
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class ConsistentStockAnalyzer:
    def __init__(self, base_dir: Optional[str] = None) -> None:
        self.base_dir = Path(
            base_dir
            or os.environ.get(
                "STOCK_SYSTEM_ROOT", str(Path(__file__).resolve().parent.parent)
            )
        )
        self.data_dir = self.base_dir / "data"
        self.reports_dir = self.base_dir / "reports"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def get_consistent_analysis(self, analysis_type: str = "evening") -> dict:
        from predict_then_summarize import ConfigManager, PredictionEngine

        ConfigManager.reload_stock_pool()
        stocks = ConfigManager.get_analysis_stock_slice(analysis_type)
        engine = PredictionEngine()
        preds = engine.predict_portfolio(stocks)
        results = [self._from_pr(p, analysis_type) for p in preds]
        summary = self._generate_consistent_summary(results, analysis_type)
        return {
            "analysis_type": analysis_type,
            "timestamp": datetime.now().isoformat(),
            "predictions": results,
            "summary": summary,
            "consistency_score": self._calculate_consistency_score(results),
        }

    @staticmethod
    def _from_pr(p: Any, analysis_type: str) -> dict:
        return {
            "name": p.stock.name,
            "symbol": p.stock.symbol,
            "sector": p.stock.sector,
            "current_price": p.current_price,
            "change_percent": p.change_percent,
            "final_score": round(p.final_score, 1),
            "technical_score": round(p.technical_score, 1),
            "fundamental_score": round(p.fundamental_score, 1),
            "sentiment_score": round(p.sentiment_score, 1),
            "sector_score": round(p.sector_score, 1),
            "signal": p.signal,
            "confidence": p.confidence,
            "reasons": list(p.reasons),
            "analysis_type": analysis_type,
        }

    def _generate_consistent_summary(self, results: list, analysis_type: str) -> dict:
        buy_recommendations = [r for r in results if r["final_score"] >= 7.0][:3]
        sell_recommendations = [r for r in results if r["final_score"] < 5.0][:2]
        hold_recommendations = [r for r in results if 5.0 <= r["final_score"] < 7.0][:2]

        total_buy = len(buy_recommendations)
        total_sell = len(sell_recommendations)
        total_hold = len(hold_recommendations)

        avg_buy_score = (
            sum(r["final_score"] for r in buy_recommendations) / total_buy
            if total_buy > 0
            else 0
        )
        avg_sell_score = (
            sum(r["final_score"] for r in sell_recommendations) / total_sell
            if total_sell > 0
            else 0
        )
        avg_hold_score = (
            sum(r["final_score"] for r in hold_recommendations) / total_hold
            if total_hold > 0
            else 0
        )

        sector_analysis = self._generate_sector_analysis(results)
        risk_alerts = self._generate_risk_alerts(results)
        next_actions = self._generate_next_actions(analysis_type, results)

        return {
            "buy_recommendations": buy_recommendations,
            "sell_recommendations": sell_recommendations,
            "hold_recommendations": hold_recommendations,
            "market_overview": {
                "total_stocks": len(results),
                "buy_count": total_buy,
                "sell_count": total_sell,
                "hold_count": total_hold,
                "avg_buy_score": round(avg_buy_score, 1),
                "avg_sell_score": round(avg_sell_score, 1),
                "avg_hold_score": round(avg_hold_score, 1),
                "market_sentiment": self._determine_market_sentiment(
                    avg_buy_score, avg_sell_score
                ),
            },
            "sector_analysis": sector_analysis,
            "risk_alerts": risk_alerts,
            "next_actions": next_actions,
        }

    def _generate_sector_analysis(self, results: list) -> dict:
        sector_scores: Dict[str, List[float]] = {}
        for result in results:
            sector = result["sector"]
            sector_scores.setdefault(sector, []).append(result["final_score"])
        sector_analysis = {}
        for sector, scores in sector_scores.items():
            avg_score = sum(scores) / len(scores)
            sector_analysis[sector] = {
                "avg_score": round(avg_score, 1),
                "stock_count": len(scores),
                "trend": "强势" if avg_score > 6 else "弱势" if avg_score < 4 else "震荡",
            }
        return sector_analysis

    def _generate_risk_alerts(self, results: list) -> list:
        alerts = []
        sell_count = len([r for r in results if r["final_score"] < 5])
        if sell_count > len(results) * 0.4:
            alerts.append("市场卖出信号较多，注意风险控制")
        extreme_scores = [r for r in results if r["final_score"] < 2 or r["final_score"] > 9]
        if extreme_scores:
            alerts.append(f"发现{len(extreme_scores)}只股票评分极端，需谨慎对待")
        weak_sectors = [
            s
            for s, data in self._generate_sector_analysis(results).items()
            if data["avg_score"] < 4
        ]
        if weak_sectors:
            alerts.append(f"弱势行业: {', '.join(weak_sectors)}")
        return alerts[:3]

    def _generate_next_actions(self, analysis_type: str, _results: list) -> list:
        if analysis_type == "morning":
            return [
                "关注开盘后的量价配合情况",
                "观察隔夜外围市场对A股的影响",
                "留意早盘资金流入方向",
            ]
        if analysis_type == "afternoon":
            return [
                "关注午后资金动向",
                "观察上午强势股的持续性",
                "留意尾盘异动情况",
            ]
        if analysis_type == "evening":
            return [
                "总结全天市场表现",
                "为次日交易做准备",
                "关注晚间重要消息",
            ]
        if analysis_type == "weekly":
            return [
                "回顾本周交易策略执行情况",
                "制定下周投资计划",
                "关注周末政策消息",
            ]
        return []

    def _determine_market_sentiment(
        self, avg_buy_score: float, avg_sell_score: float
    ) -> str:
        if avg_buy_score > avg_sell_score:
            return "乐观"
        if avg_sell_score > avg_buy_score:
            return "谨慎"
        return "中性"

    def _calculate_consistency_score(self, results: list) -> float:
        if not results:
            return 0.0
        scores = [r["final_score"] for r in results]
        mean = sum(scores) / len(scores)
        variance = sum((s - mean) ** 2 for s in scores) / len(scores)
        return round(max(0.0, 10.0 - variance), 1)

    def save_results(self, result: dict, analysis_type: str) -> dict:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        data_file = self.data_dir / f"consistent_analysis_{analysis_type}_{timestamp}.json"
        with open(data_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        report = self._generate_report(result, analysis_type)
        report_file = self.reports_dir / f"consistent_report_{analysis_type}_{timestamp}.txt"
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(report)
        return {
            "data_file": str(data_file),
            "report_file": str(report_file),
            "consistency_score": result["consistency_score"],
        }

    def _generate_report(self, result: dict, analysis_type: str) -> str:
        summary = result["summary"]
        market_overview = summary["market_overview"]
        lines: List[str] = []
        lines.append(f"【A股{self._get_analysis_type_name(analysis_type)}分析报告】")
        lines.append("=" * 70)
        lines.append(f"分析时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"一致性评分: {result['consistency_score']}/10")
        lines.append("=" * 70)
        lines.append("\n【推荐总结】")
        for label, key in (
            ("买入推荐", "buy_recommendations"),
            ("卖出推荐", "sell_recommendations"),
            ("持有推荐", "hold_recommendations"),
        ):
            recs = summary[key]
            if recs:
                lines.append(f"{label} ({len(recs)}只):")
                for i, rec in enumerate(recs, 1):
                    lines.append(
                        f"  {i}. {rec['name']} ({rec['symbol']}) - 评分:{rec['final_score']}"
                    )
        lines.append("\n【市场概况】")
        lines.append(f"总股票数: {market_overview['total_stocks']}")
        lines.append(
            f"买入: {market_overview['buy_count']} | 卖出: {market_overview['sell_count']} | 持有: {market_overview['hold_count']}"
        )
        lines.append(f"市场情绪: {market_overview['market_sentiment']}")
        if summary["sector_analysis"]:
            lines.append("\n【行业分析】")
            for sector, data in summary["sector_analysis"].items():
                lines.append(
                    f"{sector}: 平均{data['avg_score']} ({data['trend']}, {data['stock_count']}只)"
                )
        lines.append("\n⚠️ 基于真实行情 pipeline，仅供参考，不构成投资建议")
        return "\n".join(lines)

    def _get_analysis_type_name(self, analysis_type: str) -> str:
        return {
            "morning": "早盘",
            "afternoon": "午盘",
            "evening": "收盘",
            "weekly": "周度",
        }.get(analysis_type, analysis_type)


def main() -> None:
    analysis_type = sys.argv[1] if len(sys.argv) > 1 else "evening"
    valid = ("morning", "afternoon", "evening", "weekly")
    if analysis_type not in valid:
        analysis_type = "evening"
    root = os.environ.get(
        "STOCK_SYSTEM_ROOT", str(Path(__file__).resolve().parent.parent)
    )
    analyzer = ConsistentStockAnalyzer(base_dir=root)
    result = analyzer.get_consistent_analysis(analysis_type)
    saved = analyzer.save_results(result, analysis_type)
    name = analyzer._get_analysis_type_name(analysis_type)
    print(f"✅ {name} 分析完成")
    print(f"   一致性评分: {result['consistency_score']}/10")
    print(f"   买入推荐: {len(result['summary']['buy_recommendations'])}只")
    print(f"   卖出推荐: {len(result['summary']['sell_recommendations'])}只")
    print(f"   持有推荐: {len(result['summary']['hold_recommendations'])}只")
    print(f"   数据文件: {saved['data_file']}")
    print(f"   报告文件: {saved['report_file']}")


if __name__ == "__main__":
    main()

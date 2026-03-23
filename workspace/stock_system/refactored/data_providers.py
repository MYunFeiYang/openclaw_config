#!/usr/bin/env python3
"""
股票分析数据源：仅通过 OpenClaw Agent（网页搜索/浏览工具）拉取公开行情摘要。

环境变量（可选）：
  OPENCLAW_BIN                 openclaw 可执行文件（默认 PATH）
  OPENCLAW_STOCK_AGENT_ID      默认 main
  OPENCLAW_AGENT_LOCAL         1=--local（默认）；0=走 Gateway
  OPENCLAW_AGENT_TIMEOUT       秒，默认 600
  STOCK_OPENCLAW_CACHE_SEC     单股缓存秒数，默认 90
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict, Protocol, runtime_checkable

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


def _sector_bm(sector: str) -> Dict[str, float]:
    return SECTOR_BENCHMARKS.get(
        sector, {"pe_avg": 20, "pb_avg": 3, "roe_avg": 15, "growth_avg": 15}
    )


@dataclass
class StockInputs:
    current_price: float
    change_percent: float
    technical: Dict
    fundamental: Dict
    sentiment: Dict
    sector: Dict
    provenance: str


def _neutral_technical() -> Dict:
    return {
        "rsi": 50.0,
        "macd_signal": "中性",
        "bollinger_position": 0.0,
        "volume_ratio": 1.0,
        "momentum_5d": 0.0,
    }


def _neutral_sentiment() -> Dict:
    return {
        "market_heat": 5,
        "institution_attention": 5,
        "retail_sentiment": "中性",
        "news_sentiment": "中性",
    }


def _neutral_sector() -> Dict:
    return {
        "prosperity": 5,
        "policy_support": 5,
        "capital_flow": 5,
        "rotation_position": 5,
    }


def _neutral_fundamental(stock: Any) -> Dict:
    b = _sector_bm(getattr(stock, "sector", "") or "")
    return {
        "pe_ratio": float(b["pe_avg"]),
        "pb_ratio": float(b["pb_avg"]),
        "roe": float(b["roe_avg"]),
        "growth_rate": float(b["growth_avg"]),
        "debt_ratio": 0.45,
        "dividend_yield": 2.0,
    }


def sentiment_from_price_action(change_percent: float, turnover: float) -> Dict:
    """由涨跌幅与换手率构造情绪代理指标（无独立舆情 API 时）。"""
    heat = int(min(10, max(1, round(5 + abs(change_percent) / 3))))
    att = int(min(10, max(1, round(3 + min(turnover, 15) / 2))))
    if change_percent > 2:
        retail = "乐观"
    elif change_percent < -2:
        retail = "谨慎"
    else:
        retail = "中性"
    if change_percent > 1:
        news = "正面"
    elif change_percent < -1:
        news = "负面"
    else:
        news = "中性"
    return {
        "market_heat": heat,
        "institution_attention": att,
        "retail_sentiment": retail,
        "news_sentiment": news,
    }


def sector_from_price_action(change_percent: float) -> Dict:
    """由涨跌幅构造行业轮动代理维度。"""
    base = 5.0 + min(3.0, max(-3.0, change_percent / 2))
    p = int(min(9, max(3, round(base + 1))))
    return {
        "prosperity": p,
        "policy_support": int(min(9, max(3, round(6 + change_percent / 4)))),
        "capital_flow": int(min(9, max(2, round(5 + change_percent / 3)))),
        "rotation_position": int(min(9, max(3, round(5 + abs(change_percent) / 5)))),
    }


@runtime_checkable
class StockDataProvider(Protocol):
    def fetch(self, stock: Any) -> StockInputs: ...


def get_default_provider() -> StockDataProvider:
    from openclaw_search_provider import OpenclawAgentWebProvider

    return OpenclawAgentWebProvider()

#!/usr/bin/env python3
"""
行情直取 fallback —— 当 OpenClaw Agent 不可用时，直接通过 HTTP 调用新浪财经
实时行情接口拉取 A 股现价与涨跌幅。

两层策略：
  1. 新浪财经 HTTP（零依赖，py3 内置 urllib）—— 批量单次可查多只
  2. akshare（可选，安装后自动优先）

环境变量：
  STOCK_FALLBACK_CACHE_SEC  单股缓存秒数，默认 60
"""

from __future__ import annotations

import os
import re
import time
import urllib.request
from typing import Any, Dict, Optional, Tuple

from data_providers import (
    StockInputs,
    _neutral_fundamental,
    compute_real_technicals,
    sector_from_price_action,
    sentiment_from_price_action,
    technical_from_spot_change,
)


# ── Layer 1: 新浪财经 HTTP 直连（零依赖） ──────────────────────────────

_SINA_QUOTE_URL = "https://hq.sinajs.cn/list={codes}"
_SINA_KLINE_URL = (
    "https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/"
    "CN_MarketData.getKLineData?symbol={symbol}&scale=240&ma=no&datalen={days}"
)


def _fetch_sina_kline(symbol: str, days: int = 60) -> list:
    """拉取新浪日线 K 线，返回 list of dict（含 open/close/high/low/volume/amount/day）。"""
    url = _SINA_KLINE_URL.format(symbol=symbol, days=days)
    try:
        req = urllib.request.Request(url, headers={"Referer": "https://finance.sina.com.cn"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("gbk", errors="replace")
        import json

        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except Exception:
        return []
    return []


def _code_to_sina_symbol(code: str) -> str:
    """600519 → sh600519, 000858 → sz000858"""
    code = code.strip().zfill(6)
    if code.startswith(("6", "9")):
        return f"sh{code}"
    elif code.startswith(("0", "3")):
        return f"sz{code}"
    else:
        return f"sh{code}"  # default to SH


def _parse_sina_line(line: str) -> Optional[Tuple[str, float, float]]:
    """
    解析新浪行情行，返回 (代码, 现价, 涨跌幅%)。
    格式: var hq_str_sh600519="name,open,prev_close,price,..."
    """
    m = re.match(r'var hq_str_(\w+)="(.+)"', line)
    if not m:
        return None
    symbol = m.group(1)  # e.g., "sh600519"
    fields = m.group(2).split(",")
    if len(fields) < 4:
        return None

    code = symbol[2:]  # strip "sh"/"sz" prefix
    try:
        prev_close = float(fields[2])  # 昨收
        price = float(fields[3])       # 现价
    except (ValueError, TypeError):
        return None

    if price <= 0 or prev_close <= 0:
        return None

    pct = round((price - prev_close) / prev_close * 100, 2)
    return (code, price, pct)


def _fetch_sina_batch(codes: list) -> Dict[str, Tuple[float, float]]:
    """批量拉取新浪行情，返回 {代码: (现价, 涨跌幅%)}。"""
    if not codes:
        return {}

    symbols = ",".join(_code_to_sina_symbol(c) for c in codes)
    url = _SINA_QUOTE_URL.format(codes=symbols)

    try:
        req = urllib.request.Request(
            url,
            headers={"Referer": "https://finance.sina.com.cn"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("gbk", errors="replace")
    except Exception:
        return {}

    result: Dict[str, Tuple[float, float]] = {}
    for line in raw.strip().split("\n"):
        parsed = _parse_sina_line(line.strip())
        if parsed:
            code, price, pct = parsed
            result[code] = (price, pct)
    return result


# ── Layer 2: akshare（可选增强）───────────────────────────────────────

def _akshare_available() -> bool:
    try:
        import akshare  # noqa: F401
        return True
    except ImportError:
        return False


def _fetch_akshare_batch(codes: list) -> Dict[str, Tuple[float, float]]:
    """通过 akshare 拉取批量行情。"""
    try:
        import akshare as ak
        df = ak.stock_zh_a_spot_em()
        if df is None or df.empty:
            return {}
        result: Dict[str, Tuple[float, float]] = {}
        code_set = set(c.strip().zfill(6) for c in codes)
        for _, row in df.iterrows():
            code = str(row.get("代码", "")).strip().zfill(6)
            if code not in code_set:
                continue
            price = float(row.get("最新价", 0) or 0)
            pct = float(row.get("涨跌幅", 0) or 0)
            if code and price > 0:
                result[code] = (price, pct)
        return result
    except Exception:
        return {}


def _fetch_akshare_kline(code: str, days: int = 60) -> list:
    """通过 akshare 拉取日线 K 线（优先使用，更准）。"""
    try:
        import akshare as ak
        df = ak.stock_zh_a_hist(
            symbol=code, period="daily", adjust="qfq",
            start_date="20240101", end_date="20261231",
        )
        if df is None or df.empty:
            return []
        klines = []
        # akshare 列名：日期,开盘,收盘,最高,最低,成交量,成交额
        for _, row in df.iterrows():
            klines.append({
                "day": str(row.get("日期", "")),
                "open": str(row.get("开盘", 0)),
                "close": str(row.get("收盘", 0)),
                "high": str(row.get("最高", 0)),
                "low": str(row.get("最低", 0)),
                "volume": str(row.get("成交量", 0)),
            })
        return klines[-days:]
    except Exception:
        return []


# ── 统一接口 ─────────────────────────────────────────────────────────

class AkshareFallbackProvider:
    """
    行情 fallback 提供者。
    优先 akshare → 降级新浪财经 HTTP（零依赖）。

    不依赖 OpenClaw Agent / Gateway，独立运行。
    """

    def __init__(self) -> None:
        self._cache: Dict[str, Tuple[float, Tuple[float, float]]] = {}
        self._ttl = float(os.environ.get("STOCK_FALLBACK_CACHE_SEC") or "60")

    def fetch_one(self, code: str) -> Optional[Tuple[float, float]]:
        """返回 (现价, 涨跌幅%)，失败返回 None。"""
        code = code.strip().zfill(6)
        now = time.time()
        if code in self._cache:
            ts, pair = self._cache[code]
            if now - ts < self._ttl:
                return pair

        if _akshare_available():
            data = _fetch_akshare_batch([code])
        else:
            data = _fetch_sina_batch([code])

        pair = data.get(code)
        if pair is not None:
            self._cache[code] = (now, pair)
        return pair

    def fetch(self, stock: Any) -> StockInputs:
        code = str(getattr(stock, "symbol", "")).strip().zfill(6)
        pair = self.fetch_one(code)
        if pair is None:
            raise RuntimeError(f"fallback 未返回 {code} 行情数据")
        price, pct = pair
        if price <= 0:
            raise RuntimeError(f"fallback 返回现价无效: {price}")

        # 1. 尝试拉取真实 K 线，计算技术指标
        symbol = _code_to_sina_symbol(code)
        klines = []
        if _akshare_available():
            klines = _fetch_akshare_kline(code)
        if not klines:
            klines = _fetch_sina_kline(symbol)

        if klines and len(klines) >= 14:
            technical = compute_real_technicals(klines)
            provenance_suffix = "kline"
        else:
            # K 线不可用，降级到涨跌幅代理指标
            technical = technical_from_spot_change(pct)
            provenance_suffix = "spot_proxy"

        fundamental = _neutral_fundamental(stock)
        sentiment = sentiment_from_price_action(pct, technical.get("volume_ratio", 1.0))
        sector = sector_from_price_action(pct)
        return StockInputs(
            current_price=round(price, 2),
            change_percent=round(pct, 2),
            technical=technical,
            fundamental=fundamental,
            sentiment=sentiment,
            sector=sector,
            provenance=f"{'akshare_direct' if _akshare_available() else 'sina_http'}_{provenance_suffix}",
        )

    def is_available(self) -> bool:
        """快速检查 fallback 是否可用。"""
        data = _fetch_sina_batch(["600519"])
        return len(data) > 0


# 全局单例
_global_akshare: Optional[AkshareFallbackProvider] = None


def get_akshare_provider() -> AkshareFallbackProvider:
    global _global_akshare
    if _global_akshare is None:
        _global_akshare = AkshareFallbackProvider()
    return _global_akshare

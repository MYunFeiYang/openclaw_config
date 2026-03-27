#!/usr/bin/env python3
"""
复盘方向判定：自适应中性带、强档更严、可选大盘超额收益（环境变量）。
供 daily_cycle_review.run_reconcile 使用，避免与 predict_then_summarize 循环依赖。
"""
from __future__ import annotations

import os
from typing import Any, Dict, Optional, Tuple


def default_accuracy_tuning() -> Dict[str, Any]:
    return {
        "signal_margin": 0.12,
        "reconcile_band_base": 0.55,
        "reconcile_band_vol_coef": 0.07,
        "reconcile_band_min": 0.35,
        "reconcile_band_max": 2.0,
        "strong_band_factor": 1.35,
        "strong_band_min_extra": 0.35,
    }


def merge_accuracy_tuning(overrides: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    base = default_accuracy_tuning()
    if not overrides:
        return base
    for k, v in overrides.items():
        if k not in base or v is None:
            continue
        if isinstance(base[k], float):
            base[k] = float(v)
        else:
            base[k] = v
    return base


def adaptive_neutral_band_pct(abs_morning_change_pct: float, tuning: Dict[str, Any]) -> float:
    """用早盘记录涨跌幅绝对值代理波动，放宽/收紧中性带。"""
    ac = max(0.0, float(abs_morning_change_pct or 0.0))
    b = float(tuning["reconcile_band_base"])
    c = float(tuning["reconcile_band_vol_coef"])
    lo = float(tuning["reconcile_band_min"])
    hi = float(tuning["reconcile_band_max"])
    raw = b + c * min(ac, 10.0)
    return round(max(lo, min(hi, raw)), 4)


def strong_direction_band_pct(base_band: float, tuning: Dict[str, Any]) -> float:
    f = float(tuning["strong_band_factor"])
    extra = float(tuning["strong_band_min_extra"])
    return round(max(base_band * f, base_band + extra), 4)


def benchmark_return_pct_for_reconcile() -> Optional[float]:
    raw = os.environ.get("RECONCILE_BENCHMARK_RETURN_PCT", "").strip()
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def session_return_for_direction(session_return_pct: float, benchmark_pct: Optional[float]) -> float:
    if benchmark_pct is None:
        return session_return_pct
    return session_return_pct - float(benchmark_pct)


def actual_direction_from_return(session_return_pct: float, band: float) -> int:
    if session_return_pct > band:
        return 1
    if session_return_pct < -band:
        return -1
    return 0


def expected_direction_from_signal(signal: str) -> int:
    if "强烈买入" in signal or signal == "买入":
        return 1
    if "强烈卖出" in signal or signal == "卖出":
        return -1
    return 0


def direction_match_with_tuning(
    signal: str,
    session_return_for_match: float,
    neutral_band: float,
    tuning: Dict[str, Any],
) -> Tuple[bool, int, float]:
    expected_dir = expected_direction_from_signal(signal)
    act = actual_direction_from_return(session_return_for_match, neutral_band)
    sb = strong_direction_band_pct(neutral_band, tuning)
    if "强烈买入" in signal:
        ok = act == 1 and session_return_for_match > sb
        return ok, act, sb
    if "强烈卖出" in signal:
        ok = act == -1 and session_return_for_match < -sb
        return ok, act, sb
    if expected_dir == 0:
        return act == 0, act, sb
    return expected_dir == act, act, sb

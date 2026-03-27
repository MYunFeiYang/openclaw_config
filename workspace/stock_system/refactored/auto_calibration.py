#!/usr/bin/env python3
"""
根据 reconcile_history.jsonl 的滚动结果，小步调整「信号阈值」与「综合分权重」，
写入 config/calibration_overrides.json；不修改模型，只调本地规则。

约束：单次日间调整幅度小、相对默认值有上下限；需满足 strong_buy > buy > hold > sell。
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# 与 daily_cycle_review 一致的方向
def _expected_direction(signal: str) -> int:
    if "强烈买入" in signal or signal == "买入":
        return 1
    if "强烈卖出" in signal or signal == "卖出":
        return -1
    return 0


def _load_reconcile_history(data_dir: Path, max_lines: int = 400) -> List[Dict[str, Any]]:
    path = data_dir / "reconcile_history.jsonl"
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").strip().splitlines()
    if len(lines) > max_lines:
        lines = lines[-max_lines:]
    out: List[Dict[str, Any]] = []
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        try:
            out.append(json.loads(ln))
        except json.JSONDecodeError:
            continue
    return out


def _by_trade_date(records: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    by_d: Dict[str, Dict[str, Any]] = {}
    for rec in records:
        d = rec.get("trade_date")
        if isinstance(d, str) and d:
            by_d[d] = rec
    return by_d


DEFAULT_THRESHOLDS = {
    "strong_buy": 8.5,
    "buy": 7.0,
    "hold": 5.0,
    "sell": 3.5,
}
DEFAULT_WEIGHTS = {
    "technical": 0.40,
    "fundamental": 0.35,
    "sentiment": 0.15,
    "sector": 0.10,
}

# 相对默认值的总偏移上限（避免漂太远）
MAX_THRESH_DRIFT = 0.35
MAX_WEIGHT_DRIFT = 0.06
STEP_TH = 0.05
STEP_W = 0.02
MIN_TOTAL_SAMPLES = 24
MIN_BUCKET_SAMPLES = 6
LAST_SESSIONS = 15


def _enforce_order(th: Dict[str, float]) -> Dict[str, float]:
    """保证 strong_buy > buy > hold > sell，且各落在合理区间。"""
    s = max(2.5, min(4.5, float(th.get("sell", 3.5))))
    h = max(s + 1.0, min(6.2, float(th.get("hold", 5.0))))
    b = max(h + 1.0, min(8.2, float(th.get("buy", 7.0))))
    sb = max(b + 0.5, min(9.5, float(th.get("strong_buy", 8.5))))
    return {
        "sell": round(s, 3),
        "hold": round(h, 3),
        "buy": round(b, 3),
        "strong_buy": round(sb, 3),
    }


def _clamp_to_defaults(th: Dict[str, float], w: Dict[str, float]) -> Tuple[Dict[str, float], Dict[str, float]]:
    th2 = {}
    for k, dv in DEFAULT_THRESHOLDS.items():
        v = th.get(k, dv)
        th2[k] = max(dv - MAX_THRESH_DRIFT, min(dv + MAX_THRESH_DRIFT, v))
    w2 = {}
    for k, dv in DEFAULT_WEIGHTS.items():
        v = w.get(k, dv)
        w2[k] = max(dv - MAX_WEIGHT_DRIFT, min(dv + MAX_WEIGHT_DRIFT, v))
    s = sum(w2.values())
    if s <= 0:
        w2 = dict(DEFAULT_WEIGHTS)
    else:
        w2 = {k: round(w2[k] / s, 4) for k in w2}
    return _enforce_order(th2), w2


def _aggregate_stats(records: List[Dict[str, Any]]) -> Dict[str, int]:
    by_date = _by_trade_date(records)
    dates = sorted(by_date.keys())[-LAST_SESSIONS:]
    stats = {
        "n_buy": 0,
        "miss_buy": 0,
        "n_sell": 0,
        "miss_sell": 0,
        "n_hold": 0,
        "miss_hold": 0,
        "sessions_used": len(dates),
    }
    for d in dates:
        rec = by_date[d]
        for sym, info in (rec.get("symbols") or {}).items():
            if not isinstance(info, dict) or not info.get("ok", True):
                continue
            if info.get("match") is None:
                continue
            sig = str(info.get("signal") or "")
            exp = _expected_direction(sig)
            ok = bool(info["match"])
            if exp == 1:
                stats["n_buy"] += 1
                if not ok:
                    stats["miss_buy"] += 1
            elif exp == -1:
                stats["n_sell"] += 1
                if not ok:
                    stats["miss_sell"] += 1
            else:
                stats["n_hold"] += 1
                if not ok:
                    stats["miss_hold"] += 1
    return stats


def run_auto_calibration(stock_system_root: Optional[Path] = None) -> Dict[str, Any]:
    """
    读取 data/reconcile_history.jsonl，更新 config/calibration_overrides.json。
    样本不足时仍写出 meta，阈值/权重保持与默认一致。
    """
    root = stock_system_root or Path(__file__).resolve().parent.parent
    data_dir = root / "data"
    cfg_dir = root / "config"
    cfg_dir.mkdir(parents=True, exist_ok=True)
    out_path = cfg_dir / "calibration_overrides.json"

    records = _load_reconcile_history(data_dir)
    stats = _aggregate_stats(records)
    total = stats["n_buy"] + stats["n_sell"] + stats["n_hold"]

    base_th = dict(DEFAULT_THRESHOLDS)
    base_w = dict(DEFAULT_WEIGHTS)
    th, w = deepcopy(base_th), deepcopy(base_w)
    notes: List[str] = []

    if total < MIN_TOTAL_SAMPLES:
        notes.append(f"样本不足（有效方向样本 {total} < {MIN_TOTAL_SAMPLES}），未调整阈值/权重。")
    else:
        if stats["n_buy"] >= MIN_BUCKET_SAMPLES:
            mr = stats["miss_buy"] / stats["n_buy"]
            if mr > 0.45:
                th["buy"] += STEP_TH
                th["strong_buy"] += STEP_TH
                notes.append(f"买入向误判率偏高({mr:.0%})，略提高买入门槛。")
            elif mr < 0.2:
                th["buy"] -= STEP_TH
                th["strong_buy"] -= STEP_TH
                notes.append(f"买入向较准({mr:.0%})，略放宽买入门槛。")

        if stats["n_sell"] >= MIN_BUCKET_SAMPLES:
            mr = stats["miss_sell"] / stats["n_sell"]
            if mr > 0.45:
                th["hold"] -= STEP_TH
                th["sell"] -= STEP_TH
                notes.append(f"卖出向误判率偏高({mr:.0%})，略扩大持有带、减少边缘卖出。")
            elif mr < 0.2:
                th["hold"] += STEP_TH
                th["sell"] += STEP_TH
                notes.append(f"卖出向较准({mr:.0%})，略收紧持有带。")

        if stats["miss_buy"] + stats["miss_sell"] > 0:
            if stats["miss_buy"] > stats["miss_sell"] * 1.4:
                w["technical"] -= STEP_W
                w["fundamental"] += STEP_W
                notes.append("买入误判更多，略降技术面、增基本面权重。")
            elif stats["miss_sell"] > stats["miss_buy"] * 1.4:
                w["technical"] -= STEP_W
                w["sector"] += STEP_W
                notes.append("卖出误判更多，略降技术面、增行业权重。")

        th, w = _clamp_to_defaults(th, w)
        th = _enforce_order(th)

    payload = {
        "version": 1,
        "updated_at": datetime.now().isoformat(),
        "source": "reconcile_history.jsonl",
        "stats": stats,
        "notes": notes,
        "signal_thresholds": th,
        "score_weights": w,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return payload


if __name__ == "__main__":
    import sys

    r = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    p = run_auto_calibration(r)
    print(json.dumps({k: p[k] for k in ("updated_at", "stats", "notes", "signal_thresholds", "score_weights")}, ensure_ascii=False, indent=2))

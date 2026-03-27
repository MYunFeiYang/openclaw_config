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
LAST_SESSIONS = 20
# 越近的交易日权重越大（仅用于误判率，原始计数仍写入 stats 便于阅读）
DECAY_PER_SESSION = 0.92
# 加权后等效样本够即可调该桶（略低于纯条数门槛，避免浪费近期数据）
MIN_BUCKET_WEIGHT = 5.5


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


def _weighted_miss_rate(miss_w: float, w_sum: float) -> float:
    if w_sum <= 0:
        return 0.0
    return miss_w / w_sum


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


def _bucket_ready(n_raw: int, w_sum: float) -> bool:
    return n_raw >= MIN_BUCKET_SAMPLES or w_sum >= MIN_BUCKET_WEIGHT


def _aggregate_stats(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    by_date = _by_trade_date(records)
    dates = sorted(by_date.keys())[-LAST_SESSIONS:]
    n_sess = len(dates)
    stats: Dict[str, Any] = {
        "n_buy": 0,
        "miss_buy": 0,
        "n_sell": 0,
        "miss_sell": 0,
        "n_hold": 0,
        "miss_hold": 0,
        "n_strong_buy": 0,
        "miss_strong_buy": 0,
        "n_norm_buy": 0,
        "miss_norm_buy": 0,
        "n_strong_sell": 0,
        "miss_strong_sell": 0,
        "n_norm_sell": 0,
        "miss_norm_sell": 0,
        "w_buy": 0.0,
        "miss_buy_w": 0.0,
        "w_sell": 0.0,
        "miss_sell_w": 0.0,
        "w_hold": 0.0,
        "miss_hold_w": 0.0,
        "w_strong_buy": 0.0,
        "miss_strong_buy_w": 0.0,
        "w_norm_buy": 0.0,
        "miss_norm_buy_w": 0.0,
        "w_strong_sell": 0.0,
        "miss_strong_sell_w": 0.0,
        "w_norm_sell": 0.0,
        "miss_norm_sell_w": 0.0,
        "sessions_used": n_sess,
        "decay_per_session": DECAY_PER_SESSION,
    }
    for i, d in enumerate(dates):
        w_sess = float(DECAY_PER_SESSION) ** (n_sess - 1 - i) if n_sess else 1.0
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
                stats["w_buy"] += w_sess
                if not ok:
                    stats["miss_buy"] += 1
                    stats["miss_buy_w"] += w_sess
                if "强烈买入" in sig:
                    stats["n_strong_buy"] += 1
                    stats["w_strong_buy"] += w_sess
                    if not ok:
                        stats["miss_strong_buy"] += 1
                        stats["miss_strong_buy_w"] += w_sess
                elif sig == "买入":
                    stats["n_norm_buy"] += 1
                    stats["w_norm_buy"] += w_sess
                    if not ok:
                        stats["miss_norm_buy"] += 1
                        stats["miss_norm_buy_w"] += w_sess
            elif exp == -1:
                stats["n_sell"] += 1
                stats["w_sell"] += w_sess
                if not ok:
                    stats["miss_sell"] += 1
                    stats["miss_sell_w"] += w_sess
                if "强烈卖出" in sig:
                    stats["n_strong_sell"] += 1
                    stats["w_strong_sell"] += w_sess
                    if not ok:
                        stats["miss_strong_sell"] += 1
                        stats["miss_strong_sell_w"] += w_sess
                elif sig == "卖出":
                    stats["n_norm_sell"] += 1
                    stats["w_norm_sell"] += w_sess
                    if not ok:
                        stats["miss_norm_sell"] += 1
                        stats["miss_norm_sell_w"] += w_sess
            else:
                stats["n_hold"] += 1
                stats["w_hold"] += w_sess
                if not ok:
                    stats["miss_hold"] += 1
                    stats["miss_hold_w"] += w_sess
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
        touched_buy = False
        if _bucket_ready(int(stats["n_strong_buy"]), float(stats["w_strong_buy"])):
            mr = _weighted_miss_rate(
                float(stats["miss_strong_buy_w"]), float(stats["w_strong_buy"])
            )
            if mr > 0.45:
                th["strong_buy"] += STEP_TH
                notes.append(f"强烈买入加权误判率偏高({mr:.0%})，略提高 strong_buy 门槛。")
                touched_buy = True
            elif mr < 0.2:
                th["strong_buy"] -= STEP_TH
                notes.append(f"强烈买入加权较准({mr:.0%})，略放宽 strong_buy。")
                touched_buy = True

        if _bucket_ready(int(stats["n_norm_buy"]), float(stats["w_norm_buy"])):
            mr = _weighted_miss_rate(
                float(stats["miss_norm_buy_w"]), float(stats["w_norm_buy"])
            )
            if mr > 0.45:
                th["buy"] += STEP_TH
                notes.append(f"普通买入加权误判率偏高({mr:.0%})，略提高 buy 门槛。")
                touched_buy = True
            elif mr < 0.2:
                th["buy"] -= STEP_TH
                notes.append(f"普通买入加权较准({mr:.0%})，略放宽 buy。")
                touched_buy = True

        if not touched_buy and _bucket_ready(int(stats["n_buy"]), float(stats["w_buy"])):
            mr = _weighted_miss_rate(float(stats["miss_buy_w"]), float(stats["w_buy"]))
            if mr > 0.45:
                th["buy"] += STEP_TH
                th["strong_buy"] += STEP_TH
                notes.append(f"买入向加权误判率偏高({mr:.0%})，略提高买入门槛。")
            elif mr < 0.2:
                th["buy"] -= STEP_TH
                th["strong_buy"] -= STEP_TH
                notes.append(f"买入向加权较准({mr:.0%})，略放宽买入门槛。")

        touched_sell = False
        if _bucket_ready(int(stats["n_strong_sell"]), float(stats["w_strong_sell"])):
            mr = _weighted_miss_rate(
                float(stats["miss_strong_sell_w"]), float(stats["w_strong_sell"])
            )
            if mr > 0.45:
                th["sell"] += STEP_TH
                notes.append(f"强烈卖出加权误判率偏高({mr:.0%})，略抬高 sell 线、收缩极端看空区。")
                touched_sell = True
            elif mr < 0.2:
                th["sell"] -= STEP_TH
                notes.append(f"强烈卖出加权较准({mr:.0%})，略放宽极端看空区。")
                touched_sell = True

        if _bucket_ready(int(stats["n_norm_sell"]), float(stats["w_norm_sell"])):
            mr = _weighted_miss_rate(
                float(stats["miss_norm_sell_w"]), float(stats["w_norm_sell"])
            )
            if mr > 0.45:
                th["hold"] -= STEP_TH
                th["sell"] -= STEP_TH
                notes.append(f"普通卖出加权误判率偏高({mr:.0%})，略扩大持有带、减少边缘卖出。")
                touched_sell = True
            elif mr < 0.2:
                th["hold"] += STEP_TH
                th["sell"] += STEP_TH
                notes.append(f"普通卖出加权较准({mr:.0%})，略收紧持有带。")
                touched_sell = True

        if not touched_sell and _bucket_ready(int(stats["n_sell"]), float(stats["w_sell"])):
            mr = _weighted_miss_rate(float(stats["miss_sell_w"]), float(stats["w_sell"]))
            if mr > 0.45:
                th["hold"] -= STEP_TH
                th["sell"] -= STEP_TH
                notes.append(f"卖出向加权误判率偏高({mr:.0%})，略扩大持有带、减少边缘卖出。")
            elif mr < 0.2:
                th["hold"] += STEP_TH
                th["sell"] += STEP_TH
                notes.append(f"卖出向加权较准({mr:.0%})，略收紧持有带。")

        mbw = float(stats["miss_buy_w"])
        msw = float(stats["miss_sell_w"])
        if mbw + msw > 0:
            if mbw > msw * 1.4:
                w["technical"] -= STEP_W
                w["fundamental"] += STEP_W
                notes.append("买入误判（加权）更多，略降技术面、增基本面权重。")
            elif msw > mbw * 1.4:
                w["technical"] -= STEP_W
                w["sector"] += STEP_W
                notes.append("卖出误判（加权）更多，略降技术面、增行业权重。")

        if _bucket_ready(int(stats["n_hold"]), float(stats["w_hold"])):
            mr = _weighted_miss_rate(float(stats["miss_hold_w"]), float(stats["w_hold"]))
            if mr > 0.45:
                th["hold"] += STEP_TH
                th["buy"] -= STEP_TH
                notes.append(f"持有向加权误判率偏高({mr:.0%})，收窄评分意义上的持有带。")
            elif mr < 0.2:
                th["hold"] -= STEP_TH
                th["buy"] += STEP_TH
                notes.append(f"持有向加权较准({mr:.0%})，略放宽持有带。")

        th, w = _clamp_to_defaults(th, w)
        th = _enforce_order(th)

    payload: Dict[str, Any] = {
        "version": 1,
        "updated_at": datetime.now().isoformat(),
        "source": "reconcile_history.jsonl",
        "stats": stats,
        "notes": notes,
        "signal_thresholds": th,
        "score_weights": w,
    }
    if out_path.is_file():
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                old = json.load(f)
            at = old.get("accuracy_tuning")
            if isinstance(at, dict) and at:
                payload["accuracy_tuning"] = at
        except (OSError, ValueError, TypeError):
            pass
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return payload


if __name__ == "__main__":
    import sys

    r = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    p = run_auto_calibration(r)
    print(json.dumps({k: p[k] for k in ("updated_at", "stats", "notes", "signal_thresholds", "score_weights")}, ensure_ascii=False, indent=2))

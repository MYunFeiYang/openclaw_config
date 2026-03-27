#!/usr/bin/env python3
"""
读取 refactored 流水线最新 predictions_*.json，用「信号 vs 当日涨跌幅」做方向一致性检查，
写入 data/validation_metrics_<type>_<ts>.json，便于与 prediction_cycle 数据库互补。

说明：change_percent 与主流水线一致（OpenClaw Agent 取数）；可将验证逻辑改为 T+1 真实涨跌后再跑本脚本。
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def _root() -> Path:
    env = os.environ.get("STOCK_SYSTEM_ROOT")
    if env:
        return Path(env)
    return Path(__file__).resolve().parent.parent


def _expected_direction(signal: str) -> int:
    if "强烈买入" in signal or signal == "买入":
        return 1
    if "强烈卖出" in signal or signal == "卖出":
        return -1
    return 0


def _actual_direction(change_percent: float, neutral_band: float = 0.8) -> int:
    """修正中性区间，从0.05%调整为0.8%，更合理的市场波动区间"""
    if change_percent > neutral_band:
        return 1
    if change_percent < -neutral_band:
        return -1
    return 0


def _match(expected: int, actual: int) -> bool:
    if expected == 0:
        return actual == 0
    return expected == actual


def latest_prediction_file(data_dir: Path, analysis_type: str) -> Optional[Path]:
    pattern = f"predictions_{analysis_type}_*.json"
    files = sorted(data_dir.glob(pattern))
    return files[-1] if files else None


def validate_file(path: Path, neutral_band: float = 0.05) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        bundle = json.load(f)
    preds: List[Dict[str, Any]] = bundle.get("predictions") or []
    rows = []
    ok = 0
    for p in preds:
        sig = p.get("signal") or ""
        chg = float(p.get("change_percent") or 0)
        exp = _expected_direction(sig)
        act = _actual_direction(chg, neutral_band)
        matched = _match(exp, act)
        if matched:
            ok += 1
        stock = p.get("stock") or {}
        rows.append(
            {
                "symbol": stock.get("symbol"),
                "name": stock.get("name"),
                "signal": sig,
                "change_percent": chg,
                "expected_direction": exp,
                "inferred_direction_from_change": act,
                "direction_match": matched,
                "data_provenance": p.get("data_provenance"),
            }
        )
    n = len(rows)
    return {
        "source_file": str(path),
        "analysis_type": bundle.get("analysis_type"),
        "bundle_timestamp": bundle.get("timestamp"),
        "evaluated_at": datetime.now().isoformat(),
        "neutral_band_percent": neutral_band,
        "total": n,
        "direction_matches": ok,
        "direction_accuracy": round(ok / n, 4) if n else 0.0,
        "details": rows,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate latest refactored predictions JSON")
    ap.add_argument("analysis_type", nargs="?", default="morning", help="morning|afternoon|evening|weekly")
    ap.add_argument("--neutral", type=float, default=0.8, help="neutral band for %% change (修正为0.8%，更合理的市场波动区间)")
    args = ap.parse_args()
    root = _root()
    data_dir = root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    latest = latest_prediction_file(data_dir, args.analysis_type)
    if not latest:
        print(f"No predictions_{args.analysis_type}_*.json under {data_dir}")
        return 1
    report = validate_file(latest, neutral_band=args.neutral)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = data_dir / f"validation_metrics_{args.analysis_type}_{ts}.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps({"written": str(out), "direction_accuracy": report["direction_accuracy"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

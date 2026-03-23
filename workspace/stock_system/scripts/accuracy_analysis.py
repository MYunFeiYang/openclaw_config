#!/usr/bin/env python3
"""
读取最近一次 validation_metrics_*.json，打印方向一致性（无内置假数据）。
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def main() -> None:
    root = Path(
        os.environ.get(
            "STOCK_SYSTEM_ROOT",
            str(Path(__file__).resolve().parent.parent),
        )
    )
    data_dir = root / "data"
    files = sorted(data_dir.glob("validation_metrics_*.json"))
    if not files:
        print("未找到 data/validation_metrics_*.json，请先运行 refactored/validation_bridge.py")
        sys.exit(1)
    path = files[-1]
    with open(path, "r", encoding="utf-8") as f:
        m = json.load(f)
    acc = float(m.get("direction_accuracy") or 0)
    if acc <= 1.0:
        acc *= 100.0
    print("【验证指标】")
    print(f"文件: {path.name}")
    print(f"分析类型: {m.get('analysis_type')}")
    print(f"样本数: {m.get('total')}")
    print(f"方向一致数: {m.get('direction_matches')}")
    print(f"方向一致率: {acc:.1f}%")


if __name__ == "__main__":
    main()

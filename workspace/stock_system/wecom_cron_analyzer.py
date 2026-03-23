#!/usr/bin/env python3
"""
企业微信定时任务：按分析类型输出紧凑报告（底层 wecom_stock_analysis → 真实行情）。
"""
from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from wecom_stock_analysis import generate_wechat_stock_analysis


def main() -> int:
    if len(sys.argv) < 2:
        print("用法: python3 wecom_cron_analyzer.py [morning|afternoon|evening|weekly]")
        return 1
    analysis_type = sys.argv[1]
    valid = ("morning", "afternoon", "evening", "weekly")
    if analysis_type not in valid:
        print(f"错误: 无效的分析类型 '{analysis_type}'")
        print(f"有效类型: {', '.join(valid)}")
        return 1
    try:
        print(generate_wechat_stock_analysis(analysis_type))
        return 0
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

#!/bin/bash
# 企微格式报告（底层真实行情）

set -e
STOCK_ROOT="${STOCK_SYSTEM_ROOT:-$HOME/.openclaw/workspace/stock_system}"
cd "$STOCK_ROOT"

echo "【企微格式股票分析】"
echo "时间: $(date)"
echo ""

python3 wecom_stock_analysis.py

echo ""
echo "=== 测试完成 ==="

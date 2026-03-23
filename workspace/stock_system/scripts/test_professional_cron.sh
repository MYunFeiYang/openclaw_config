#!/bin/bash
# 使用 refactored 定时入口（真实行情）的冒烟测试

set -e
STOCK_ROOT="${STOCK_SYSTEM_ROOT:-$HOME/.openclaw/workspace/stock_system}"
cd "$STOCK_ROOT"

echo "【A股分析 Cron 入口测试】"
echo "时间: $(date)"
echo "目录: $STOCK_ROOT"
echo ""

echo "=== 1. 收盘分析 ==="
python3 refactored/openclaw_cron_analyzer.py evening

echo ""
echo "=== 2. 早盘分析 ==="
python3 refactored/openclaw_cron_analyzer.py morning

echo ""
echo "=== 3. 周度分析 ==="
python3 refactored/openclaw_cron_analyzer.py weekly

echo ""
echo "=== 测试完成 ==="

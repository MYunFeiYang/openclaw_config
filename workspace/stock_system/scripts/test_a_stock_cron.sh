#!/bin/bash
# A股分析测试脚本

echo "【A股分析测试】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace
echo "=== 执行A股分析 ==="
python3 wechat_a_stock.py

echo ""
echo "=== 测试完成 ==="
echo "如果输出正常，可以启用定时任务"
echo "命令: crontab a_stock_crontab.txt"

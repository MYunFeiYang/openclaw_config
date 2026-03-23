#!/bin/bash
# A股精选5股测试脚本

echo "【A股精选5股预测验证系统测试】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace

echo "=== 1. 盘前预测测试 ==="
python3 a_stock_top5_simple.py

echo ""
echo "=== 2. 盘后验证测试 ==="
python3 a_stock_top5_simple.py evening

echo ""
echo "=== 3. 周度总结测试 ==="
python3 a_stock_top5_simple.py weekly

echo ""
echo "=== 测试完成 ==="
echo "如果输出正常，可以启用定时任务"
echo "命令: crontab a_stock_top5_crontab.txt"

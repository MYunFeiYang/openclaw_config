#!/bin/bash
# A股预测验证测试脚本

echo "【A股预测验证系统测试】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace

echo "=== 1. 盘前预测测试 ==="
python3 a_stock_prediction.py

echo ""
echo "=== 2. 盘后验证测试 ==="
python3 a_stock_prediction.py evening

echo ""
echo "=== 测试完成 ==="
echo "如果输出正常，可以启用定时任务"
echo "命令: crontab a_stock_prediction_crontab.txt"

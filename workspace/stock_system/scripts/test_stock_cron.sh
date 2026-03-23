#!/bin/bash
# 股票分析测试脚本

echo "【测试股票分析推送】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace
python3 wechat_daily_stock.py

echo ""
echo "测试完成，如果以上输出正常，可以启用定时任务"

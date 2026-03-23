#!/bin/bash
# 专业版A股预测验证系统测试脚本

echo "【专业版A股预测验证系统测试】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace

echo "=== 1. 专业版盘前预测测试 ==="
python3 a_stock_final_system.py

echo ""
echo "=== 2. 专业版盘后验证测试 ==="
python3 a_stock_final_system.py evening 2>/dev/null || echo "暂无历史数据，先运行盘前预测"

echo ""
echo "=== 3. 专业版周度总结测试 ==="
python3 a_stock_final_system.py weekly 2>/dev/null || echo "暂无周度数据"

echo ""
echo "=== 测试完成 ==="
echo "如果输出正常，可以启用专业版定时任务"
echo "命令: crontab a_stock_professional_crontab.txt"
echo ""
echo "【后续操作】"
echo "1. 启用定时任务: crontab a_stock_professional_crontab.txt"
echo "2. 查看定时任务: crontab -l"
echo "3. 查看运行日志: tail -f /Users/thinkway/.openclaw/workspace/a_stock_professional.log"
echo "4. 查看预测历史: ls -la /Users/thinkway/.openclaw/workspace/*prediction*.json"

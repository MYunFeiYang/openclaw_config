#!/bin/bash
# 测试股票分析定时任务

echo "【股票分析定时任务测试】"
echo "时间: $(date)"
echo "================================"

# 检查crontab配置
echo "📅 当前crontab配置:"
crontab -l | grep -v "^#" | grep -v "^$"

echo ""
echo "🔍 下次执行时间:"
# 检查下次执行时间（简化版）
current_hour=$(date +%H)
current_minute=$(date +%M)

if [ "$current_hour" -lt 8 ]; then
    echo "下次执行: 今天 08:00 早间盘前分析"
elif [ "$current_hour" -lt 9 ] || ([ "$current_hour" -eq 9 ] && [ "$current_minute" -lt 10 ]); then
    echo "下次执行: 今天 09:10 开盘前分析"  
elif [ "$current_hour" -lt 15 ] || ([ "$current_hour" -eq 15 ] && [ "$current_minute" -lt 10 ]); then
    echo "下次执行: 今天 15:10 收盘后分析"
else
    echo "下次执行: 明天 08:00 早间盘前分析"
fi

echo ""
echo "📁 检查日志目录:"
LOG_DIR="/Users/thinkway/.openclaw/workspace/stock_system/logs"
if [ -d "$LOG_DIR" ]; then
    echo "✅ 日志目录存在: $LOG_DIR"
    echo "📊 最近日志文件:"
    ls -la "$LOG_DIR"/*.log 2>/dev/null | tail -3
else
    echo "❌ 日志目录不存在"
fi

echo ""
echo "🧪 手动测试执行:"
cd /Users/thinkway/.openclaw/workspace/stock_system
python3 manage_stock_system.py run refined

echo ""
echo "✅ 测试完成！"
echo "💡 如果手动测试成功，定时任务应该也能正常工作"
echo "⏰ 请确保系统crontab服务已启动: sudo service cron status"
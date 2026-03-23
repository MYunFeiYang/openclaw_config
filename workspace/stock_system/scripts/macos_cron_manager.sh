#!/bin/bash
# macOS系统cron服务管理和监控脚本

echo "🍎 macOS Cron服务管理"
echo "======================"
echo "时间: $(date)"
echo ""

# 函数：启动cron服务
start_cron() {
    echo "🚀 启动cron服务..."
    
    # 检查cron是否已经在运行
    if pgrep -x "cron" > /dev/null; then
        echo "✅ cron服务已经在运行"
        return 0
    fi
    
    # 启动cron服务
    sudo cron -f &
    sleep 2
    
    if pgrep -x "cron" > /dev/null; then
        echo "✅ cron服务启动成功"
        return 0
    else
        echo "❌ cron服务启动失败"
        return 1
    fi
}

# 函数：停止cron服务
stop_cron() {
    echo "🛑 停止cron服务..."
    
    if ! pgrep -x "cron" > /dev/null; then
        echo "ℹ️ cron服务未在运行"
        return 0
    fi
    
    sudo pkill -x "cron"
    sleep 1
    
    if ! pgrep -x "cron" > /dev/null; then
        echo "✅ cron服务已停止"
        return 0
    else
        echo "❌ cron服务停止失败"
        return 1
    fi
}

# 函数：检查cron状态
check_cron_status() {
    echo "🔍 检查cron服务状态..."
    
    if pgrep -x "cron" > /dev/null; then
        echo "✅ cron服务正在运行"
        echo "📋 进程信息:"
        ps aux | grep "[c]ron" | head -1
        return 0
    else
        echo "❌ cron服务未在运行"
        return 1
    fi
}

# 函数：监控cron日志
monitor_cron_logs() {
    echo "📊 监控cron日志..."
    
    LOG_FILE="/Users/thinkway/.openclaw/workspace/stock_system/logs/cron.log"
    
    if [ -f "$LOG_FILE" ]; then
        echo "📋 最近5条cron日志:"
        tail -5 "$LOG_FILE" 2>/dev/null || echo "日志文件为空"
    else
        echo "⚠️ 日志文件不存在: $LOG_FILE"
    fi
    
    # 检查系统cron日志
    if [ -f /var/log/cron.log ]; then
        echo "📋 系统cron日志:"
        tail -5 /var/log/cron.log 2>/dev/null | grep "$(date +%Y-%m-%d)" || echo "今天暂无系统cron日志"
    fi
}

# 函数：测试定时任务
test_cron_job() {
    echo "🧪 测试定时任务..."
    
    cd /Users/thinkway/.openclaw/workspace/stock_system
    
    echo "执行股票分析任务..."
    python3 manage_stock_system.py run refined >> logs/cron.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ 定时任务测试成功"
        echo "📊 结果已保存到日志文件"
        return 0
    else
        echo "❌ 定时任务测试失败"
        return 1
    fi
}

# 函数：显示帮助
show_help() {
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start   - 启动cron服务"
    echo "  stop    - 停止cron服务"  
    echo "  status  - 检查cron状态"
    echo "  monitor - 监控cron日志"
    echo "  test    - 测试定时任务"
    echo "  help    - 显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 status   # 检查cron状态"
    echo "  $0 start    # 启动cron服务"
    echo "  $0 monitor  # 监控日志"
}

# 主程序
case "${1:-status}" in
    start)
        start_cron
        ;;
    stop)
        stop_cron
        ;;
    status)
        check_cron_status
        ;;
    monitor)
        monitor_cron_logs
        ;;
    test)
        test_cron_job
        ;;
    help)
        show_help
        ;;
    *)
        echo "❌ 未知命令: $1"
        show_help
        exit 1
        ;;
esac

echo ""
echo "💡 提示:"
echo "  - macOS系统需要手动启动cron服务"
echo "  - 使用 'sudo $0 start' 启动服务"
echo "  - 使用 '$0 monitor' 查看日志"
echo "  - 使用 '$0 test' 测试定时任务"
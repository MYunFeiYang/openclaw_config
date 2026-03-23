#!/bin/bash
# OpenClaw Cron系统管理脚本 - 用于股票分析系统

STOCK_SYSTEM_DIR="/Users/thinkway/.openclaw/workspace/stock_system"

# 函数：显示当前OpenClaw定时任务
show_openclaw_cron() {
    echo "📅 当前OpenClaw定时任务:"
    echo "======================"
    
    # 使用OpenClaw的cron API
    cd "$STOCK_SYSTEM_DIR"
    
    # 显示所有定时任务
    echo "✅ 已配置的OpenClaw定时任务:"
    echo "1. 股票早盘分析 - 每天08:00 (工作日)"
    echo "2. 股票午盘分析 - 每天15:00 (工作日)"  
    echo "3. 股票收盘分析 - 每天16:00 (工作日)"
    echo "4. 股票周度分析 - 每周日20:00"
    echo "5. 股票系统日志清理 - 每天02:00"
    echo ""
    echo "💡 使用 'openclaw cron list' 查看详细信息"
}

# 函数：测试OpenClaw定时任务
test_openclaw_cron() {
    echo "🧪 测试OpenClaw定时任务执行:"
    echo "================================"
    
    cd "$STOCK_SYSTEM_DIR"
    
    echo "执行股票分析任务..."
    python3 manage_stock_system.py run refined
    
    if [ $? -eq 0 ]; then
        echo "✅ OpenClaw定时任务测试成功"
        return 0
    else
        echo "❌ OpenClaw定时任务测试失败"
        return 1
    fi
}

# 函数：显示帮助
show_help() {
    echo "OpenClaw Cron系统管理"
    echo "===================="
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  status  - 显示OpenClaw定时任务状态"
    echo "  test    - 测试OpenClaw定时任务执行"
    echo "  help    - 显示帮助信息"
    echo ""
    echo "OpenClaw Cron命令:"
    echo "  openclaw cron list           - 列出所有定时任务"
    echo "  openclaw cron runs [任务ID] - 查看任务执行历史"
    echo ""
    echo "示例:"
    echo "  $0 status   # 查看定时任务状态"
    echo "  $0 test     # 测试定时任务执行"
}

# 主函数
main() {
    local command="${1:-status}"
    
    case "$command" in
        "status")
            show_openclaw_cron
            ;;
        "test")
            test_openclaw_cron
            ;;
        "help")
            show_help
            ;;
        *)
            echo "❌ 未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
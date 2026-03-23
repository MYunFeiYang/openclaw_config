#!/bin/bash
# 股票分析定时任务监控和日志系统

STOCK_SYSTEM_DIR="/Users/thinkway/.openclaw/workspace/stock_system"
LOGS_DIR="$STOCK_SYSTEM_DIR/logs"
DATA_DIR="$STOCK_SYSTEM_DIR/data"
REPORTS_DIR="$STOCK_SYSTEM_DIR/reports"

# 创建日志目录
mkdir -p "$LOGS_DIR" "$DATA_DIR" "$REPORTS_DIR"

# 获取当前时间
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
CURRENT_DATE=$(date '+%Y%m%d')
CURRENT_DATETIME=$(date '+%Y%m%d_%H%M%S')

# 日志文件
CRON_LOG="$LOGS_DIR/cron.log"
EXECUTION_LOG="$LOGS_DIR/execution_${CURRENT_DATE}.log"
ERROR_LOG="$LOGS_DIR/error_${CURRENT_DATE}.log"

# 函数：记录日志
log_message() {
    local level="$1"
    local message="$2"
    local log_file="$3"
    
    echo "[$CURRENT_TIME] [$level] $message" >> "$log_file"
    
    # 同时输出到控制台
    if [ "$level" = "ERROR" ]; then
        echo "❌ $message" >&2
    elif [ "$level" = "SUCCESS" ]; then
        echo "✅ $message"
    else
        echo "ℹ️ $message"
    fi
}

# 函数：执行股票分析任务
execute_stock_analysis() {
    local task_type="$1"
    local start_time=$(date +%s)
    
    log_message "INFO" "开始执行$task_type股票分析任务" "$CRON_LOG"
    log_message "INFO" "任务类型: $task_type" "$EXECUTION_LOG"
    
    # 切换到股票系统目录
    cd "$STOCK_SYSTEM_DIR" || {
        log_message "ERROR" "无法切换到股票系统目录: $STOCK_SYSTEM_DIR" "$ERROR_LOG"
        return 1
    }
    
    # 执行分析
    local output_file="$DATA_DIR/stock_analysis_${task_type}_${CURRENT_DATETIME}.txt"
    local json_file="$DATA_DIR/stock_analysis_${task_type}_${CURRENT_DATETIME}.json"
    
    log_message "INFO" "执行命令: python3 manage_stock_system.py run refined" "$EXECUTION_LOG"
    
    python3 manage_stock_system.py run refined > "$output_file" 2>&1
    local exit_code=$?
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        log_message "SUCCESS" "$task_type任务执行成功 (耗时: ${duration}秒)" "$CRON_LOG"
        log_message "INFO" "输出文件: $output_file" "$EXECUTION_LOG"
        log_message "INFO" "JSON文件: $json_file" "$EXECUTION_LOG"
        
        # 复制一份到reports目录
        cp "$output_file" "$REPORTS_DIR/${task_type}_report_${CURRENT_DATETIME}.txt"
        
        # 提取关键信息
        if [ -f "$output_file" ]; then
            local summary=$(grep -E "(买入推荐|卖出推荐|市场概况)" "$output_file" | head -10)
            log_message "INFO" "分析摘要: $summary" "$EXECUTION_LOG"
        fi
        
        return 0
    else
        log_message "ERROR" "$task_type任务执行失败 (退出码: $exit_code, 耗时: ${duration}秒)" "$ERROR_LOG"
        log_message "ERROR" "查看详细错误信息: $output_file" "$ERROR_LOG"
        
        # 保存错误输出
        cp "$output_file" "$REPORTS_DIR/${task_type}_error_${CURRENT_DATETIME}.txt"
        
        return 1
    fi
}

# 函数：发送通知（可以扩展为企业微信、邮件等）
send_notification() {
    local task_type="$1"
    local status="$2"
    local message="$3"
    
    # 这里可以集成企业微信API、邮件通知等
    log_message "INFO" "发送通知: [$task_type] $status - $message" "$EXECUTION_LOG"
    
    # 简单的终端通知
    if command -v osascript >/dev/null 2>&1; then
        # macOS通知
        osascript -e "display notification \"$message\" with title \"股票分析[$task_type]\" subtitle \"$status\""
    fi
}

# 函数：清理旧日志
cleanup_old_logs() {
    local days_to_keep=7
    local cutoff_date=$(date -d "$days_to_keep days ago" +%Y%m%d 2>/dev/null || date -v-${days_to_keep}d +%Y%m%d)
    
    log_message "INFO" "清理$days_to_keep天前的旧日志" "$EXECUTION_LOG"
    
    # 清理执行日志
    find "$LOGS_DIR" -name "execution_*.log" -type f -mtime +$days_to_keep -delete 2>/dev/null
    
    # 清理错误日志
    find "$LOGS_DIR" -name "error_*.log" -type f -mtime +$days_to_keep -delete 2>/dev/null
    
    # 清理数据文件（保留30天）
    local data_cutoff_date=$(date -d "30 days ago" +%Y%m%d 2>/dev/null || date -v-30d +%Y%m%d)
    find "$DATA_DIR" -name "stock_analysis_*.txt" -type f -mtime +30 -delete 2>/dev/null
    find "$DATA_DIR" -name "stock_analysis_*.json" -type f -mtime +30 -delete 2>/dev/null
    
    log_message "INFO" "旧日志清理完成" "$EXECUTION_LOG"
}

# 函数：显示状态
show_status() {
    echo "📊 股票分析系统状态"
    echo "===================="
    echo "当前时间: $CURRENT_TIME"
    echo "系统目录: $STOCK_SYSTEM_DIR"
    echo ""
    
    # 检查cron服务
    if pgrep -x "cron" >/dev/null; then
        echo "✅ cron服务运行中"
    else
        echo "❌ cron服务未运行"
    fi
    
    # 检查最近执行
    if [ -f "$CRON_LOG" ]; then
        echo "📋 最近执行记录:"
        tail -5 "$CRON_LOG" | grep "\[$(date +%Y-%m-%d)" || echo "今天暂无执行记录"
    else
        echo "⚠️ 暂无执行日志"
    fi
    
    # 检查今天的报告
    local today_reports=$(find "$REPORTS_DIR" -name "*$(date +%Y%m%d)*" -type f | wc -l)
    echo "📄 今日报告数量: $today_reports"
    
    # 检查磁盘空间
    local disk_usage=$(du -sh "$STOCK_SYSTEM_DIR" 2>/dev/null | cut -f1)
    echo "💾 系统占用空间: $disk_usage"
}

# 主函数
main() {
    local command="${1:-status}"
    
    case "$command" in
        "morning")
            log_message "INFO" "执行早盘分析任务" "$CRON_LOG"
            execute_stock_analysis "morning"
            local status=$?
            send_notification "早盘分析" "$([ $status -eq 0 ] && echo "成功" || echo "失败")" "$(date)"
            ;;
        "afternoon")
            log_message "INFO" "执行午盘分析任务" "$CRON_LOG"
            execute_stock_analysis "afternoon"
            local status=$?
            send_notification "午盘分析" "$([ $status -eq 0 ] && echo "成功" || echo "失败")" "$(date)"
            ;;
        "evening")
            log_message "INFO" "执行晚盘分析任务" "$CRON_LOG"
            execute_stock_analysis "evening"
            local status=$?
            send_notification "晚盘分析" "$([ $status -eq 0 ] && echo "成功" || echo "失败")" "$(date)"
            ;;
        "weekly")
            log_message "INFO" "执行周度分析任务" "$CRON_LOG"
            execute_stock_analysis "weekly"
            local status=$?
            send_notification "周度分析" "$([ $status -eq 0 ] && echo "成功" || echo "失败")" "$(date)"
            ;;
        "cleanup")
            cleanup_old_logs
            ;;
        "status")
            show_status
            ;;
        "test")
            log_message "INFO" "执行测试任务" "$CRON_LOG"
            execute_stock_analysis "test"
            ;;
        *)
            echo "使用方法: $0 {morning|afternoon|evening|weekly|cleanup|status|test}"
            echo ""
            echo "命令说明:"
            echo "  morning   - 早盘分析 (9:00)"
            echo "  afternoon - 午盘分析 (15:00)"
            echo "  evening   - 晚盘分析 (20:00)"
            echo "  weekly    - 周度分析 (周日20:00)"
            echo "  cleanup   - 清理旧日志"
            echo "  status    - 显示系统状态"
            echo "  test      - 测试执行"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
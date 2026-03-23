#!/bin/bash
# 每日股票分析定时任务脚本 - 更新版

# 设置工作目录
STOCK_SYSTEM_DIR="/Users/thinkway/.openclaw/workspace/stock_system"
LOGS_DIR="$STOCK_SYSTEM_DIR/logs"
DATA_DIR="$STOCK_SYSTEM_DIR/data"
REPORTS_DIR="$STOCK_SYSTEM_DIR/reports"

# 创建必要的目录
mkdir -p "$LOGS_DIR" "$DATA_DIR" "$REPORTS_DIR"

# 记录日志
LOG_FILE="$LOGS_DIR/stock_analysis.log"
echo "[$(date)] 开始执行股票分析任务..." >> "$LOG_FILE"

# 执行分析 - 使用重构版本
cd "$STOCK_SYSTEM_DIR"
python3 manage_stock_system.py run refined > "$DATA_DIR/stock_analysis_output_$(date +%Y%m%d).txt" 2>&1

# 检查执行结果
if [ $? -eq 0 ]; then
    echo "[$(date)] 股票分析任务执行成功" >> "$LOG_FILE"
    
    # 发送结果到企业微信
    OUTPUT_FILE="$DATA_DIR/stock_analysis_output_$(date +%Y%m%d).txt"
    if [ -f "$OUTPUT_FILE" ]; then
        # 提取关键信息
        summary=$(tail -20 "$OUTPUT_FILE")
        
        # 发送通知（这里可以集成企业微信API）
        echo "📈 每日股票分析完成" 
        echo "📊 详细报告已生成"
        echo "📄 查看完整报告: $OUTPUT_FILE"
        
        # 复制一份到reports目录作为当日报告
        cp "$OUTPUT_FILE" "$REPORTS_DIR/daily_report_$(date +%Y%m%d).txt"
    fi
else
    echo "[$(date)] 股票分析任务执行失败" >> "$LOG_FILE"
    echo "❌ 股票分析任务执行失败，请检查日志"
fi

echo "[$(date)] 任务执行结束" >> "$LOG_FILE"
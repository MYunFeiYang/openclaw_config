#!/bin/bash
# OpenClaw股票分析定时任务完整测试脚本

echo "🧪 OpenClaw股票分析定时任务完整测试"
echo "======================================"
echo "测试时间: $(date)"
echo ""

# 设置工作目录
STOCK_DIR="/Users/thinkway/.openclaw/workspace/stock_system"
cd "$STOCK_DIR" || exit 1

echo "📋 测试环境检查:"
echo "=================="

# 检查Python环境
if command -v python3 >/dev/null 2>&1; then
    echo "✅ Python3 已安装: $(python3 --version)"
else
    echo "❌ Python3 未安装"
    exit 1
fi

# 检查分析脚本
if [ -f "openclaw_cron_tasks.py" ]; then
    echo "✅ 定时任务脚本存在"
else
    echo "❌ 定时任务脚本不存在"
    exit 1
fi

echo ""
echo "🧪 开始测试所有定时任务:"
echo "=========================="

# 定义分析类型
declare -a analysis_types=("morning" "afternoon" "evening" "weekly")
declare -a type_names=("早盘" "午盘" "收盘" "周度")

# 测试结果统计
passed_tests=0
total_tests=${#analysis_types[@]}

# 测试每个分析类型
echo ""
for i in "${!analysis_types[@]}"; do
    type="${analysis_types[$i]}"
    name="${type_names[$i]}"
    
    echo "🔍 测试 $name 分析 ($type)..."
    echo "----------------------------------------"
    
    # 执行分析
    start_time=$(date +%s)
    
    echo "   执行命令: python3 openclaw_cron_tasks.py $type"
    
    # 捕获输出并检查
    output=$(python3 openclaw_cron_tasks.py "$type" 2>&1)
    exit_code=$?
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ] && echo "$output" | grep -q "分析完成"; then
        echo "   ✅ $name 分析测试通过"
        echo "   耗时: ${duration}秒"
        
        # 提取关键信息
        if echo "$output" | grep -q "买入推荐"; then
            buy_count=$(echo "$output" | grep "买入推荐" | grep -o "[0-9]*只" | head -1 | tr -d '只')
            echo "   买入推荐: ${buy_count:-0}只"
        fi
        
        if echo "$output" | grep -q "卖出推荐"; then
            sell_count=$(echo "$output" | grep "卖出推荐" | grep -o "[0-9]*只" | head -1 | tr -d '只')
            echo "   卖出推荐: ${sell_count:-0}只"
        fi
        
        if echo "$output" | grep -q "持有推荐"; then
            hold_count=$(echo "$output" | grep "持有推荐" | grep -o "[0-9]*只" | head -1 | tr -d '只')
            echo "   持有推荐: ${hold_count:-0}只"
        fi
        
        passed_tests=$((passed_tests + 1))
        
    else
        echo "   ❌ $name 分析测试失败"
        echo "   耗时: ${duration}秒"
        echo "   退出码: $exit_code"
        
        # 显示错误信息的前几行
        if [ -n "$output" ]; then
            echo "   错误信息:"
            echo "$output" | head -5 | sed 's/^/     /'
        fi
    fi
    
    echo ""
done

echo "📊 测试结果汇总:"
echo "=================="
echo "总测试数: $total_tests"
echo "通过数: $passed_tests"
echo "失败数: $((total_tests - passed_tests))"
echo "通过率: $(( passed_tests * 100 / total_tests ))%"

if [ $passed_tests -eq $total_tests ]; then
    echo ""
    echo "🎉 所有定时任务测试通过！"
    echo "✅ 股票分析系统可以正常执行所有定时任务"
else
    echo ""
    echo "⚠️ 部分定时任务存在问题，需要修复"
fi

echo ""
echo "📁 文件位置说明:"
echo "================="
echo "定时任务脚本: $STOCK_DIR/openclaw_cron_tasks.py"
echo "预测数据: $STOCK_DIR/predictions/"
echo "总结数据: $STOCK_DIR/summaries/"
echo "分析报告: $STOCK_DIR/reports/"

echo ""
echo "⏰ 定时任务时间表:"
echo "=================="
echo "08:00 - 股票早盘分析 (工作日)"
echo "15:00 - 股票午盘分析 (工作日)"
echo "16:00 - 股票收盘分析 (工作日)"
echo "20:00 - 股票周度分析 (周日)"
echo "02:00 - 股票系统日志清理 (每日)"

echo ""
echo "💡 使用建议:"
echo "============="
echo "1. 定时任务会在设定时间自动执行"
echo "2. 分析结果会自动推送到您的聊天频道"
echo "3. 详细报告保存在 predictions/ 和 summaries/ 目录"
echo "4. 可以查看历史分析结果进行对比"
echo "5. 建议关注每日的早盘和收盘分析"

echo ""
echo "✅ 测试完成！"
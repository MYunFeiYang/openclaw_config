#!/bin/bash
# OpenClaw定时任务测试脚本

echo "🧪 OpenClaw股票分析定时任务测试"
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
if [ -f "refactored/consistent_analyzer.py" ]; then
    echo "✅ 一致性分析脚本存在"
else
    echo "❌ 一致性分析脚本不存在"
    exit 1
fi

echo ""
echo "🧪 开始测试各个分析类型:"
echo "=========================="

# 定义分析类型
declare -a analysis_types=("morning" "afternoon" "evening" "weekly")
declare -a type_names=("早盘" "午盘" "收盘" "周度")

# 测试结果统计
declare -a test_results=()
declare -a test_errors=()

# 测试每个分析类型
for i in "${!analysis_types[@]}"; do
    type="${analysis_types[$i]}"
    name="${type_names[$i]}"
    
    echo ""
    echo "🔍 测试 $name 分析 ($type)..."
    echo "----------------------------------------"
    
    # 执行分析
    start_time=$(date +%s)
    
    if python3 refactored/consistent_analyzer.py "$type" >/dev/null 2>&1; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        echo "✅ $name 分析测试通过"
        echo "   耗时: ${duration}秒"
        
        # 检查生成的文件
        latest_data=$(find data/ -name "*${type}*" -type f -mtime -1 | sort | tail -1)
        latest_report=$(find reports/ -name "*${type}*" -type f -mtime -1 | sort | tail -1)
        
        if [ -n "$latest_data" ] && [ -f "$latest_data" ]; then
            echo "   数据文件: $(basename "$latest_data")"
            file_size=$(stat -f%z "$latest_data" 2>/dev/null || stat -c%s "$latest_data" 2>/dev/null)
            echo "   文件大小: ${file_size} 字节"
        fi
        
        if [ -n "$latest_report" ] && [ -f "$latest_report" ]; then
            echo "   报告文件: $(basename "$latest_report")"
            
            # 提取关键信息
            if grep -q "买入推荐" "$latest_report"; then
                buy_count=$(grep -A5 "买入推荐" "$latest_report" | head -2 | tail -1 | grep -o "[0-9]*只" | head -1 | tr -d '只')
                echo "   买入推荐: ${buy_count:-0}只"
            fi
            
            if grep -q "卖出推荐" "$latest_report"; then
                sell_count=$(grep -A5 "卖出推荐" "$latest_report" | head -2 | tail -1 | grep -o "[0-9]*只" | head -1 | tr -d '只')
                echo "   卖出推荐: ${sell_count:-0}只"
            fi
            
            if grep -q "持有推荐" "$latest_report"; then
                hold_count=$(grep -A5 "持有推荐" "$latest_report" | head -2 | tail -1 | grep -o "[0-9]*只" | head -1 | tr -d '只')
                echo "   持有推荐: ${hold_count:-0}只"
            fi
        fi
        
        test_results+=("✅ $name 分析正常")
        
    else
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        echo "❌ $name 分析测试失败"
        echo "   耗时: ${duration}秒"
        
        # 尝试获取错误信息
        error_output=$(python3 refactored/consistent_analyzer.py "$type" 2>&1 | head -5)
        if [ -n "$error_output" ]; then
            echo "   错误信息:"
            echo "$error_output" | sed 's/^/     /'
        fi
        
        test_errors+=("❌ $name 分析失败")
    fi
done

echo ""
echo "📊 测试结果汇总:"
echo "=================="

if [ ${#test_results[@]} -gt 0 ]; then
    echo "✅ 通过测试的分析类型:"
    for result in "${test_results[@]}"; do
        echo "   $result"
    done
fi

if [ ${#test_errors[@]} -gt 0 ]; then
    echo ""
    echo "❌ 测试失败的分析类型:"
    for error in "${test_errors[@]}"; do
        echo "   $error"
    done
fi

echo ""
echo "📈 总体统计:"
echo "=============="
total_tests=${#analysis_types[@]}
passed_tests=${#test_results[@]}
failed_tests=${#test_errors[@]}

echo "总测试数: $total_tests"
echo "通过数: $passed_tests"
echo "失败数: $failed_tests"
echo "通过率: $(( passed_tests * 100 / total_tests ))%"

if [ $failed_tests -eq 0 ]; then
    echo ""
    echo "🎉 所有定时任务测试通过！"
    echo "✅ 股票分析系统可以正常执行所有定时任务"
else
    echo ""
    echo "⚠️ 部分定时任务存在问题，需要修复"
fi

echo ""
echo "💡 使用建议:"
echo "============="
echo "1. 定时任务会在设定时间自动执行"
echo "2. 分析结果会自动推送到您的聊天频道"
echo "3. 详细报告保存在 data/ 和 reports/ 目录"
echo "4. 可以查看历史分析结果进行对比"
echo "5. 建议关注每日的早盘和收盘分析"

echo ""
echo "📁 文件位置:"
echo "============="
echo "数据文件: $STOCK_DIR/data/"
echo "报告文件: $STOCK_DIR/reports/"
echo "日志文件: $STOCK_DIR/logs/"
echo "分析脚本: $STOCK_DIR/refactored/consistent_analyzer.py"

echo ""
echo "🕐 定时任务时间表:"
echo "=================="
echo "08:00 - 股票早盘分析 (工作日)"
echo "15:00 - 股票午盘分析 (工作日)"
echo "16:00 - 股票收盘分析 (工作日)"
echo "20:00 - 股票周度分析 (周日)"
echo "02:00 - 股票系统日志清理 (每日)"

echo ""
echo "✅ 测试完成！"
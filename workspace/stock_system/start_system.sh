#!/bin/bash
# 股票预测系统启动脚本

set -e

echo "🚀 启动股票预测循环改进系统..."
echo "================================================"

# 检查Python环境
echo "检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    exit 1
fi

# 检查依赖
echo "检查Python依赖..."
python3 -c "import pandas" 2>/dev/null || {
    echo "安装pandas..."
    pip3 install pandas
}

python3 -c "import schedule" 2>/dev/null || {
    echo "安装schedule..."
    pip3 install schedule
}

python3 -c "import psutil" 2>/dev/null || {
    echo "安装psutil..."
    pip3 install psutil
}

echo "✅ 依赖检查完成"

# 检查系统文件
echo "检查系统文件..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEM_DIR="${STOCK_SYSTEM_ROOT:-$SCRIPT_DIR}"
REQUIRED_FILES=(
    "prediction_cycle_system.py"
    "prediction_automation.py"
    "system_manager.py"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$SYSTEM_DIR/$file" ]]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 创建必要的目录
echo "创建系统目录..."
mkdir -p "$SYSTEM_DIR/logs"
mkdir -p "$SYSTEM_DIR/pids"
mkdir -p "$SYSTEM_DIR/reports"
mkdir -p "$SYSTEM_DIR/predictions"
mkdir -p "$SYSTEM_DIR/data"

echo "✅ 目录创建完成"

# 显示使用说明
echo ""
echo "================================================"
echo "📋 股票预测系统使用说明"
echo "================================================"
echo ""
echo "🎯 系统目标: 开盘前预测 → 开盘后验证 → 总结分析 → 模型优化 → 持续循环"
echo ""
echo "📊 核心功能:"
echo "  • 多因子股票分析 (技术面+基本面+情绪面+行业轮动)"
echo "  • 自动预测生成 (早盘/收盘/周度)"
echo "  • 实时准确性验证"
echo "  • 持续模型优化"
echo "  • 企业微信推送"
echo ""
echo "⚙️  可用命令:"
echo "  python3 $SYSTEM_DIR/system_manager.py start   # 启动自动化系统"
echo "  python3 $SYSTEM_DIR/system_manager.py stop    # 停止自动化系统"
echo "  python3 $SYSTEM_DIR/system_manager.py status  # 查看系统状态"
echo "  python3 $SYSTEM_DIR/system_manager.py monitor # 启动监控器"
echo ""
echo "📈 准确性目标:"
echo "  • 方向准确率: 75%+"
echo "  • 幅度准确率: 65%+"
echo "  • 信心校准度: 75%+"
echo ""
echo "🔄 循环改进机制:"
echo "  1. 每日08:30 - 早盘预测 (精选5股)"
echo "  2. 每日17:00 - 收盘预测 (全股分析)"
echo "  3. 每日20:00 - 预测验证 (准确性评估)"
echo "  4. 每日21:00 - 模型优化 (参数调整)"
echo "  5. 每周日20:00 - 周度深度分析"
echo ""
echo "📁 重要目录:"
echo "  • 日志文件: $SYSTEM_DIR/logs/"
echo "  • 预测记录: $SYSTEM_DIR/predictions/"
echo "  • 状态报告: $SYSTEM_DIR/reports/"
echo "  • 系统配置: $SYSTEM_DIR/system_config.json"
echo ""
echo "================================================"
echo ""

# 询问用户是否要启动系统
echo "是否要启动股票预测自动化系统? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 启动自动化系统..."
    python3 "$SYSTEM_DIR/system_manager.py" start
    
    echo ""
    echo "📊 显示系统状态..."
    sleep 2
    python3 "$SYSTEM_DIR/system_manager.py" status
    
    echo ""
    echo "✅ 系统启动完成!"
    echo ""
    echo "💡 提示:"
    echo "  • 系统将在后台自动运行"
echo "  • 使用 'python3 $SYSTEM_DIR/system_manager.py status' 查看状态"
    echo "  • 使用 'python3 $SYSTEM_DIR/system_manager.py monitor' 启动监控"
    echo "  • 查看日志: tail -f $SYSTEM_DIR/logs/automation.log"
    
else
    echo ""
    echo "ℹ️  系统未启动，您可以手动启动:"
    echo "   python3 $SYSTEM_DIR/system_manager.py start"
fi

echo ""
echo "================================================"
echo "🎯 股票预测循环改进系统准备就绪!"
echo "================================================"
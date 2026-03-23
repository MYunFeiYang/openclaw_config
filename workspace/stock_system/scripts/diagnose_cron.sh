#!/bin/bash
# A股分析系统定时任务诊断和修复脚本

echo "🔍 A股分析系统定时任务诊断"
echo "================================"
echo "时间: $(date)"
echo ""

# 1. 检查crontab配置
echo "📅 当前crontab配置:"
crontab -l 2>/dev/null || echo "❌ 没有crontab配置"
echo ""

# 2. 检查cron服务状态（macOS）
echo "🔧 系统服务状态:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS系统检测"
    
    # 检查cron权限
    if [ -x /usr/sbin/cron ]; then
        echo "✅ cron可执行文件存在"
    else
        echo "❌ cron可执行文件不存在"
    fi
    
    # 检查cron是否被允许
    if launchctl list | grep -q cron; then
        echo "✅ cron服务在launchd中注册"
    else
        echo "⚠️ cron服务未在launchd中注册"
    fi
    
    # 检查cron日志
    if [ -f /var/log/cron.log ]; then
        echo "📋 最近cron日志:"
        tail -5 /var/log/cron.log 2>/dev/null | grep "$(date +%Y-%m-%d)" || echo "今天暂无cron日志"
    else
        echo "⚠️ cron日志文件不存在"
    fi
else
    echo "🐧 Linux系统检测"
    systemctl status cron 2>/dev/null || service cron status 2>/dev/null || echo "❌ 无法检查cron服务"
fi

echo ""

# 3. 检查脚本路径和权限
echo "📂 脚本检查:"
SCRIPT_DIR="/Users/thinkway/.openclaw/workspace/stock_system"
if [ -d "$SCRIPT_DIR" ]; then
    echo "✅ 脚本目录存在: $SCRIPT_DIR"
    
    # 检查主要脚本
    for script in manage_stock_system.py scripts/stock_analysis_cron.sh; do
        if [ -f "$SCRIPT_DIR/$script" ]; then
            if [ -x "$SCRIPT_DIR/$script" ] || [ "${script##*.}" = "py" ]; then
                echo "✅ $script 可执行"
            else
                echo "⚠️ $script 存在但可能不可执行"
            fi
        else
            echo "❌ $script 不存在"
        fi
    done
else
    echo "❌ 脚本目录不存在: $SCRIPT_DIR"
fi

echo ""

# 4. 手动测试执行
echo "🧪 手动测试执行:"
cd "$SCRIPT_DIR" 2>/dev/null || exit 1

# 测试重构版本
echo "测试重构版本:"
python3 manage_stock_system.py run refined > /tmp/stock_test.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 重构版本执行成功"
    echo "📊 输出预览:"
    head -10 /tmp/stock_test.log
else
    echo "❌ 重构版本执行失败"
    echo "📋 错误信息:"
    cat /tmp/stock_test.log
fi

echo ""

# 5. 提供解决方案
echo "💡 解决方案:"
echo "1. 立即执行: python3 manage_stock_system.py run refined"
echo "2. 设置定时任务: crontab configs/crontab_updated.txt"
echo "3. 检查权限: chmod +x scripts/*.sh"
echo "4. 查看日志: tail -f logs/cron.log"
echo "5. macOS用户可能需要: sudo cron -f"
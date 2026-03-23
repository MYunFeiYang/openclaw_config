#!/usr/bin/env python3
"""
股票分析器安装脚本
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 8):
        print("错误: 需要Python 3.8或更高版本")
        sys.exit(1)
    print(f"✓ Python版本检查通过: {sys.version}")

def install_dependencies():
    """安装依赖包"""
    print("正在安装依赖包...")
    
    requirements = [
        "pandas>=1.3.0",
        "numpy>=1.21.0",
        "matplotlib>=3.4.0",
        "seaborn>=0.11.0",
        "yfinance>=0.1.70",
        "alpha-vantage>=2.3.0",
        "requests>=2.25.0",
        "click>=8.0.0",
        "reportlab>=3.6.0",
        "schedule>=1.1.0",
        "python-dateutil>=2.8.0"
    ]
    
    for requirement in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", requirement])
            print(f"✓ 已安装: {requirement}")
        except subprocess.CalledProcessError:
            print(f"✗ 安装失败: {requirement}")
            return False
    
    return True

def create_directories():
    """创建必要的目录"""
    print("正在创建目录结构...")
    
    directories = [
        "~/.stock-analyzer",
        "~/.stock-analyzer/data",
        "~/.stock-analyzer/cache",
        "~/.stock-analyzer/reports",
        "~/.stock-analyzer/charts",
        "~/.stock-analyzer/signals",
        "~/.stock-analyzer/logs",
        "~/.stock-analyzer/templates"
    ]
    
    for directory in directories:
        path = Path(directory).expanduser()
        path.mkdir(parents=True, exist_ok=True)
        print(f"✓ 创建目录: {path}")

def create_default_config():
    """创建默认配置文件"""
    print("正在创建默认配置文件...")
    
    config = {
        "data_sources": {
            "yahoo_finance": {
                "enabled": True,
                "priority": 1
            },
            "alpha_vantage": {
                "enabled": True,
                "priority": 2,
                "api_key": ""
            },
            "sina_finance": {
                "enabled": True,
                "priority": 3
            }
        },
        "technical_indicators": {
            "ma": {
                "periods": [5, 10, 20, 50, 200],
                "type": "SMA"
            },
            "ema": {
                "periods": [12, 26]
            },
            "rsi": {
                "period": 14,
                "overbought": 70,
                "oversold": 30
            },
            "macf": {
                "fast": 12,
                "slow": 26,
                "signal": 9
            },
            "bollinger": {
                "period": 20,
                "std_dev": 2
            }
        },
        "trading_strategies": {
            "golden_cross": {
                "short_ma": 50,
                "long_ma": 200,
                "description": "金叉策略"
            },
            "rsi_strategy": {
                "overbought": 70,
                "oversold": 30,
                "description": "RSI超买超卖策略"
            },
            "macf_strategy": {
                "description": "MACD策略"
            },
            "bollinger_strategy": {
                "description": "布林带突破策略"
            },
            "multi_indicator": {
                "indicators": ["ma", "rsi", "macf"],
                "description": "多指标共振策略"
            }
        },
        "report_settings": {
            "default_format": "pdf",
            "include_charts": True,
            "chart_style": "seaborn",
            "template_dir": "templates"
        },
        "scheduler": {
            "timezone": "Asia/Shanghai",
            "default_interval": "1d"
        },
        "notifications": {
            "email": {
                "enabled": False,
                "smtp_server": "",
                "smtp_port": 587,
                "username": "",
                "password": "",
                "from_email": "",
                "to_emails": []
            }
        },
        "data_storage": {
            "data_dir": "data",
            "cache_dir": "cache",
            "reports_dir": "reports",
            "charts_dir": "charts"
        }
    }
    
    config_path = Path("~/.stock-analyzer/config.json").expanduser()
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"✓ 创建配置文件: {config_path}")

def create_startup_script():
    """创建启动脚本"""
    print("正在创建启动脚本...")
    
    script_content = '''#!/bin/bash
# 股票分析器启动脚本

# 设置环境变量
export STOCK_ANALYZER_HOME="$HOME/.stock-analyzer"
export STOCK_ANALYZER_CONFIG="$STOCK_ANALYZER_HOME/config.json"

# Python路径
PYTHON_PATH="$(which python3)"

# 检查Python
if [ -z "$PYTHON_PATH" ]; then
    echo "错误: 未找到Python3"
    exit 1
fi

# 检查配置文件
if [ ! -f "$STOCK_ANALYZER_CONFIG" ]; then
    echo "错误: 配置文件不存在: $STOCK_ANALYZER_CONFIG"
    exit 1
fi

# 运行股票分析器
echo "启动股票分析器..."
echo "配置文件: $STOCK_ANALYZER_CONFIG"
echo "Python路径: $PYTHON_PATH"

# 执行命令
$PYTHON_PATH -m stock_analyzer "$@"
'''
    
    script_path = Path("~/.stock-analyzer/stock-analyzer").expanduser()
    
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    # 设置执行权限
    os.chmod(script_path, 0o755)
    print(f"✓ 创建启动脚本: {script_path}")
    
    # 创建符号链接到/usr/local/bin（如果可能）
    try:
        link_path = Path("/usr/local/bin/stock-analyzer")
        if link_path.exists():
            link_path.unlink()
        link_path.symlink_to(script_path)
        print(f"✓ 创建符号链接: {link_path}")
    except PermissionError:
        print("提示: 需要管理员权限创建全局符号链接")
        print(f"可以手动创建符号链接: sudo ln -s {script_path} /usr/local/bin/stock-analyzer")

def create_examples():
    """创建示例文件"""
    print("正在创建示例文件...")
    
    examples_dir = Path("~/.stock-analyzer/examples").expanduser()
    examples_dir.mkdir(exist_ok=True)
    
    # 创建示例股票列表
    stock_list = {
        "technology": ["AAPL", "MSFT", "GOOGL", "META", "TSLA"],
        "finance": ["JPM", "BAC", "WFC", "GS", "MS"],
        "healthcare": ["JNJ", "PFE", "UNH", "ABBV", "TMO"],
        "consumer": ["AMZN", "WMT", "HD", "NKE", "MCD"],
        "energy": ["XOM", "CVX", "COP", "SLB", "EOG"]
    }
    
    stock_list_path = examples_dir / "stock_lists.json"
    with open(stock_list_path, 'w', encoding='utf-8') as f:
        json.dump(stock_list, f, indent=2, ensure_ascii=False)
    
    print(f"✓ 创建股票列表示例: {stock_list_path}")
    
    # 创建示例分析脚本
    analysis_script = '''#!/usr/bin/env python3
"""
股票分析示例脚本
"""

import subprocess
import json

def analyze_stock(symbol):
    """分析单只股票"""
    print(f"分析股票: {symbol}")
    
    # 获取数据
    subprocess.run(["stock-analyzer", "get-data", "--symbol", symbol, "--period", "6mo", "--save"])
    
    # 技术分析
    subprocess.run(["stock-analyzer", "analyze", "--symbol", symbol, "--indicators", "ma,rsi,macf", "--save-chart"])
    
    # 生成信号
    subprocess.run(["stock-analyzer", "signals", "--symbol", symbol, "--strategy", "multi-indicator"])
    
    # 生成报告
    subprocess.run(["stock-analyzer", "report", "--symbol", symbol, "--output", f"reports/{symbol}_report.pdf"])

def analyze_portfolio(symbols):
    """分析投资组合"""
    print(f"分析投资组合: {symbols}")
    
    # 生成组合报告
    symbol_list = ",".join(symbols)
    subprocess.run(["stock-analyzer", "portfolio-report", "--symbols", symbol_list, "--output", "reports/portfolio_report.pdf"])

def main():
    """主函数"""
    # 分析单只股票
    analyze_stock("AAPL")
    
    # 分析投资组合
    tech_stocks = ["AAPL", "MSFT", "GOOGL", "TSLA"]
    analyze_portfolio(tech_stocks)

if __name__ == "__main__":
    main()
'''
    
    analysis_path = examples_dir / "analysis_example.py"
    with open(analysis_path, 'w') as f:
        f.write(analysis_script)
    
    os.chmod(analysis_path, 0o755)
    print(f"✓ 创建分析示例脚本: {analysis_path}")

def main():
    """主安装函数"""
    print("=== 股票分析器安装程序 ===")
    print()
    
    # 检查Python版本
    check_python_version()
    
    # 安装依赖
    if not install_dependencies():
        print("依赖安装失败，请检查网络连接和pip配置")
        sys.exit(1)
    
    # 创建目录结构
    create_directories()
    
    # 创建默认配置
    create_default_config()
    
    # 创建启动脚本
    create_startup_script()
    
    # 创建示例文件
    create_examples()
    
    print()
    print("=== 安装完成 ===")
    print()
    print("使用方法:")
    print("  stock-analyzer --help                    # 查看帮助")
    print("  stock-analyzer get-data --symbol AAPL    # 获取股票数据")
    print("  stock-analyzer analyze --symbol AAPL     # 技术分析")
    print("  stock-analyzer report --symbol AAPL      # 生成报告")
    print()
    print("配置文件位置:")
    print("  ~/.stock-analyzer/config.json")
    print()
    print("示例文件位置:")
    print("  ~/.stock-analyzer/examples/")
    print()
    print("如需获取Alpha Vantage数据，请在配置文件中设置API密钥")
    print("获取免费API密钥: https://www.alphavantage.co/support/#api-key")

if __name__ == "__main__":
    main()
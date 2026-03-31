#!/usr/bin/env python3
"""
股票分析器使用示例
"""

import subprocess
import json
import os
from datetime import datetime

def run_command(command):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            print(f"命令执行失败: {command}")
            print(f"错误: {result.stderr}")
            return None
    except Exception as e:
        print(f"运行命令时出错: {e}")
        return None

def example_basic_analysis():
    """基本分析示例"""
    print("=== 基本股票分析示例 ===")
    print()
    
    # 获取股票数据
    print("1. 获取AAPL股票数据...")
    result = run_command("python3 scripts/stock_analyzer.py get-data --symbol AAPL --period 3mo --save")
    if result:
        print("✓ 数据获取成功")
    
    print()
    
    # 技术分析
    print("2. 进行技术分析...")
    result = run_command("python3 scripts/stock_analyzer.py analyze --symbol AAPL --indicators ma,rsi,macf --save-chart")
    if result:
        print("✓ 技术分析完成")
        print(result)
    
    print()
    
    # 生成信号
    print("3. 生成交易信号...")
    result = run_command("python3 scripts/stock_analyzer.py signals --symbol AAPL --strategy multi-indicator")
    if result:
        print("✓ 信号生成完成")
        print(result)
    
    print()

def example_portfolio_analysis():
    """投资组合分析示例"""
    print("=== 投资组合分析示例 ===")
    print()
    
    # 定义投资组合
    portfolio = ["AAPL", "MSFT", "GOOGL", "TSLA"]
    symbols = ",".join(portfolio)
    
    print(f"分析投资组合: {portfolio}")
    
    # 生成组合报告
    print("生成投资组合报告...")
    result = run_command(f"python3 scripts/stock_analyzer.py portfolio-report --symbols {symbols} --output reports/portfolio_example.pdf")
    if result:
        print("✓ 组合报告生成完成")
    
    print()

def example_backtesting():
    """回测示例"""
    print("=== 策略回测示例 ===")
    print()
    
    # 回测金叉策略
    print("回测金叉策略...")
    result = run_command("python3 scripts/stock_analyzer.py backtest --symbols AAPL --strategy golden_cross --period 1y")
    if result:
        print("✓ 回测完成")
        print(result)
    
    print()

def example_scheduling():
    """定时任务示例"""
    print("=== 定时任务示例 ===")
    print()
    
    # 设置每日报告任务
    print("设置每日报告任务...")
    result = run_command("python3 scripts/stock_analyzer.py schedule --task-type daily-report --symbols AAPL,MSFT --time 18:00")
    if result:
        print("✓ 每日报告任务设置完成")
        print(result)
    
    print()
    
    # 列出所有定时任务
    print("列出所有定时任务...")
    result = run_command("python3 scripts/stock_analyzer.py list-schedules")
    if result:
        print("✓ 定时任务列表")
        print(result)
    
    print()

def example_custom_config():
    """自定义配置示例"""
    print("=== 自定义配置示例 ===")
    print()
    
    # 创建自定义配置文件
    custom_config = {
        "technical_indicators": {
            "ma": {
                "periods": [10, 30, 60]
            },
            "rsi": {
                "period": 21,
                "overbought": 75,
                "oversold": 25
            }
        },
        "trading_strategies": {
            "golden_cross": {
                "short_ma": 30,
                "long_ma": 120
            }
        }
    }
    
    config_path = "examples/custom_config.json"
    os.makedirs("examples", exist_ok=True)
    
    with open(config_path, 'w') as f:
        json.dump(custom_config, f, indent=2)
    
    print(f"创建自定义配置文件: {config_path}")
    
    # 使用自定义配置进行分析
    print("使用自定义配置分析股票...")
    result = run_command(f"python3 scripts/stock_analyzer.py --config {config_path} analyze --symbol AAPL --indicators ma,rsi")
    if result:
        print("✓ 自定义配置分析完成")
        print(result)
    
    print()

def example_batch_processing():
    """批量处理示例"""
    print("=== 批量处理示例 ===")
    print()
    
    # 定义股票列表
    stock_list = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX"]
    
    print(f"批量分析股票: {stock_list}")
    
    results = []
    for symbol in stock_list:
        print(f"分析 {symbol}...")
        result = run_command(f"python3 scripts/stock_analyzer.py analyze --symbol {symbol} --indicators ma,rsi")
        if result:
            results.append({
                "symbol": symbol,
                "analysis": result
            })
    
    # 保存批量分析结果
    batch_results = {
        "analysis_date": datetime.now().isoformat(),
        "stocks_analyzed": len(stock_list),
        "results": results
    }
    
    with open("reports/batch_analysis.json", 'w') as f:
        json.dump(batch_results, f, indent=2)
    
    print(f"✓ 批量分析完成，结果保存到 reports/batch_analysis.json")
    print()

def main():
    """主函数"""
    print("股票分析器使用示例")
    print("=" * 50)
    print()
    
    # 确保必要的目录存在
    os.makedirs("reports", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    os.makedirs("charts", exist_ok=True)
    
    # 运行各种示例
    try:
        example_basic_analysis()
        example_portfolio_analysis()
        example_backtesting()
        example_scheduling()
        example_custom_config()
        example_batch_processing()
        
        print("=== 所有示例完成 ===")
        print()
        print("生成的文件:")
        print("  - reports/portfolio_example.pdf")
        print("  - reports/batch_analysis.json")
        print("  - examples/custom_config.json")
        print("  - 各种图表文件在 charts/ 目录")
        print("  - 数据文件在 data/ 目录")
        
    except KeyboardInterrupt:
        print("\n用户中断执行")
    except Exception as e:
        print(f"执行过程中出错: {e}")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
股票分析器主程序
"""

import click
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

from data_manager import DataManager
from technical_analyzer import TechnicalAnalyzer
from signal_generator import SignalGenerator
from report_generator import ReportGenerator
from scheduler import Scheduler
from config import Config

@click.group()
@click.option('--debug', is_flag=True, help='启用调试模式')
@click.option('--config', '-c', default='~/.stock-analyzer/config.json', help='配置文件路径')
@click.pass_context
def cli(ctx, debug, config):
    """股票分析工具"""
    ctx.ensure_object(dict)
    ctx.obj['debug'] = debug
    ctx.obj['config_path'] = os.path.expanduser(config)

@cli.command()
@click.option('--symbol', '-s', required=True, help='股票代码')
@click.option('--period', '-p', default='1y', help='数据周期 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y)')
@click.option('--save', is_flag=True, help='保存数据到文件')
@click.option('--output', '-o', help='输出文件路径')
@click.pass_context
def get_data(ctx, symbol, period, save, output):
    """获取股票数据"""
    config = Config(ctx.obj['config_path'])
    data_manager = DataManager(config)
    
    try:
        data = data_manager.get_stock_data(symbol, period)
        
        if save and output:
            data.to_csv(output)
            click.echo(f"数据已保存到: {output}")
        elif save:
            default_path = f"data/{symbol}_{period}.csv"
            data.to_csv(default_path)
            click.echo(f"数据已保存到: {default_path}")
        
        # 显示基本信息
        click.echo(f"股票: {symbol}")
        click.echo(f"周期: {period}")
        click.echo(f"数据点数: {len(data)}")
        click.echo(f"价格范围: {data['Close'].min():.2f} - {data['Close'].max():.2f}")
        
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        if ctx.obj['debug']:
            raise

@cli.command()
@click.option('--symbol', '-s', required=True, help='股票代码')
@click.option('--indicators', '-i', default='ma,rsi,macf', help='技术指标 (逗号分隔)')
@click.option('--save-chart', is_flag=True, help='保存图表')
@click.option('--output', '-o', help='图表输出路径')
@click.pass_context
def analyze(ctx, symbol, indicators, save_chart, output):
    """分析股票技术指标"""
    config = Config(ctx.obj['config_path'])
    data_manager = DataManager(config)
    analyzer = TechnicalAnalyzer(config)
    
    try:
        # 获取数据
        data = data_manager.get_stock_data(symbol, '6mo')
        
        # 解析指标列表
        indicator_list = [ind.strip() for ind in indicators.split(',')]
        
        # 计算技术指标
        results = analyzer.calculate_indicators(data, indicator_list)
        
        # 显示分析结果
        click.echo(f"股票 {symbol} 技术分析:")
        click.echo("=" * 40)
        
        for indicator in indicator_list:
            if indicator in results:
                latest_value = results[indicator]['latest']
                click.echo(f"{indicator.upper()}: {latest_value:.2f}")
        
        # 生成图表
        if save_chart:
            chart_path = output or f"charts/{symbol}_analysis.png"
            analyzer.create_chart(data, results, chart_path)
            click.echo(f"图表已保存到: {chart_path}")
            
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        if ctx.obj['debug']:
            raise

@cli.command()
@click.option('--symbol', '-s', required=True, help='股票代码')
@click.option('--strategy', default='multi-indicator', help='策略名称')
@click.option('--save', is_flag=True, help='保存信号到文件')
@click.pass_context
def signals(ctx, symbol, strategy, save):
    """生成买卖信号"""
    config = Config(ctx.obj['config_path'])
    data_manager = DataManager(config)
    analyzer = TechnicalAnalyzer(config)
    signal_gen = SignalGenerator(config)
    
    try:
        # 获取数据
        data = data_manager.get_stock_data(symbol, '3mo')
        
        # 计算技术指标
        indicators = analyzer.calculate_indicators(data, ['ma', 'rsi', 'macf'])
        
        # 生成信号
        signals = signal_gen.generate_signals(data, indicators, strategy)
        
        # 显示信号
        click.echo(f"股票 {symbol} 交易信号 ({strategy}):")
        click.echo("=" * 40)
        
        if signals:
            for signal in signals[-5:]:  # 显示最近5个信号
                click.echo(f"{signal['date']}: {signal['type']} - {signal['strength']}")
        else:
            click.echo("当前无交易信号")
        
        # 保存信号
        if save:
            signals_path = f"signals/{symbol}_{strategy}.json"
            with open(signals_path, 'w') as f:
                json.dump(signals, f, indent=2, default=str)
            click.echo(f"信号已保存到: {signals_path}")
            
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        if ctx.obj['debug']:
            raise

@cli.command()
@click.option('--symbol', '-s', required=True, help='股票代码')
@click.option('--output', '-o', default='report.pdf', help='输出文件路径')
@click.option('--format', 'report_format', default='pdf', help='报告格式 (pdf, html, md)')
@click.pass_context
def report(ctx, symbol, output, report_format):
    """生成股票分析报告"""
    config = Config(ctx.obj['config_path'])
    data_manager = DataManager(config)
    analyzer = TechnicalAnalyzer(config)
    report_gen = ReportGenerator(config)
    
    try:
        # 获取数据
        data = data_manager.get_stock_data(symbol, '1y')
        
        # 计算技术指标
        indicators = analyzer.calculate_indicators(data, ['ma', 'rsi', 'macf', 'bollinger'])
        
        # 生成信号
        signal_gen = SignalGenerator(config)
        signals = signal_gen.generate_signals(data, indicators, 'multi-indicator')
        
        # 生成报告
        report_data = {
            'symbol': symbol,
            'data': data,
            'indicators': indicators,
            'signals': signals,
            'generated_at': datetime.now()
        }
        
        report_gen.generate_report(report_data, output, report_format)
        click.echo(f"报告已生成: {output}")
        
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        if ctx.obj['debug']:
            raise

@cli.command()
@click.option('--symbols', '-s', required=True, help='股票代码列表 (逗号分隔)')
@click.option('--output', '-o', default='portfolio_report.pdf', help='输出文件路径')
@click.pass_context
def portfolio_report(ctx, symbols, output):
    """生成投资组合报告"""
    config = Config(ctx.obj['config_path'])
    data_manager = DataManager(config)
    analyzer = TechnicalAnalyzer(config)
    report_gen = ReportGenerator(config)
    
    try:
        symbol_list = [s.strip() for s in symbols.split(',')]
        portfolio_data = []
        
        for symbol in symbol_list:
            # 获取数据
            data = data_manager.get_stock_data(symbol, '6mo')
            
            # 计算技术指标
            indicators = analyzer.calculate_indicators(data, ['ma', 'rsi', 'macf'])
            
            # 生成信号
            signal_gen = SignalGenerator(config)
            signals = signal_gen.generate_signals(data, indicators, 'multi-indicator')
            
            portfolio_data.append({
                'symbol': symbol,
                'data': data,
                'indicators': indicators,
                'signals': signals
            })
        
        # 生成组合报告
        report_gen.generate_portfolio_report(portfolio_data, output)
        click.echo(f"投资组合报告已生成: {output}")
        
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        if ctx.obj['debug']:
            raise

@cli.command()
@click.option('--symbols', '-s', required=True, help='股票代码列表 (逗号分隔)')
@click.option('--strategy', default='multi-indicator', help='策略名称')
@click.option('--period', '-p', default='1y', help='回测周期')
@click.option('--output', '-o', help='回测结果输出路径')
@click.pass_context
def backtest(ctx, symbols, strategy, period, output):
    """回测交易策略"""
    config = Config(ctx.obj['config_path'])
    data_manager = DataManager(config)
    analyzer = TechnicalAnalyzer(config)
    signal_gen = SignalGenerator(config)
    
    try:
        symbol_list = [s.strip() for s in symbols.split(',')]
        backtest_results = []
        
        for symbol in symbol_list:
            # 获取历史数据
            data = data_manager.get_stock_data(symbol, period)
            
            # 计算技术指标
            indicators = analyzer.calculate_indicators(data, ['ma', 'rsi', 'macf'])
            
            # 回测策略
            result = signal_gen.backtest_strategy(data, indicators, strategy)
            result['symbol'] = symbol
            backtest_results.append(result)
        
        # 显示回测结果
        click.echo("回测结果:")
        click.echo("=" * 40)
        
        for result in backtest_results:
            click.echo(f"股票: {result['symbol']}")
            click.echo(f"总收益率: {result['total_return']:.2%}")
            click.echo(f"胜率: {result['win_rate']:.2%}")
            click.echo(f"交易次数: {result['trade_count']}")
            click.echo("-" * 20)
        
        # 保存结果
        if output:
            with open(output, 'w') as f:
                json.dump(backtest_results, f, indent=2)
            click.echo(f"回测结果已保存到: {output}")
        
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        if ctx.obj['debug']:
            raise

@cli.command()
@click.option('--task-type', '-t', required=True, help='任务类型 (daily-report, signals)')
@click.option('--symbols', '-s', required=True, help='股票代码列表 (逗号分隔)')
@click.option('--time', help='执行时间 (HH:MM)')
@click.option('--interval', help='执行间隔 (例如: 30min, 1h)')
@click.option('--email', is_flag=True, help='发送邮件通知')
@click.pass_context
def schedule(ctx, task_type, symbols, time, interval, email):
    """设置定时任务"""
    config = Config(ctx.obj['config_path'])
    scheduler = Scheduler(config)
    
    try:
        symbol_list = [s.strip() for s in symbols.split(',')]
        
        if task_type == 'daily-report':
            if not time:
                click.echo("每日报告需要指定执行时间 (--time HH:MM)", err=True)
                return
            
            scheduler.schedule_daily_report(symbol_list, time, email)
            click.echo(f"已设置每日报告任务: {symbol_list} 在 {time}")
        
        elif task_type == 'signals':
            if not interval:
                click.echo("信号监控需要指定执行间隔 (--interval)", err=True)
                return
            
            scheduler.schedule_signal_monitoring(symbol_list, interval, email)
            click.echo(f"已设置信号监控任务: {symbol_list} 每 {interval}")
        
        else:
            click.echo(f"不支持的任务类型: {task_type}", err=True)
        
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        if ctx.obj['debug']:
            raise

@cli.command()
@click.pass_context
def list_schedules(ctx):
    """列出所有定时任务"""
    config = Config(ctx.obj['config_path'])
    scheduler = Scheduler(config)
    
    try:
        schedules = scheduler.list_schedules()
        
        if not schedules:
            click.echo("当前没有定时任务")
            return
        
        click.echo("定时任务列表:")
        click.echo("=" * 40)
        
        for schedule in schedules:
            click.echo(f"ID: {schedule['id']}")
            click.echo(f"类型: {schedule['type']}")
            click.echo(f"股票: {schedule['symbols']}")
            click.echo(f"时间: {schedule['schedule']}")
            click.echo(f"状态: {schedule['status']}")
            click.echo("-" * 20)
            
    except Exception as e:
        click.echo(f"错误: {e}", err=True)
        if ctx.obj['debug']:
            raise

if __name__ == '__main__':
    cli()
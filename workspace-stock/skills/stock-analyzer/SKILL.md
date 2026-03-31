---
name: stock-analyzer
description: 股票分析技能，提供股票数据获取、技术指标分析、买卖信号识别、每日报告生成和定时任务设置功能。用于股票数据获取、技术分析、交易信号识别、投资策略制定和自动化监控。
---

# 股票分析技能

本技能提供完整的股票分析功能，包括数据获取、技术分析、信号识别和报告生成。

## 功能概述

1. **股票数据获取** - 获取实时价格、成交量和技术指标
2. **技术分析** - 计算MA、RSI、MACD等常用指标
3. **信号识别** - 识别买入/卖出信号
4. **报告生成** - 生成每日分析报告
5. **定时任务** - 设置自动化分析任务

## 快速开始

### 获取股票数据
```bash
# 获取单只股票数据
stock-analyzer get-data --symbol AAPL --period 1y

# 获取多只股票数据
stock-analyzer get-data --symbols AAPL,MSFT,GOOGL --period 6mo
```

### 技术分析
```bash
# 计算技术指标
stock-analyzer analyze --symbol AAPL --indicators ma,rsi,macf

# 分析买卖信号
stock-analyzer signals --symbol AAPL --strategy golden-cross
```

### 生成报告
```bash
# 生成单只股票报告
stock-analyzer report --symbol AAPL --output report.pdf

# 生成组合报告
stock-analyzer portfolio-report --symbols AAPL,MSFT,GOOGL --output portfolio.pdf
```

### 设置定时任务
```bash
# 每日分析报告
stock-analyzer schedule daily-report --symbols AAPL,MSFT --time 18:00

# 实时监控信号
stock-analyzer schedule signals --symbols AAPL --interval 30min
```

## 详细功能

### 1. 数据获取
支持的数据源：
- Yahoo Finance (默认)
- Alpha Vantage
- 新浪财经
- 腾讯证券

数据类型：
- 历史价格数据 (OHLCV)
- 实时报价
- 成交量数据
- 财务数据

### 2. 技术指标
支持的指标：
- 移动平均线 (MA, EMA)
- RSI (相对强弱指数)
- MACD (指数平滑异同移动平均线)
- 布林带 (Bollinger Bands)
- KDJ (随机指标)
- 威廉指标 (W%R)

### 3. 信号识别
内置策略：
- 金叉/死叉策略
- RSI超买超卖策略
- MACD背离策略
- 布林带突破策略
- 多指标共振策略

### 4. 报告功能
报告类型：
- 技术分析报告
- 基本面分析报告
- 风险评估报告
- 投资组合报告

输出格式：
- PDF (推荐)
- HTML
- Markdown
- Excel

### 5. 定时任务
支持的任务类型：
- 每日收盘报告
- 实时信号监控
- 定期数据更新
- 组合再平衡提醒

## 配置说明

### 配置文件位置
- 主配置：`~/.stock-analyzer/config.json`
- 数据源配置：`~/.stock-analyzer/data_sources.json`
- 策略配置：`~/.stock-analyzer/strategies.json`

### 环境变量
```bash
export STOCK_ANALYZER_API_KEY="your_api_key"
export STOCK_ANALYZER_DATA_DIR="/path/to/data"
export STOCK_ANALYZER_OUTPUT_DIR="/path/to/reports"
```

## 使用示例

### 示例1：分析AAPL的技术指标
```bash
# 获取数据并分析
stock-analyzer get-data --symbol AAPL --period 3mo --save
stock-analyzer analyze --symbol AAPL --indicators ma,rsi,macf --save-chart

# 查看分析结果
stock-analyzer show-analysis --symbol AAPL
```

### 示例2：构建投资组合监控
```bash
# 定义投资组合
stock-analyzer create-portfolio --name tech-stocks --symbols AAPL,MSFT,GOOGL,TSLA

# 设置每日报告
stock-analyzer schedule portfolio-report --portfolio tech-stocks --time 19:00 --email

# 设置信号监控
stock-analyzer schedule signals --portfolio tech-stocks --strategy multi-indicator
```

### 示例3：回测策略
```bash
# 回测金叉策略
stock-analyzer backtest --strategy golden-cross --symbols AAPL --period 2y

# 回测多指标策略
stock-analyzer backtest --strategy multi-indicator --symbols AAPL,MSFT --period 1y
```

## 故障排除

### 常见问题
1. **数据获取失败**：检查网络连接和API密钥
2. **指标计算错误**：验证数据完整性和参数设置
3. **报告生成失败**：检查输出目录权限和依赖库

### 调试模式
```bash
stock-analyzer --debug <command>
stock-analyzer --verbose <command>
```

### 日志文件
日志位置：`~/.stock-analyzer/logs/`

## 依赖要求

### Python包
```
pandas>=1.3.0
numpy>=1.21.0
matplotlib>=3.4.0
seaborn>=0.11.0
yfinance>=0.1.70
alpha-vantage>=2.3.0
requests>=2.25.0
click>=8.0.0
reportlab>=3.6.0
```

### 系统要求
- Python 3.8+
- 至少2GB内存
- 网络连接（用于数据获取）

## 扩展开发

### 添加新的技术指标
1. 在`scripts/indicators.py`中添加指标函数
2. 在`scripts/analyzer.py`中注册新指标
3. 更新配置文件中的指标列表

### 添加新的信号策略
1. 在`scripts/strategies.py`中实现策略逻辑
2. 在`scripts/signal_generator.py`中注册策略
3. 更新策略配置文件

### 添加新的数据源
1. 在`scripts/data_providers.py`中实现数据提供者
2. 在配置文件中添加数据源配置
3. 实现相应的数据获取方法

## 相关文件

- [技术指标参考](references/technical_indicators.md)
- [策略说明](references/trading_strategies.md)
- [API文档](references/api_documentation.md)
- [配置示例](references/config_examples.md)
# 股票分析技能

一个功能完整的股票分析工具，提供数据获取、技术分析、信号生成、报告制作和定时任务功能。

## 功能特性

### 🚀 核心功能
- **股票数据获取**: 支持Yahoo Finance、Alpha Vantage、新浪财经等多个数据源
- **技术指标分析**: MA、EMA、RSI、MACD、布林带、KDJ、威廉指标等
- **交易信号生成**: 金叉死叉、超买超卖、多指标共振等多种策略
- **报告生成**: 支持PDF、HTML、Markdown格式的专业分析报告
- **定时任务**: 自动化的每日报告和实时监控

### 📊 技术指标
- **趋势指标**: 移动平均线、指数移动平均线
- **动量指标**: RSI、MACD、KDJ、威廉指标
- **波动性指标**: 布林带、ATR
- **成交量指标**: 成交量移动平均、成交量比率

### 🎯 交易策略
- **金叉策略**: 基于移动平均线交叉
- **RSI策略**: 基于超买超卖信号
- **MACD策略**: 基于MACD线信号线交叉
- **布林带策略**: 基于价格突破布林带
- **多指标共振**: 综合多个指标信号

## 快速开始

### 安装
```bash
# 克隆技能目录
cp -r stock-analyzer ~/.openclaw/workspace/skills/

# 安装依赖
cd ~/.openclaw/workspace/skills/stock-analyzer
pip install -r requirements.txt

# 运行安装脚本
python3 scripts/install.py
```

### 基本使用
```bash
# 获取股票数据
stock-analyzer get-data --symbol AAPL --period 1y

# 技术分析
stock-analyzer analyze --symbol AAPL --indicators ma,rsi,macf

# 生成交易信号
stock-analyzer signals --symbol AAPL --strategy multi-indicator

# 生成报告
stock-analyzer report --symbol AAPL --output report.pdf

# 分析投资组合
stock-analyzer portfolio-report --symbols AAPL,MSFT,GOOGL --output portfolio.pdf
```

### 高级功能
```bash
# 策略回测
stock-analyzer backtest --symbols AAPL --strategy golden_cross --period 2y

# 设置定时任务
stock-analyzer schedule daily-report --symbols AAPL,MSFT --time 18:00

# 实时监控信号
stock-analyzer schedule signals --symbols AAPL --interval 30min
```

## 配置说明

### 数据源配置
```json
{
  "data_sources": {
    "yahoo_finance": {
      "enabled": true,
      "priority": 1
    },
    "alpha_vantage": {
      "enabled": true,
      "priority": 2,
      "api_key": "your_api_key"
    }
  }
}
```

### 策略配置
```json
{
  "trading_strategies": {
    "golden_cross": {
      "short_ma": 50,
      "long_ma": 200
    },
    "rsi_strategy": {
      "overbought": 70,
      "oversold": 30
    }
  }
}
```

## 使用示例

### Python API使用
```python
from stock_analyzer import DataManager, TechnicalAnalyzer, SignalGenerator

# 初始化组件
config = Config()
data_manager = DataManager(config)
analyzer = TechnicalAnalyzer(config)
signal_gen = SignalGenerator(config)

# 获取数据
data = data_manager.get_stock_data("AAPL", "1y")

# 计算技术指标
indicators = analyzer.calculate_indicators(data, ["ma", "rsi", "macf"])

# 生成信号
signals = signal_gen.generate_signals(data, indicators, "multi_indicator")
```

### 批量分析
```python
# 批量分析股票列表
stocks = ["AAPL", "MSFT", "GOOGL", "TSLA"]
for stock in stocks:
    data = data_manager.get_stock_data(stock, "6mo")
    indicators = analyzer.calculate_indicators(data, ["ma", "rsi"])
    signals = signal_gen.generate_signals(data, indicators)
    print(f"{stock}: {len(signals)} 个信号")
```

## 报告功能

### 报告类型
- **技术分析报告**: 包含所有技术指标分析
- **投资组合报告**: 多只股票组合分析
- **策略回测报告**: 历史策略表现分析
- **风险评估报告**: 风险指标和评估

### 输出格式
- **PDF**: 专业格式的PDF报告
- **HTML**: 交互式网页报告
- **Markdown**: 轻量级文本报告

## 定时任务

### 每日报告
```bash
# 设置每日18:00生成报告
stock-analyzer schedule daily-report --symbols AAPL,MSFT --time 18:00
```

### 实时监控
```bash
# 每30分钟检查交易信号
stock-analyzer schedule signals --symbols AAPL --interval 30min
```

### 任务管理
```bash
# 查看所有定时任务
stock-analyzer list-schedules
```

## 数据源支持

### 免费数据源
- **Yahoo Finance**: 免费，数据全面
- **新浪财经**: A股数据，实时性好
- **腾讯证券**: 港股、A股数据

### 付费数据源
- **Alpha Vantage**: API稳定，数据质量高
- **Quandl**: 专业金融数据
- **Tiingo**: 高频数据支持

## 技术架构

### 模块结构
```
stock-analyzer/
├── scripts/              # 核心脚本
│   ├── stock_analyzer.py # 主程序
│   ├── data_manager.py   # 数据管理
│   ├── technical_analyzer.py # 技术分析
│   ├── signal_generator.py   # 信号生成
│   ├── report_generator.py   # 报告生成
│   ├── scheduler.py      # 定时任务
│   └── config.py        # 配置管理
├── references/          # 参考文档
├── assets/             # 模板和资产
└── examples/           # 使用示例
```

### 依赖库
- **pandas**: 数据处理
- **numpy**: 数值计算
- **matplotlib**: 图表绘制
- **yfinance**: Yahoo Finance数据
- **click**: 命令行接口
- **reportlab**: PDF报告生成

## 性能优化

### 数据缓存
- 本地缓存机制减少API调用
- 智能缓存更新策略
- 内存优化的大数据处理

### 并发处理
- 多线程数据获取
- 批量分析优化
- 异步报告生成

### 内存管理
- 数据流式处理
- 内存使用监控
- 自动垃圾回收

## 错误处理

### 数据获取错误
- 自动切换备用数据源
- 网络重试机制
- 数据完整性验证

### 分析错误
- 指标计算异常处理
- 数据不足时的降级处理
- 错误日志记录

### 报告错误
- 模板渲染错误处理
- 文件权限问题处理
- 输出格式兼容性

## 安全考虑

### 数据安全
- API密钥加密存储
- 敏感数据脱敏
- 数据传输加密

### 访问控制
- API访问限流
- 用户权限管理
- 审计日志记录

### 隐私保护
- 用户数据匿名化
- 数据最小化原则
- 合规性检查

## 扩展开发

### 添加新指标
1. 在`technical_analyzer.py`中实现指标计算
2. 在配置文件中添加参数设置
3. 更新信号生成逻辑

### 添加新策略
1. 在`signal_generator.py`中实现策略逻辑
2. 添加策略参数配置
3. 实现回测功能

### 添加新数据源
1. 继承`DataProvider`基类
2. 实现数据获取方法
3. 在配置中注册数据源

## 故障排除

### 常见问题
1. **数据获取失败**: 检查网络连接和API密钥
2. **指标计算错误**: 验证数据完整性和参数设置
3. **报告生成失败**: 检查输出目录权限和依赖库

### 调试模式
```bash
stock-analyzer --debug <command>
stock-analyzer --verbose <command>
```

### 日志文件
日志位置: `~/.stock-analyzer/logs/`

## 更新和维护

### 自动更新
```bash
# 检查更新
stock-analyzer --check-update

# 更新到最新版本
stock-analyzer --update
```

### 手动更新
1. 备份配置文件
2. 下载最新版本
3. 更新依赖包
4. 恢复配置

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 支持

- **文档**: 参见references/目录
- **问题报告**: GitHub Issues
- **功能请求**: GitHub Discussions
- **技术支持**: support@stock-analyzer.com
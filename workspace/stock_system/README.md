# 股票预测循环改进系统

## 🎯 系统目标

**一个目的：准确预测，持续改进**

开盘前预测 → 开盘后验证 → 总结分析 → 模型优化 → 持续循环 → 准确率越来越高

## 🚀 系统架构

### 核心循环
```
预测 → 验证 → 分析 → 优化 → 再预测
 ↑_______________________|
```

### 主要组件

1. **PredictionCycleSystem** - 核心预测循环引擎
2. **PredictionAutomation** - 自动化任务调度
3. **SystemManager** - 系统管理和监控
4. **AccuracyAnalyzer** - 准确性分析和优化

## 📊 预测流程

### 每日自动执行
- **08:30** - 早盘预测 (精选5股)
- **17:00** - 收盘预测 (全股分析) 
- **20:00** - 预测验证 (准确性评估)
- **21:00** - 模型优化 (参数调整)
- **周日20:00** - 周度深度分析

### 多因子分析模型
- **技术面** (40%): RSI、MACD、布林带、成交量
- **基本面** (35%): PE、PB、ROE、增长率、负债率
- **情绪面** (15%): 市场热度、机构关注、散户情绪、新闻情绪
- **行业轮动** (10%): 行业景气度、政策支持、资金流向

## 🎯 准确性目标

| 指标 | 当前水平 | 目标 | 时间框架 |
|------|----------|------|----------|
| 方向准确率 | ~60% | 75%+ | 3个月 |
| 幅度准确率 | ~45% | 65%+ | 6个月 |
| 信心校准度 | ~55% | 75%+ | 3个月 |
| 综合评分 | 53% | 75%+ | 6个月 |

## 🔧 使用方法

### 快速启动
```bash
# 启动完整系统
cd /Users/thinkway/.openclaw/workspace/stock_system
./start_system.sh

# 或者手动启动
python3 system_manager.py start
```

### 系统管理命令
```bash
# 启动自动化系统
python3 system_manager.py start

# 停止系统
python3 system_manager.py stop

# 查看状态
python3 system_manager.py status

# 启动监控器
python3 system_manager.py monitor
```

### 单独功能测试
```bash
# 测试预测循环
python3 prediction_cycle_system.py

# 测试自动化系统
python3 prediction_automation.py
```

## 📁 文件结构

```
stock_system/
├── config/
│   └── stock_pool.json           # 股票池与各分析类型数量上限（可编辑）
├── refactored/
│   ├── openclaw_cron_analyzer.py # Cron/OpenClaw 推荐入口
│   ├── predict_then_summarize.py # 预测+总结主逻辑
│   ├── data_providers.py         # 仅 OpenClaw Agent 数据源入口
│   ├── openclaw_search_provider.py # `openclaw agent` 网页搜索/浏览取价
│   └── validation_bridge.py      # 读取最新 predictions_*.json 写方向准确率指标
├── scripts/
│   └── run_stock_cron.sh         # 直跑分析（内部仍调 openclaw agent），供 crontab 使用
├── prediction_cycle_system.py    # 核心循环引擎（SQLite predictions.db）
├── prediction_automation.py      # 自动化调度
├── system_manager.py            # 系统管理器
├── start_system.sh              # 启动脚本
├── predictions/                 # 预测记录
├── logs/                       # 运行日志
├── reports/                    # 分析报告
├── pids/                       # 进程ID文件
└── data/                       # 数据文件（含 validation_metrics_*.json）
```

### Refactored 流水线与环境变量

| 变量 | 说明 |
|------|------|
| `STOCK_SYSTEM_ROOT` | `stock_system` 目录绝对路径（未设则从脚本位置推断） |
| `OPENCLAW_BIN` | `openclaw` 可执行文件（可选，默认 PATH） |
| `OPENCLAW_STOCK_AGENT_ID` | Agent id（默认 `main`） |
| `OPENCLAW_AGENT_LOCAL` | `1`（默认）使用 `openclaw agent --local`；`0` 走已登录的 Gateway |
| `OPENCLAW_AGENT_TIMEOUT` | 单次 Agent 调用超时秒数（默认 `600`）；与 `openclaw.json` 中 `agents.defaults.timeoutSeconds` 对齐调大 |
| `STOCK_OPENCLAW_CACHE_SEC` | 单股行情缓存秒数（默认 `90`），减轻重复调用 |

**数据源**：仅 **OpenClaw Agent**（`openclaw agent`）通过网页搜索/浏览拉取现价与涨跌幅（`data_provenance` / `provenance` 为 `openclaw_agent_web`）。每只股票约一次 Agent 调用，**较慢、耗 Token**；需 shell 中能执行 `openclaw`，并在 `openclaw.json` 等为 agent 配置可用的浏览/搜索类工具。技术面由涨跌幅粗估，基本面为板块中性占位。

依赖：`pip install -r requirements.txt`（**不含 akshare**）；另需本机安装并登录可用的 OpenClaw CLI 与模型。

验证最新一次 refactored 输出（方向一致性，用于结构回归）：

```bash
cd "$STOCK_SYSTEM_ROOT"
python3 refactored/validation_bridge.py morning
```

系统 crontab 直跑（替代依赖模型执行 shell 的路径）：

```bash
STOCK_SYSTEM_ROOT=/path/to/stock_system /path/to/stock_system/scripts/run_stock_cron.sh morning
```

## 📈 性能监控

### 关键指标
- **总预测数**: 累计预测数量
- **方向准确率**: 涨跌方向预测正确率
- **幅度准确率**: 涨跌幅度预测准确性
- **信心校准度**: 高信心预测的准确率
- **模型版本**: 当前使用的模型版本

### 报告生成
- 每日改进报告
- 周度深度分析
- 月度性能总结
- 实时状态监控

## 🚀 持续优化

### 短期优化 (1-2周)
- [ ] 增加MACD和布林带技术指标
- [ ] 优化行业权重配置
- [ ] 调整买卖信号阈值
- [ ] 改进信心度计算

### 中期优化 (1-2月)
- [ ] 实现多时间框架分析
- [ ] 加入成交量因子
- [ ] 建立政策事件响应机制
- [ ] 集成情绪指标

### 长期优化 (3-6月)
- [ ] 开发行业专属模型
- [ ] 机器学习模型训练
- [ ] 实时数据接入
- [ ] 自适应算法优化

## 🎯 成功标准

### 第一阶段 (1个月)
- ✅ 方向准确率达到65%
- ✅ 系统稳定运行
- ✅ 自动化流程顺畅

### 第二阶段 (3个月)
- ✅ 方向准确率达到75%
- ✅ 幅度准确率达到60%
- ✅ 信心校准度达到70%

### 第三阶段 (6个月)
- ✅ 稳定在75%+准确率
- ✅ 具备自适应能力
- ✅ 可持续改进机制

## 🔍 故障排除

### 常见问题

1. **系统无法启动**
   - 检查Python环境
   - 确认依赖包安装
   - 查看日志文件

2. **预测准确性低**
   - 检查模型参数
   - 验证数据源
   - 分析市场条件

3. **自动化任务失败**
   - 检查定时任务配置
   - 查看错误日志
   - 手动测试功能

### 日志查看
```bash
# 查看自动化系统日志
tail -f logs/automation.log

# 查看预测记录
ls -la predictions/

# 查看状态报告
ls -la reports/
```

## 📞 支持联系

- **系统问题**: 查看日志文件
- **预测问题**: 分析报告文件
- **技术问题**: 检查系统状态

---

**🎯 记住我们的目标：准确预测，持续改进，追求75%+准确率！**
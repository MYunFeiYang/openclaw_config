# 🚀 OpenClaw Cron系统使用指南

## 📋 OpenClaw定时任务配置

### ⏰ 当前OpenClaw定时任务安排
使用OpenClaw内置的cron系统，已配置以下定时任务：

1. **股票早盘分析** - 每天08:00 (工作日)
2. **股票午盘分析** - 每天15:00 (工作日)  
3. **股票收盘分析** - 每天16:00 (工作日)
4. **股票周度分析** - 每周日20:00
5. **股票系统日志清理** - 每天02:00

### 🔍 查看定时任务状态
```bash
# 查看所有定时任务
openclaw cron list

# 查看特定任务的执行历史
openclaw cron runs <任务ID>
```

## 🚀 快速开始

### 1. 立即执行分析
```bash
cd /Users/thinkway/.openclaw/workspace/stock_system

# 手动执行分析
python3 manage_stock_system.py run refined
```

### 2. 检查系统状态
```bash
# 查看系统状态（包括OpenClaw定时任务）
python3 manage_stock_system.py status
```

### 3. 测试执行
```bash
# 测试分析功能
python3 manage_stock_system.py run refined
```

## 📁 文件结构

```
stock_system/
├── 📄 manage_stock_system.py          # 统一管理入口（集成OpenClaw）
├── 📄 README.md                       # 项目说明文档
├── 📄 CRON_GUIDE.md                   # 定时任务指南
├── 📁 configs/
│   ├── crontab_config.txt            # 原始crontab配置（已废弃）
│   ├── crontab_updated.txt           # 更新版配置（已废弃）
│   ├── crontab_final.txt             # 最终版配置（已废弃）
│   └── openclaw_cron_config.md        # OpenClaw定时任务配置说明
├── 📁 scripts/
│   ├── stock_cron_manager.sh         # 主要定时任务管理器（已废弃）
│   ├── diagnose_cron.sh              # 诊断工具（已废弃）
│   ├── macos_cron_manager.sh         # macOS专用管理（已废弃）
│   ├── test_cron_setup.sh            # 测试工具（已废弃）
│   ├── openclaw_cron_manager.sh      # OpenClaw定时任务管理器
│   └── stock_analysis_cron.sh        # 原始脚本（已废弃）
├── 📁 data/                          # 历史数据
├── 📁 logs/                          # 日志文件
└── 📁 reports/                       # 输出报告
```

## ⚙️ OpenClaw定时任务管理

### 查看定时任务
```bash
# 列出所有定时任务
openclaw cron list

# 查看详细信息
openclaw cron status
```

### 管理定时任务
```bash
# 禁用任务
openclaw cron update <任务ID> --enabled false

# 启用任务
openclaw cron update <任务ID> --enabled true

# 删除任务
openclaw cron remove <任务ID>
```

### 查看执行历史
```bash
# 查看任务的执行历史
openclaw cron runs <任务ID>
```

## 🔧 配置管理

### 修改定时任务时间
如果需要修改定时任务时间，需要：
1. 删除现有任务：`openclaw cron remove <任务ID>`
2. 重新添加任务：`openclaw cron add ...`

### 添加新的定时任务
```bash
# 示例：添加每天14:30的分析任务
openclaw cron add \
  --name "股票下午分析" \
  --schedule "30 14 * * 1-5" \
  --message "执行A股下午分析任务" \
  --target isolated
```

## 📊 监控和日志

### 查看执行结果
定时任务执行后，结果会自动发送到webchat频道，您可以看到：
- 买入/卖出推荐
- 市场概况
- 分析报告

### 查看历史数据
```bash
# 查看数据目录
cd /Users/thinkway/.openclaw/workspace/stock_system/data
ls -la *.json

# 查看报告目录
cd /Users/thinkway/.openclaw/workspace/stock_system/reports
ls -la *.txt
```

## 🎯 最佳实践

1. **定期检查执行结果** - 关注webchat频道的定时任务输出
2. **监控任务状态** - 定期使用 `openclaw cron list` 检查任务状态
3. **备份重要数据** - 定期备份分析结果
4. **测试配置更改** - 修改前先手动测试
5. **查看执行历史** - 使用 `openclaw cron runs` 查看历史记录

## 🔍 故障排查

### 问题1: 定时任务没有执行
**症状:** 到了设定时间没有输出
**排查步骤:**
1. 检查任务状态：`openclaw cron list`
2. 检查是否启用：确认 `enabled: true`
3. 查看执行历史：`openclaw cron runs <任务ID>`
4. 手动测试：`python3 manage_stock_system.py run refined`

### 问题2: 执行失败
**症状:** 有输出但显示错误
**排查步骤:**
1. 手动执行测试命令
2. 检查文件路径和权限
3. 查看详细错误信息

### 问题3: 时区问题
**症状:** 执行时间不准确
**解决方案:**
- 确保时区设置为 `Asia/Shanghai`
- 检查系统时间设置

## 📞 支持

如果遇到问题：
1. 检查OpenClaw服务状态
2. 查看定时任务执行历史
3. 手动测试执行命令
4. 检查文件权限和路径

---

**💡 提示:** OpenClaw的cron系统现在已经完全配置好，会在设定时间自动执行股票分析任务！
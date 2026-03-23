# 🚀 A股分析系统定时任务使用指南

## 📋 定时任务配置说明

### ⏰ 当前定时任务安排
```bash
# 查看当前crontab配置
crontab -l
```

**任务时间表：**
- **08:00** - 早间盘前分析（工作日）
- **09:00** - 开盘前分析（工作日）  
- **15:00** - 午盘分析（工作日）
- **16:00** - 收盘后分析（工作日）
- **20:00** - 周度分析（周日）
- **02:00** - 清理旧日志（每日）

## 🔧 快速开始

### 1. 立即执行分析
```bash
cd /Users/thinkway/.openclaw/workspace/stock_system

# 执行早盘分析
./scripts/stock_cron_manager.sh morning

# 执行午盘分析
./scripts/stock_cron_manager.sh afternoon

# 执行晚盘分析
./scripts/stock_cron_manager.sh evening

# 执行周度分析
./scripts/stock_cron_manager.sh weekly
```

### 2. 检查系统状态
```bash
# 查看系统状态
./scripts/stock_cron_manager.sh status

# 诊断cron服务
./scripts/diagnose_cron.sh
```

### 3. 测试定时任务
```bash
# 测试执行
./scripts/stock_cron_manager.sh test

# 查看最近执行记录
tail -f logs/cron.log
```

## 📁 文件结构

```
stock_system/
├── 📄 manage_stock_system.py          # 统一管理入口
├── 📄 README.md                       # 项目说明
├── 📁 configs/
│   ├── crontab_config.txt            # 原始crontab配置
│   ├── crontab_updated.txt           # 更新版配置
│   └── crontab_final.txt             # 最终版配置
├── 📁 scripts/
│   ├── stock_cron_manager.sh         # 主要定时任务管理器
│   ├── diagnose_cron.sh              # 诊断工具
│   ├── macos_cron_manager.sh         # macOS专用管理
│   ├── test_cron_setup.sh            # 测试工具
│   └── stock_analysis_cron.sh        # 原始脚本（已更新）
├── 📁 logs/
│   ├── cron.log                      # 定时任务执行日志
│   ├── execution_YYYYMMDD.log        # 详细执行日志
│   └── error_YYYYMMDD.log            # 错误日志
├── 📁 data/
│   └── stock_analysis_*_*.json       # 分析结果数据
└── 📁 reports/
    └── *_report_*.txt                 # 生成的报告
```

## 🔍 故障排查

### 问题1: 定时任务没有触发
**症状:** 到了设定时间没有执行
**可能原因:**
1. cron服务未运行
2. 脚本路径错误
3. 权限问题

**解决方案:**
```bash
# 检查cron服务状态
./scripts/macos_cron_manager.sh status

# 手动启动cron服务（macOS）
sudo ./scripts/macos_cron_manager.sh start

# 测试脚本执行
./scripts/stock_cron_manager.sh test
```

### 问题2: 脚本执行失败
**症状:** 执行时报错
**可能原因:**
1. Python环境缺失
2. 依赖包未安装
3. 文件权限问题

**解决方案:**
```bash
# 检查Python环境
python3 --version

# 检查脚本权限
ls -la scripts/*.sh

# 运行诊断工具
./scripts/diagnose_cron.sh
```

### 问题3: 日志文件未生成
**症状:** 没有日志输出
**解决方案:**
```bash
# 检查日志目录
ls -la logs/

# 手动创建日志目录
mkdir -p logs data reports

# 查看系统日志（macOS）
tail -f /var/log/cron.log
```

## 📊 监控和日志

### 查看执行日志
```bash
# 查看定时任务日志
tail -f logs/cron.log

# 查看详细执行日志
tail -f logs/execution_$(date +%Y%m%d).log

# 查看错误日志
tail -f logs/error_$(date +%Y%m%d).log
```

### 监控系统状态
```bash
# 查看系统状态
./scripts/stock_cron_manager.sh status

# 监控cron服务
./scripts/macos_cron_manager.sh monitor
```

## ⚙️ 配置管理

### 修改定时任务
```bash
# 编辑crontab配置
crontab -e

# 或者使用配置文件
crontab configs/crontab_final.txt
```

### 调整执行时间
编辑 `configs/crontab_final.txt` 文件，修改对应的时间设置。

### 清理旧数据
```bash
# 手动清理旧日志
./scripts/stock_cron_manager.sh cleanup
```

## 🎯 最佳实践

1. **定期检查日志** - 每天查看执行日志，确保任务正常运行
2. **测试配置更改** - 修改配置后先手动测试
3. **备份重要数据** - 定期备份分析结果和配置
4. **监控磁盘空间** - 定期清理旧日志文件
5. **设置通知** - 配置失败通知（可扩展）

## 🔧 高级功能

### 自定义分析时间
修改crontab配置，添加自定义时间：
```bash
# 添加自定义时间（例如：每天14:30）
echo "30 14 * * 1-5 /Users/thinkway/.openclaw/workspace/stock_system/scripts/stock_cron_manager.sh afternoon" | crontab -
```

### 集成通知系统
可以扩展脚本，添加企业微信、邮件或短信通知功能。

### 数据导出
定期导出分析结果用于进一步分析：
```bash
# 导出最近30天的数据
find data/ -name "*.json" -mtime -30 -exec cp {} backup/ \;
```

## 📞 支持

如果遇到问题，可以：
1. 运行诊断工具：`./scripts/diagnose_cron.sh`
2. 查看系统日志：`tail -f /var/log/cron.log`
3. 手动测试执行：`./scripts/stock_cron_manager.sh test`
4. 检查文件权限：`ls -la scripts/`

---

**💡 提示:** 定时任务现在已经配置完成，下次将在设定时间自动执行！
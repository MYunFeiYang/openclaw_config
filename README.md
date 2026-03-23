# OpenClaw 配置与工作区

本仓库为 **OpenClaw 主目录**（`~/.openclaw`）的 Git 快照：网关与模型配置、定时任务、企业微信插件、`workspace` 下的自动化（含 A 股分析）等。

## 快速链接

- [安装与运行说明](SETUP.md)
- 主配置：`openclaw.json`（唯一主配置；含 `main` / `pm` / `dev` / `design` 等代理与工作区；路径已尽量使用 `~/.openclaw` / `~/.nvm`）
- 股票定时分析：`cron/jobs.json`（命令里使用 `OPENCLAW_HOME` 或默认 `$HOME/.openclaw`）

## 目录说明（摘要）

| 路径 | 说明 |
|------|------|
| `workspace/stock_system/` | 股票预测与分析脚本；Cron 入口推荐 `refactored/openclaw_cron_analyzer.py` |
| `workspace/` | 其他工作区文件、`AGENTS.md` 等 |
| `extensions/` | 本地安装的 OpenClaw 插件（`node_modules` 不纳入 Git） |
| `skills/` | 技能配置与内容 |
| `agents/` | 代理配置（`sessions/` 对话记录不纳入 Git） |
| `cron/` | 定时任务定义 |
| `wecomConfig/` | 企业微信 MCP 相关配置 |

## 环境变量（可选）

| 变量 | 作用 |
|------|------|
| `OPENCLAW_HOME` | OpenClaw 根目录；未设置时 Cron 消息中默认为 `$HOME/.openclaw` |
| `STOCK_SYSTEM_ROOT` | `stock_system` 目录绝对路径；未设置时 Python 入口从 `__file__` 推断 |

## 安全说明

配置中含内网 API 与企业微信等凭据；请仅使用 **内网/私有 Git 远端**，避免仓库导出或误公开。

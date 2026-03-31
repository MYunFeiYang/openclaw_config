# OpenClaw 配置与工作区

本仓库为 **OpenClaw 主目录**（`~/.openclaw`）的 Git 快照：网关与模型配置、定时任务、企业微信插件、多工作区与自动化（含 A 股分析）等。

## 官方文档（校对用）

- [Multi-Agent Routing](https://docs.openclaw.ai/concepts/multi-agent)
- [Agent Workspace](https://docs.openclaw.ai/concepts/agent-workspace)
- [Skills](https://docs.openclaw.ai/tools/skills)
- [Channel routing](https://docs.openclaw.ai/channels/channel-routing)

## 快速链接

- [安装与运行说明](SETUP.md)
- 主配置：`openclaw.json`（唯一主配置；路径已尽量使用 `~/.openclaw` / `~/.nvm`）
- 股票定时分析：`cron/jobs.json`（命令里使用 `OPENCLAW_HOME` 或默认 `$HOME/.openclaw`）

## 多代理（`agents.list`）

与 `openclaw.json` 中配置一致（节选；以本机文件为准）：

| `agentId` | 说明（identity.name） | Workspace 目录 |
|-----------|----------------------|----------------|
| `main` | 通用助手 | `~/.openclaw/workspace` |
| `frontend` | 前端工程 | `~/.openclaw/workspace-frontend` |
| `backend` | 后端服务 | `~/.openclaw/workspace-backend` |
| `ui` | UI 视觉 | `~/.openclaw/workspace-ui` |
| `stock` | 股票分析 | `~/.openclaw/workspace-stock` |

## 目录说明（摘要）

| 路径 | 说明 |
|------|------|
| `workspace/`、`workspace-frontend/` 等 | 各 agent 的 `AGENTS.md`、`SOUL.md`、`skills/` 等 |
| `workspace-stock/stock_system/` | 股票预测与分析脚本（与 `stock` agent 同源）；Cron 入口推荐 `refactored/openclaw_cron_analyzer.py` |
| `skills/` | 对应本机 `~/.openclaw/skills`（与各 workspace 内 `skills/` 的优先级见 [SETUP.md](SETUP.md)） |
| `extensions/` | 本地安装的 OpenClaw 插件（`node_modules` 不纳入 Git） |
| `agents/` | 代理配置（`sessions/` 对话记录不纳入 Git） |
| `cron/` | 定时任务定义 |
| `wecomConfig/` | 企业微信 MCP 相关配置 |

## 本仓库与官方「工作区 Git」示例的差异

官方常见做法是：仅将 **单个 workspace 目录** 做成私有 Git，且 [不把 `openclaw.json`、`~/.openclaw/skills` 等纳入该工作区仓库](https://docs.openclaw.ai/concepts/agent-workspace)。

本仓库刻意采用 **整目录 `~/.openclaw` 快照**，便于一次性备份配置与多工作区；代价是配置与共享 `skills/` 会进入版本历史，推送前需确认远端为**私有**且权限最小。若希望完全贴近官方「密钥不进库」实践，可将敏感项外置为环境变量或 SecretRef（见 [SETUP.md](SETUP.md)）。

## 环境变量（可选）

| 变量 | 作用 |
|------|------|
| `OPENCLAW_HOME` | OpenClaw 根目录；未设置时 Cron 消息中默认为 `$HOME/.openclaw` |
| `STOCK_SYSTEM_ROOT` | `stock_system` 目录绝对路径；未设置时 Python 入口从 `__file__` 推断 |

## 安全说明

- 配置中含内网 API、企业微信与网关等凭据；请仅使用 **内网/私有 Git 远端**，避免仓库导出或误公开。
- 与官方文档一致：即使私有仓库，仍建议避免长期以明文将密钥只存在可提交的 `openclaw.json` 中；可选迁移步骤见 [SETUP.md](SETUP.md) 与 [.env.example](.env.example)。

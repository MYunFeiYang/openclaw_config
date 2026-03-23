# 安装与运行

## 1. 克隆与位置

将本仓库置于本机的 OpenClaw 主目录，例如：

```bash
git clone <内网仓库 URL> ~/.openclaw
```

若克隆到其他路径，请设置：

```bash
export OPENCLAW_HOME="/path/to/clone"
```

并确认 `openclaw.json` 中的 `workspace`、`plugins.load.paths` 等路径与你的 **Home**、**nvm Node 版本** 一致（已写成 `~/.openclaw`、`~/.nvm/...` 形式时，需保证 OpenClaw 能正确展开 `~`；若不能，改为绝对路径）。

## 2. 网络与密钥

- 确保能访问内网 OneAPI（`openclaw.json` 中 `models.providers`）与网关端口（默认 `18789`）。
- 企业微信相关：`channels.wecom`、`wecomConfig/config.json` 已在仓库中按团队策略维护。

## 3. Node / OpenClaw

- 安装与官方一致的 **OpenClaw** 与 **Node**（含 `acpx`、`wecom-openclaw-plugin` 等插件路径与 `openclaw.json` 中 `plugins` 一致）。
- `extensions/wecom-openclaw-plugin` 下依赖需安装时：在该目录执行 `npm ci` 或 `npm install`（`node_modules` 不提交）。

## 4. 股票分析（Python）

```bash
cd "$OPENCLAW_HOME/workspace/stock_system"
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python3 refactored/openclaw_cron_analyzer.py morning
```

可选：`export STOCK_SYSTEM_ROOT="/绝对路径/workspace/stock_system"` 覆盖数据目录。

## 5. 自动化与 Cron

- 定时任务定义在 `cron/jobs.json`；其中 shell 片段使用 `"${OPENCLAW_HOME:-$HOME/.openclaw}/workspace/stock_system"`。
- 在 OpenClaw 中加载/同步 Cron 后，确保运行代理的环境里有正确的 `HOME` 或 `OPENCLAW_HOME`。

## 6. 本地环境文件（不提交）

复制示例（可选）：

```bash
cp .env.example .env
```

按需编辑 `.env`；该文件默认被 `.gitignore` 忽略。

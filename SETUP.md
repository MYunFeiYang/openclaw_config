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

### 1.1 配置里的 `~`（tilde）是否生效

`openclaw.json` 中多处使用 `~/.openclaw`、`~/.nvm/...`。**不同版本/运行方式下，JSON 里的 `~` 不一定会被展开成用户主目录**（少数环境会按字面量 `~` 去找路径，导致找不到目录或插件）。

**新环境建议自检：**

1. 启动网关或执行 `openclaw doctor`（若命令可用），确认无路径类报错。
2. 若报错指向含 `~` 的路径：用本机绝对路径替换，例如 macOS/Linux 上把 `~` 换成 `/Users/你的用户名` 或运行 `echo $HOME` 得到的前缀。
3. `agents.defaults.workspace`、`plugins.installs.*.installPath` 等字段都是常见需要核对的位置。

### 1.2 `acpx` 与「duplicate plugin id」告警

OpenClaw **2026.3.x 起已在安装包内捆绑 `acpx`**（`openclaw/dist/extensions/acpx`）。若同时在 `plugins.load.paths` 里再加载 **`node_modules/acpx`**（或另一份同名包），会出现：

`duplicate plugin id detected; bundled plugin will be overridden by config plugin`

**处理方式：** 删除 `plugins.load.paths` 中指向独立 `acpx` 包的那一项，并去掉 `plugins.installs` 里仅用于该路径的 `acpx` 记录；保留 `plugins.allow` 与 `plugins.entries.acpx` 即可使用**内置**插件。

仅当你**刻意**要用比内置更新/不同的 `acpx` 时，才保留外置路径并承受该告警（或按官方文档关闭内置，二选一）。

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

股票分析**仅通过 OpenClaw**：Python 脚本内调用 `openclaw agent`，由 Agent 使用网页搜索/浏览取价（较慢、耗模型 Token，见 `workspace/stock_system/README.md`）。需本机可执行 `openclaw` 且模型/工具已配置。历史 `original/` 已移除。监控可读 `data/predictions_*.json`、`reconcile_history.jsonl`、`iteration_briefing.txt` 等。可选环境变量：`STOCK_SYSTEM_ROOT`、`OPENCLAW_AGENT_TIMEOUT`、`STOCK_OPENCLAW_MAX_ATTEMPTS`（单股拉价重试次数，默认 2）等，详见 `workspace/stock_system/refactored/openclaw_search_provider.py` 顶部说明。

**免费搜索优化（仍用 DuckDuckGo、无 Brave 等 API Key）**：在 `openclaw.json` 中合并如下思路（字段与 OpenClaw 文档 `tools/duckduckgo-search.md`、`zh-CN/tools/web.md` 一致）。`region: cn-zh` 偏向中国大陆中文结果；`maxResults` 略增便于模型挑到财经站；`cacheTtlMinutes` 降低可减轻行情类查询缓存偏旧。**修改后重启 Gateway**（或你实际跑 agent 的进程）使配置生效。

```json
"tools": {
  "web": {
    "search": {
      "enabled": true,
      "provider": "duckduckgo",
      "maxResults": 8,
      "cacheTtlMinutes": 5
    }
  }
},
"plugins": {
  "entries": {
    "duckduckgo": {
      "enabled": true,
      "config": {
        "webSearch": {
          "region": "cn-zh",
          "safeSearch": "moderate"
        }
      }
    }
  }
}
```

（以上为片段，需与现有 `tools` / `plugins` 对象**合并**，勿整段覆盖。`openclaw.json` 常含密钥，勿提交到公开 Git。）

## 5. 自动化与 Cron

- 定时任务定义在 `cron/jobs.json`；其中 shell 片段使用 `"${OPENCLAW_HOME:-$HOME/.openclaw}/workspace/stock_system"`。
- 在 OpenClaw 中加载/同步 Cron 后，确保运行代理的环境里有正确的 `HOME` 或 `OPENCLAW_HOME`。

### 5.1 Cron 消息、`OPENCLAW_HOME` 与 shell 展开

任务 `payload.message` 里包含 **bash 风格** 的路径：`cd "${OPENCLAW_HOME:-$HOME/.openclaw}/workspace/stock_system" && ...`。

**请注意：**

1. **`${…}` 只有在命令经 `bash`（或兼容 shell）执行时才会展开**。若 OpenClaw 将整句仅作为自然语言交给模型、由模型再执行命令，则取决于最终是否用 shell 执行；若出现「找不到目录」，优先检查实际执行层是否走了 shell。
2. **网关/代理进程的环境变量**：若未克隆到 `~/.openclaw`，应在运行 OpenClaw 的用户环境中导出 `OPENCLAW_HOME`，例如：
   ```bash
   export OPENCLAW_HOME="/你的/实际/路径/.openclaw"
   ```
   或在 systemd/launchd 等服务配置里写入同一变量。
3. **兜底**：若环境变量与 shell 展开不可靠，可直接把 `cron/jobs.json` 里对应 `message` 中的路径改成**本机绝对路径**（团队各自维护或使用内网模板生成）。

4. **直跑脚本（推荐作 crontab 备选）**：`workspace/stock_system/scripts/run_stock_cron.sh` 会 `cd` 到 `STOCK_SYSTEM_ROOT`（或 `OPENCLAW_HOME/workspace/stock_system`）并执行 `refactored/openclaw_cron_analyzer.py`，不经过 OpenClaw `agentTurn`。系统 crontab 可调用该脚本，分析结果仍写入 `stock_system/data/` 与 `reports/`。
5. **定期清理**：`scripts/cleanup_stock_system.sh` 定义日志/报告/历史 JSON 的保留天数；OpenClaw Cron 每日 02:00 调用该脚本。细则见 `workspace/stock_system/README.md` 中的表格。

## 6. 本地环境文件（不提交）

复制示例（可选）：

```bash
cp .env.example .env
```

按需编辑 `.env`；该文件默认被 `.gitignore` 忽略。

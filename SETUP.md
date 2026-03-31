# 安装与运行

日常多代理与记忆习惯见 [PRACTICES.md](PRACTICES.md)。

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

### 1.3 与 OpenClaw 官方文档对齐（多代理、技能、路由）

以下与 [Multi-Agent](https://docs.openclaw.ai/concepts/multi-agent)、[Skills](https://docs.openclaw.ai/tools/skills)、[Agent Workspace](https://docs.openclaw.ai/concepts/agent-workspace) 一致，便于排查「为什么进线不是某个 agent」等问题。

**入站路由（`bindings`）**

- 多代理时，渠道消息默认由 **`bindings`** 将 `(channel, accountId, peer …)` 映射到 `agentId`；详见 [Channel routing](https://docs.openclaw.ai/channels/channel-routing)。
- **若未配置 `bindings`**，入站通常会落到**默认 agent**（由 `agents.list` 的 `default` 或列表顺序决定），不一定等于你在 Control UI 里手选的专用 agent。
- 若需例如企业微信**按账号/会话**把流量分到 `frontend`、`stock` 等，请在 `openclaw.json` 中增加 `bindings`（占位示例，请把 `agentId`、渠道字段换成你环境真实值）：

```json5
{
  "bindings": [
    // 示例：某渠道账号整体落到指定 agent（字段名以当前 OpenClaw 版本为准）
    { "agentId": "main", "match": { "channel": "wecom", "accountId": "default" } }
    // 更细粒度可用 match.peer 等，见官方 Multi-Agent / Channel routing 文档
  ]
}
```

**技能加载顺序（简要）**

- 每个 agent 的 **`workspace-*/skills/`** 为该 agent 的 workspace 技能，优先级高。
- 本仓库根目录 **`skills/`** 即本机 **`~/.openclaw/skills`**（managed/共享层）；与 workspace 同名技能冲突时，**以 workspace 为准**（见官方 [Skills → Locations and precedence](https://docs.openclaw.ai/tools/skills)）。

**`tools.agentToAgent`**

- 官方示例中跨 agent 能力常配合 **allowlist**（`allow: ["agentId1", …]`）。若当前为 `enabled: true` 且无 `allow`，且你希望收紧跨 agent 调用，可在确认文档字段名后增加 `allow` 数组。

**日记忆与 Git**

- 本仓库**当前**未忽略 **`memory/`**，日记忆可随 Git 备份；推送到不可信远端前请自行检查日文件是否含密钥或隐私。若改回忽略 `memory/`，则与官方「仅私有 workspace 纳入 `memory/`」的常见做法一致，长期备份需另做本机或加密归档。

### 1.4 密钥外置（可选，与官方「勿提交密钥」一致）

官方建议密钥放在环境变量、密码管理或 `openclaw.json` 支持的 Secret 引用中，而非长期明文写在提交树里（见 [Agent Workspace](https://docs.openclaw.ai/concepts/agent-workspace)、[Skills 安全说明](https://docs.openclaw.ai/tools/skills)）。

- 占位变量名见仓库根目录 [.env.example](.env.example)；复制为 `~/.openclaw/.env` 后填入密钥（`.env` 已被 gitignore）。
- 本仓库的 `openclaw.json` 已将 **`models.providers.oneapi.apiKey`**、**`gateway.auth.token`**、**`channels.wecom.secret`** 配置为 **env SecretRef**（`ONEAPI_API_KEY`、`GATEWAY_AUTH_TOKEN`、`WECOM_BOT_SECRET`），并启用 **`env.shellEnv`**，便于从登录 shell 继承已 `export` 的变量。
- 字段名与 `openclaw config set … --ref-source env --ref-provider default --ref-id VAR` 一致；也可用 `openclaw secrets` / `openclaw config schema` 核对。**修改密钥后务必重启 Gateway** 并验证模型与企微。

#### 1.4.1 首次使用或从旧明文配置迁移

1. 若你仍有带明文的备份（例如 `openclaw.json.bak`），从中抄出三项填入 `~/.openclaw/.env`（见 [.env.example](.env.example) 变量名）。
2. 若无备份，从 OneAPI / 网关 / 企微后台重新生成或复制密钥。
3. 执行 `openclaw config validate`，再 `openclaw gateway restart`；打开 Control UI 与企微各测一条消息。
4. 可选：`openclaw secrets audit` 检查是否还有明文泄漏。

**`.env` 不会自动被所有启动方式加载**：若 `openclaw gateway` 作为服务启动且读不到变量，可在服务配置里使用 `EnvironmentFile=$HOME/.openclaw/.env`，或在交互式终端先执行 `set -a && source ~/.openclaw/.env && set +a` 再启动；也可用仓库内 [`scripts/openclaw-with-dotenv.sh`](scripts/openclaw-with-dotenv.sh) 包装调用（`alias openclaw=/path/to/scripts/openclaw-with-dotenv.sh`）。

#### 1.4.2 macOS LaunchAgent：让网关进程加载 `.env`

`launchd` 启动的 Gateway **不会**读 shell 配置；若 `openclaw.json` 使用 env SecretRef，须让 **ProgramArguments** 在 exec Node 之前注入变量。推荐在 `~/.openclaw/scripts/` 使用包装脚本（本仓库已提供 [`scripts/gateway-launchd.sh`](scripts/gateway-launchd.sh)）：

1. `chmod +x ~/.openclaw/scripts/gateway-launchd.sh`
2. 编辑 `~/Library/LaunchAgents/ai.openclaw.gateway.plist`：在 `<array>` 里 **把原来的 `node` 路径挪到第二位**，并在**第一位**插入包装脚本路径，例如：
   - `…/gateway-launchd.sh`
   - `…/bin/node`
   - `…/openclaw/dist/entry.js`
   - `gateway`、`--port`、`18789`（与原先一致）
3. `launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist && launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist`

升级 OpenClaw 若 **重写 plist**，需按上法重新插入包装脚本一行。

**关于 `gateway restart` 时的告警** `Unable to verify gateway token drift: gateway.auth.token SecretRef is configured but unavailable in this command path`：这是 **当前终端里的 `openclaw` CLI** 未加载 `.env`，做 drift 检查时解析不到 SecretRef；**不一定表示正在运行的网关未加载密钥**。消除告警可在执行前 `source ~/.openclaw/.env`，或使用上面的 `openclaw-with-dotenv.sh` 别名。

**企微插件与 `channels.wecom.secret`：** `@wecom/wecom-openclaw-plugin@2026.3.x` 在启动时会执行 `account.secret?.trim()`，需要 **已是字符串** 的 Secret。若 OpenClaw 网关（如 2026.3.28）在 **渠道层未把 SecretRef 解析成字符串** 就传给插件，会出现 `channel startup failed: account.secret?.trim is not a function`，表现为 **企微完全收不到消息**。此时请把 **`channels.wecom.secret` 保持为明文**（与企微后台一致），或等 OpenClaw / 插件后续版本在渠道侧完成 SecretRef 解析后再改回 env 引用。`ONEAPI_API_KEY`、`gateway.auth.token` 的 env SecretRef 不受影响。

## 2. 网络与密钥

- 确保能访问内网 OneAPI（`openclaw.json` 中 `models.providers`）与网关端口（默认 `18789`）。
- 企业微信相关：`channels.wecom`、`wecomConfig/config.json` 已在仓库中按团队策略维护。

## 3. Node / OpenClaw

- 安装与官方一致的 **OpenClaw** 与 **Node**（含 `acpx`、`wecom-openclaw-plugin` 等插件路径与 `openclaw.json` 中 `plugins` 一致）。
- `extensions/wecom-openclaw-plugin` 下依赖需安装时：在该目录执行 `npm ci` 或 `npm install`（`node_modules` 不提交）。

## 4. 股票分析（Python）

```bash
cd "$OPENCLAW_HOME/workspace-stock/stock_system"
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python3 refactored/openclaw_cron_analyzer.py morning
```

股票分析**仅通过 OpenClaw**：Python 脚本内调用 `openclaw agent`，由 Agent 使用网页搜索/浏览取价（较慢、耗模型 Token，见 `workspace-stock/stock_system/README.md`）。**权威目录**为 `workspace-stock/stock_system`（与 `stock` agent workspace 一致）；`workspace/stock_system` 若仍存在多为历史副本，勿与 Cron 混用。需本机可执行 `openclaw` 且模型/工具已配置。历史 `original/` 已移除。监控可读 `data/predictions_*.json`、`reconcile_history.jsonl`、`iteration_briefing.txt` 等。可选环境变量：`STOCK_SYSTEM_ROOT`、`OPENCLAW_AGENT_TIMEOUT`、`STOCK_OPENCLAW_MAX_ATTEMPTS`（单股拉价重试次数，默认 2）等，详见 `workspace-stock/stock_system/refactored/openclaw_search_provider.py` 顶部说明。

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

- 定时任务定义在 `cron/jobs.json`；其中 shell 片段使用 `"${OPENCLAW_HOME:-$HOME/.openclaw}/workspace-stock/stock_system"`。
- 在 OpenClaw 中加载/同步 Cron 后，确保运行代理的环境里有正确的 `HOME` 或 `OPENCLAW_HOME`。

### 5.1 Cron 消息、`OPENCLAW_HOME` 与 shell 展开

任务 `payload.message` 里包含 **bash 风格** 的路径：`cd "${OPENCLAW_HOME:-$HOME/.openclaw}/workspace-stock/stock_system" && ...`。

**请注意：**

1. **`${…}` 只有在命令经 `bash`（或兼容 shell）执行时才会展开**。若 OpenClaw 将整句仅作为自然语言交给模型、由模型再执行命令，则取决于最终是否用 shell 执行；若出现「找不到目录」，优先检查实际执行层是否走了 shell。
2. **网关/代理进程的环境变量**：若未克隆到 `~/.openclaw`，应在运行 OpenClaw 的用户环境中导出 `OPENCLAW_HOME`，例如：
   ```bash
   export OPENCLAW_HOME="/你的/实际/路径/.openclaw"
   ```
   或在 systemd/launchd 等服务配置里写入同一变量。
3. **兜底**：若环境变量与 shell 展开不可靠，可直接把 `cron/jobs.json` 里对应 `message` 中的路径改成**本机绝对路径**（团队各自维护或使用内网模板生成）。

4. **直跑脚本（推荐作 crontab 备选）**：`workspace-stock/stock_system/scripts/run_stock_cron.sh` 会 `cd` 到 `STOCK_SYSTEM_ROOT`（或 `OPENCLAW_HOME/workspace-stock/stock_system`）并执行 `refactored/openclaw_cron_analyzer.py`，不经过 OpenClaw `agentTurn`。系统 crontab 可调用该脚本，分析结果仍写入该 `stock_system/data/` 与 `reports/`。
5. **定期清理**：`scripts/cleanup_stock_system.sh` 定义日志/报告/历史 JSON 的保留天数；OpenClaw Cron 每日 02:00 调用该脚本。细则见 `workspace-stock/stock_system/README.md` 中的表格。

## 6. 本地环境文件（不提交）

复制示例（可选）：

```bash
cp .env.example .env
```

按需编辑 `.env`；该文件默认被 `.gitignore` 忽略。

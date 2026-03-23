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

### 1.2 `acpx` 插件路径与 Node 版本

当前配置里 `plugins.load.paths` 与 `installs.acpx` 通常指向：

`~/.nvm/versions/node/<版本号>/lib/node_modules/openclaw/extensions/acpx`

该路径**随 nvm 下 Node 版本变化而变化**。升级 Node、换机器或未用 nvm 时，插件会加载失败。

**处理方式（任选）：**

- 在本机安装全局 OpenClaw CLI 后，查找实际目录，例如：
  - `ls "$(npm root -g)/openclaw/extensions/acpx"` 或
  - `find ~/.nvm -path '*/openclaw/extensions/acpx' -type d 2>/dev/null | head -1`
- 将上述**真实绝对路径**写入 `openclaw.json` 的 `plugins.load.paths[0]` 以及 `plugins.installs.acpx` 的 `sourcePath` / `installPath`（需与当前 OpenClaw 文档字段一致）。
- 长期方案：把 `acpx` 安装或链接到 `~/.openclaw/extensions/acpx`，并把 JSON 中的路径改为该固定位置（与 `wecom-openclaw-plugin` 类似）。

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

## 6. 本地环境文件（不提交）

复制示例（可选）：

```bash
cp .env.example .env
```

按需编辑 `.env`；该文件默认被 `.gitignore` 忽略。

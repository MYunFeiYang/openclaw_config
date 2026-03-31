# OpenClaw（龙虾）更好用实践清单

「龙虾」通常指 `main` 代理在 `openclaw.json` 里的 identity（通用助手 + 🦞）。日常体验主要取决于：**入站是否进对 agent**、**记忆是否分层**、**技能与模型是否匹配任务**。

官方参考：[Multi-Agent](https://docs.openclaw.ai/concepts/multi-agent) · [Agent Workspace](https://docs.openclaw.ai/concepts/agent-workspace) · [Skills](https://docs.openclaw.ai/tools/skills) · [Channel routing](https://docs.openclaw.ai/channels/channel-routing)

---

## 1. 入站进对「人」（优先做）

- [ ] 确认 `openclaw.json` 里 **`agents.list` 中默认 agent** 已用 `default: true` 标在期望的 `agentId` 上（本仓库为 `main`）。
- [ ] 确认 **`bindings`** 与渠道一致：未配置时，入站常落到默认 agent；企业微信等需按 [Channel routing](https://docs.openclaw.ai/channels/channel-routing) 配置 `match`（渠道、账号、peer 等）。本仓库当前为 **`wecom` → `stock`**（`match.accountId` 为 `"*"`，避免仅匹配「默认账号」导致回退到 `main`）。若要多账号/多群分流或改回龙虾（`main`），请改 `openclaw.json` 的 `bindings` 并**把更具体的匹配写在前面**（官方规则：更具体者优先）。
- [ ] 若改绑定后仍自称 `main`：**重启 Gateway**；若仍不对，多半是 **旧会话键仍在 `main` 的 session store 里**（键形如 `agent:main:wecom:direct:<peer>`，见 `~/.openclaw/agents/main/sessions/sessions.json`）。改 `bindings` **不会**自动迁移历史会话；需在 **`main`** 侧删除对应会话条目（并备份该文件），下次企微消息才会为 **`stock`** 新建 `agent:stock:wecom:direct:...`。可用 `openclaw sessions --agent main --json` 核对键名；子会话若 `spawnedBy` 指向该企微会话，可一并删或 `sessions cleanup --fix-missing` 按需整理。
- [ ] 修改 `bindings` 或 `agents.list` 后：**重启 Gateway**，再发一条真实消息验证。

```bash
openclaw gateway restart
# 若可用：
openclaw doctor
```

---

## 2. 多代理分工习惯（main / frontend / backend / ui / stock）

| 场景 | 建议 `agentId` | 说明 |
|------|----------------|------|
| 泛聊、协调、不知该谁做 | `main`（龙虾） | 默认入口 |
| 浏览器/前端工程、JS/TS、构建 | `frontend` | 与 `ui` 分工：偏实现 |
| API、服务、数据、基础设施 | `backend` | 与前端对齐契约 |
| 界面结构、视觉、截图/设计稿 | `ui` | 偏视觉与交互；完整业务前端见 `frontend` |
| A 股/行情、`stock_system/` 流水线 | `stock` | 非股票闲聊可改用 `main` |

- [ ] 在 **Control UI** 或 CLI 里**显式选 agent**，少依赖对话里「口头切换」。

---

## 3. 工作区记忆（AGENTS / SOUL / memory / MEMORY）

| 内容 | 放哪里 |
|------|--------|
| 长期规则、优先级、怎么用手顺 | 各 workspace 的 `AGENTS.md` |
| 人设、语气、本 agent 职责范围 | `SOUL.md`（本会话已写入「本代理职责」） |
| 用户称呼与偏好 | `USER.md` |
| 名字/emoji/气质（可选） | `IDENTITY.md`；与 `identity` 配置可对照 |
| 当天流水、临时上下文 | `memory/YYYY-MM-DD.md` |
| 仅私聊主会话的长期沉淀 | `MEMORY.md`（勿在群聊加载，见各 `AGENTS.md`） |

- [ ] 日记忆：本仓库 `.gitignore` 忽略 **`memory/`**，**不会随 Git 备份**；换机若要保留日记式记忆，需另做本机备份或加密归档（见 [SETUP.md](SETUP.md) §1.3）。

---

## 4. 技能与模型

- **技能**：各 `workspace-*/skills/` 优先于 `~/.openclaw/skills`（见 [SETUP.md](SETUP.md) §1.3）。**少而精**，减少误触发与 token。
- **模型**：在 `agents.list[].model` 或 Control UI 为不同 agent 选型（例如 **`ui` 用带 vision 的模型**）。避免所有任务同一重模型。

- [ ] 每季度扫一眼：是否仍有从不使用的 skill 可关（`skills.entries.*.enabled`）。

---

## 5. 网关与安全

- [ ] **跨 agent 调用**：`tools.agentToAgent` 已配置 `allow` 白名单（与本仓库 `agents.list` id 一致）；若新增 agent，记得同步 `allow`。
- [ ] **密钥**：长期目标为环境变量或 Secret 引用，见 [SETUP.md](SETUP.md) §1.4 与 [.env.example](.env.example)。
- [ ] 外网暴露 Control UI 时：核对 `gateway.auth`、`controlUi.allowedOrigins`。

---

## 6. 运维小习惯

- [ ] 大改配置后跑 `openclaw doctor`（若可用）或看网关日志。
- [ ] 多 workspace 时**固定路径**、少搬目录，避免记忆与插件路径漂移。

---

## 验收：最小自检

1. 发一条企业微信消息，确认落到 **`stock`**（若已按本仓库绑定）；非股票类闲聊是否仍符合 `workspace-stock` 里 `SOUL.md` / `AGENTS.md`（必要时可改回 `wecom` → `main`）。
2. 在 Control UI 切换到 `main`（龙虾），发一句泛聊，确认与企微分流预期一致。

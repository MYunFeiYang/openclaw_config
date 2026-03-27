# A 股分析（OpenClaw 主链路）

**唯一推荐入口**：`refactored/openclaw_cron_analyzer.py`

参数：`morning` | `afternoon` | `evening` | `weekly` | `reconcile` | `day_review`。

**OpenClaw Cron（工作日）**：仅 **08:00 `morning`** → **15:20 `reconcile`** → **21:00 `day_review`**；另每日 **02:00** 运行 `scripts/cleanup_stock_system.sh`（与预测无关）。

**定期清理规则**（可调环境变量覆盖天数）：

| 路径 | 规则 | 默认 |
|------|------|------|
| `logs/*.log` | 超过 N 天未修改则删除 | `DAYS_LOGS=7` |
| `reports/*.txt` | 超过 N 天未修改则删除 | `DAYS_REPORTS_TXT=30` |
| `data/*.txt`（不含 `iteration_briefing.txt`） | 超过 N 天未修改则删除 | `DAYS_DATA_TXT=30` |
| `data/predictions_*.json`、`summary_*.json`、`reconcile_*.json`、`day_review_*.json`、`validation_metrics_*.json` | 超过 N 天未修改则删除 | `DAYS_DATA_JSON=90` |
| `reconcile_history.jsonl`、`iteration_state.json` | **不删除**（无匹配模式） | — |
| `data/iteration_briefing.txt` | **不删除**（已从 `data/*.txt` 清理中排除） | — |

`afternoon` / `evening` / `weekly` 可手动执行，已不从 Cron 触发。

```bash
cd /path/to/stock_system
python3 refactored/openclaw_cron_analyzer.py morning
```

- 预测与总结：`refactored/predict_then_summarize.py`
- 取数：`refactored/openclaw_search_provider.py`（本机 `openclaw agent`）
- 股票池：`config/stock_pool.json`
- 系统 crontab 直跑（不经 OpenClaw `agentTurn`）：`scripts/run_stock_cron.sh`

环境变量：`STOCK_SYSTEM_ROOT`、`OPENCLAW_BIN`、`OPENCLAW_AGENT_TIMEOUT`、`STOCK_OPENCLAW_CACHE_SEC`（见仓库根目录 `SETUP.md`）。

落盘目录：`data/`、`reports/`、`logs/`。

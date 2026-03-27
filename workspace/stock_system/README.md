# A 股分析（OpenClaw 主链路）

**唯一推荐入口**：`refactored/openclaw_cron_analyzer.py`

参数：`morning` | `afternoon` | `evening` | `weekly` | `reconcile` | `day_review`

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

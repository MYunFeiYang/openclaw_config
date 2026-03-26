#!/usr/bin/env python3
"""
通过 OpenClaw Agent 使用其工具链中的「网页搜索 / 网页访问」拉取行情摘要。

依赖本机已配置好的 `openclaw` CLI 与模型（`openclaw agent --local` 或走 Gateway）。

环境变量：
  OPENCLAW_BIN              openclaw 可执行文件（默认 PATH 中 openclaw）
  OPENCLAW_STOCK_AGENT_ID   默认 main
  OPENCLAW_AGENT_LOCAL      1=--local 嵌入式代理（默认）；0=走已运行的 Gateway
  OPENCLAW_AGENT_TIMEOUT    秒，默认 600（网页搜索较慢，可按需再加大）
  STOCK_OPENCLAW_CACHE_SEC  单股缓存秒数，默认 90
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import time
from typing import Any, Dict, List, Optional, Tuple

from data_providers import (
    StockInputs,
    _neutral_fundamental,
    _neutral_technical,
    sector_from_price_action,
    sentiment_from_price_action,
)


def _technical_from_spot_change(change_percent: float) -> Dict:
    t = _neutral_technical()
    t["momentum_5d"] = round(max(-0.05, min(0.05, change_percent / 500.0)), 4)
    if change_percent > 2:
        t["macd_signal"] = "金叉"
    elif change_percent < -2:
        t["macd_signal"] = "死叉"
    return t


def _strip_json_from_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```\s*$", "", text)
    return text.strip()


def _parse_inner_json_object(text: str) -> Optional[Dict[str, Any]]:
    text = _strip_json_from_text(text)
    try:
        obj = json.loads(text)
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        pass
    m = re.search(
        r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}",
        text,
        re.DOTALL,
    )
    if m:
        try:
            obj = json.loads(m.group(0))
            return obj if isinstance(obj, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def _parse_agent_stdout(stdout: str) -> Tuple[Optional[str], str]:
    """返回 (payload_text, raw)。"""
    raw = stdout.strip()
    if not raw:
        return None, raw
    
    # Look for the JSON object containing payloads
    # Find all potential JSON objects and look for one with "payloads" key
    
    i = 0
    while i < len(raw):
        if raw[i] == '{':
            # Found opening brace, find matching closing brace
            brace_count = 1
            j = i + 1
            while j < len(raw) and brace_count > 0:
                if raw[j] == '{':
                    brace_count += 1
                elif raw[j] == '}':
                    brace_count -= 1
                j += 1
            
            if brace_count == 0:
                # Found a complete JSON object
                json_str = raw[i:j]
                try:
                    parsed = json.loads(json_str)
                    if isinstance(parsed, dict) and "payloads" in parsed:
                        payloads = parsed.get("payloads")
                        if isinstance(payloads, list) and payloads:
                            t = payloads[0].get("text")
                            if isinstance(t, str):
                                return t, raw
                except json.JSONDecodeError:
                    pass
                i = j
            else:
                i += 1
        else:
            i += 1
    
    # Fall back to original parsing
    try:
        outer = json.loads(raw)
    except json.JSONDecodeError:
        return raw, raw
    payloads = outer.get("payloads")
    if isinstance(payloads, list) and payloads:
        t = payloads[0].get("text")
        if isinstance(t, str):
            return t, raw
    return None, raw


class OpenclawAgentWebProvider:
    """
    调用 `openclaw agent`，由 Agent 使用 OpenClaw 配置的浏览/搜索类工具查询公开行情。
    技术面以涨跌幅粗估为主；基本面用板块中性基准（避免二次搜索爆炸）。
    """

    def __init__(self) -> None:
        self._bin = os.environ.get("OPENCLAW_BIN") or shutil.which("openclaw") or "openclaw"
        self._agent_id = (os.environ.get("OPENCLAW_STOCK_AGENT_ID") or "main").strip()
        self._timeout = int(os.environ.get("OPENCLAW_AGENT_TIMEOUT") or "600")
        self._use_local = os.environ.get("OPENCLAW_AGENT_LOCAL", "1").lower() not in (
            "0",
            "false",
            "no",
        )
        self._cache: Dict[str, Tuple[float, Tuple[float, float]]] = {}
        self._ttl = float(os.environ.get("STOCK_OPENCLAW_CACHE_SEC") or "90")

    def _invoke_agent(self, stock: Any) -> Dict[str, Any]:
        code = str(getattr(stock, "symbol", "")).strip()
        name = str(getattr(stock, "name", "")).strip()
        prompt = (
            f"请使用你可用的网页搜索、网页抓取或浏览器类工具，查询 A 股 {name}（股票代码 {code}）"
            f"当前可参考的实时或最新行情：最新价（人民币元）、涨跌幅（百分比数字，例如 -1.25 表示跌 1.25%）。\n"
            f"务必基于搜索结果中的公开页面作答，不要编造。\n"
            f"最后只输出一行合法 JSON，不要 Markdown 代码块，格式严格为：\n"
            f'{{"current_price": <number|null>, "change_percent": <number|null>}}\n'
            f"若确实查不到，对应字段用 null。"
        )
        cmd: List[str] = [self._bin, "agent"]
        if self._use_local:
            cmd.append("--local")
        cmd.extend(
            [
                "--agent",
                self._agent_id,
                "--json",
                "-m",
                prompt,
                "--timeout",
                str(self._timeout),
            ]
        )
        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self._timeout + 180,
            )
        except subprocess.TimeoutExpired as e:
            raise RuntimeError("openclaw agent 调用超时") from e
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout or "").strip()[:2000]
            raise RuntimeError(f"openclaw agent 失败 (code={proc.returncode}): {err}")
        
        # Try stdout first, then stderr (some OpenClaw versions output to stderr)
        payload_text, _ = _parse_agent_stdout(proc.stdout or "")
        if not payload_text:
            payload_text, _ = _parse_agent_stdout(proc.stderr or "")
        if not payload_text:
            raise RuntimeError("openclaw agent 返回无法解析（无 payloads.text）")
        low = payload_text.lower()
        if "timed out" in low or "timeoutseconds" in low.replace(" ", ""):
            raise RuntimeError(
                "OpenClaw Agent 在超时前未完成回复（未产出 JSON）。"
                "请增大环境变量 OPENCLAW_AGENT_TIMEOUT、在 openclaw.json 中提高 "
                "agents.defaults.timeoutSeconds，或换更快模型；"
                "带网页搜索的单股查询常需较长时间。"
            )
        
        # The payload_text should be a JSON string containing the stock data
        # First try to parse it as the outer JSON (from OpenClaw agent format)
        try:
            outer_data = json.loads(payload_text)
            if isinstance(outer_data, dict) and "text" in outer_data:
                # This is the OpenClaw agent format, extract the text field
                inner_text = outer_data["text"]
                if inner_text:
                    inner_data = json.loads(inner_text)
                    if isinstance(inner_data, dict) and "current_price" in inner_data:
                        return inner_data
        except json.JSONDecodeError:
            pass
        
        # If that fails, try direct parsing
        try:
            data = json.loads(payload_text)
            if isinstance(data, dict) and "current_price" in data:
                return data
        except json.JSONDecodeError:
            pass
        
        # If direct parsing fails, try the inner JSON extraction
        data = _parse_inner_json_object(payload_text)
        if not data:
            raise RuntimeError(f"无法从 Agent 回复中解析 JSON: {payload_text[:500]}")
        return data

    def fetch(self, stock: Any) -> StockInputs:
        code = str(getattr(stock, "symbol", "")).strip().zfill(6)
        now = time.time()
        if code in self._cache:
            ts, pair = self._cache[code]
            if now - ts < self._ttl:
                price, pct = pair
                return self._build_inputs(stock, price, pct)

        data = self._invoke_agent(stock)
        price_v = data.get("current_price")
        chg_v = data.get("change_percent")
        if price_v is None:
            raise RuntimeError(f"OpenClaw 搜索未返回有效现价: {data!r}")
        try:
            price = float(price_v)
        except (TypeError, ValueError) as e:
            raise RuntimeError(f"现价格式无效: {price_v!r}") from e
        if price <= 0:
            raise RuntimeError(f"现价无效: {price}")
        try:
            pct = float(chg_v) if chg_v is not None else 0.0
        except (TypeError, ValueError):
            pct = 0.0

        self._cache[code] = (now, (price, pct))
        return self._build_inputs(stock, price, pct)

    def _build_inputs(self, stock: Any, price: float, pct: float) -> StockInputs:
        technical = _technical_from_spot_change(pct)
        fundamental = _neutral_fundamental(stock)
        sentiment = sentiment_from_price_action(pct, 1.0)
        sector = sector_from_price_action(pct)
        return StockInputs(
            current_price=round(price, 2),
            change_percent=round(pct, 2),
            technical=technical,
            fundamental=fundamental,
            sentiment=sentiment,
            sector=sector,
            provenance="openclaw_agent_web",
        )

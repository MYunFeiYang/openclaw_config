#!/usr/bin/env python3
"""
LLM 预测模块 — 通过 OpenRouter API 调用大模型进行股票预测。

环境变量：
  OPENROUTER_API_KEY    OpenRouter API Key（必需）
  OPENROUTER_MODEL      模型名称（默认 deepseek/deepseek-chat）
  OPENROUTER_BASE_URL   可选自定义 base URL（默认 https://openrouter.ai/api/v1）
  OPENROUTER_TIMEOUT    请求超时秒数（默认 30）
  OPENROUTER_MAX_TOKENS 最大输出 token（默认 1024）

模型推荐（按性价比）：
  deepseek/deepseek-chat        DeepSeek V3，便宜且中文好，$0.14/$0.28 per 1M tokens
  qwen/qwen-3-32b               Qwen3，中文开源最强，免费
  google/gemini-2.0-flash-001   Gemini 2.0 Flash，速度最快，免费额度大
  anthropic/claude-3.5-haiku    Claude 3.5 Haiku，分析能力强，稍贵

OpenRouter 兼容 OpenAI SDK 格式，本模块仅用 Python 标准库 urllib，
不依赖任何第三方包。
"""

from __future__ import annotations

import json
import os
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Tuple


# ── 默认配置 ──────────────────────────────────────────
_DEFAULT_MODEL = "deepseek/deepseek-chat"
_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
_DEFAULT_TIMEOUT = 30
_DEFAULT_MAX_TOKENS = 1024


def _get_api_key() -> Optional[str]:
    return os.environ.get("OPENROUTER_API_KEY") or None


def _get_model() -> str:
    return os.environ.get("OPENROUTER_MODEL") or _DEFAULT_MODEL


def _get_base_url() -> str:
    return os.environ.get("OPENROUTER_BASE_URL") or _DEFAULT_BASE_URL


def _get_timeout() -> int:
    try:
        return int(os.environ.get("OPENROUTER_TIMEOUT", str(_DEFAULT_TIMEOUT)))
    except ValueError:
        return _DEFAULT_TIMEOUT


# ── Prompt 模板 ────────────────────────────────────────

_SYSTEM_PROMPT = """你是一位资深A股量化分析师。你需要根据提供的股票多维度数据，给出客观的短期（1-5个交易日）走势预测。

要求：
1. 重点分析技术面趋势结构：均线排列（多头/空头/缠绕）、MACD状态、RSI超买超卖、布林带位置、量能变化
2. 结合基本面估值与行业轮动状态
3. 评分 1-10 分（10=强烈看涨，1=强烈看跌，5=中性），必须基于多周期趋势一致性给出，不要仅看单日涨跌
4. 信号等级：强烈买入(>=8.5)、买入(>=7.0)、持有(5.0-7.0)、卖出(3.5-5.0)、强烈卖出(<3.5)
5. 信心度 40-95，反映你对判断的确定性（趋势越清晰信心越高）
6. 给出 2-4 条简短的推荐理由（每条不超过20字），须具体（如"量价齐升"而非"技术面好"）

只输出 JSON，不要其他内容。格式：
{"final_score": 7.5, "signal": "买入", "confidence": 72, "reasons": ["均线多头排列", "MACD金叉放量"]}"""


def _build_single_stock_prompt(stock: Dict[str, Any]) -> str:
    """构建单只股票的预测 prompt"""
    name = stock.get("name", "未知")
    symbol = stock.get("symbol", "")
    sector = stock.get("sector_name", stock.get("sector", ""))
    if isinstance(sector, dict):
        sector = sector.get("name", "")
    price = stock.get("current_price", 0)
    change = stock.get("change_percent", 0)
    tech = stock.get("technical", {})
    fund = stock.get("fundamental", {})
    sent = stock.get("sentiment", {})
    sect = stock.get("sector", {}) if isinstance(stock.get("sector"), dict) else {}

    lines = [
        f"请预测以下A股未来1-5个交易日的走势：",
        f"",
        f"股票：{name}（{symbol}）",
        f"行业：{sector}",
        f"现价：{price} 元 | 今日涨跌：{change:+.2f}%",
        f"",
        f"【技术面 - 多周期趋势】",
        f"  RSI(14): {tech.get('rsi', 50)}",
        f"  MACD: {tech.get('macd_signal', '中性')} (DIF={tech.get('macd_dif', 0)}, DEA={tech.get('macd_dea', 0)}, BAR={tech.get('macd_bar', 0)})",
        f"  布林带: 位置={tech.get('bollinger_position', 0)} (上={tech.get('bollinger_upper')}, 中={tech.get('bollinger_mid')}, 下={tech.get('bollinger_lower')})",
        f"  量比: {tech.get('volume_ratio', 1.0)}",
        f"  均线排列: {tech.get('ma_alignment', '中性')}",
        f"  均线值: MA5={tech.get('ma5')}, MA10={tech.get('ma10')}, MA20={tech.get('ma20')}, MA60={tech.get('ma60')}",
        f"  动量: 5日={tech.get('momentum_5d', 0):+.2%}, 10日={tech.get('momentum_10d', 0):+.2%}, 20日={tech.get('momentum_20d', 0):+.2%}",
        f"",
        f"【基本面】",
        f"  PE: {fund.get('pe_ratio', 'N/A')} | PB: {fund.get('pb_ratio', 'N/A')} | ROE: {fund.get('roe', 'N/A')}%",
        f"  营收增速: {fund.get('growth_rate', 'N/A')}%",
        f"  资产负债率: {fund.get('debt_ratio', 'N/A')}",
        f"  股息率: {fund.get('dividend_yield', 'N/A')}%",
        f"",
        f"【情绪面】",
        f"  市场热度: {sent.get('market_heat', 5)}/10",
        f"  机构关注: {sent.get('institution_attention', 5)}/10",
        f"  散户情绪: {sent.get('retail_sentiment', '中性')}",
        f"  新闻面: {sent.get('news_sentiment', '中性')}",
        f"",
        f"【行业面】",
        f"  景气度: {sect.get('prosperity', 5)}/10",
        f"  政策支持: {sect.get('policy_support', 5)}/10",
        f"  资金流向: {sect.get('capital_flow', 5)}/10",
        f"  轮动位置: {sect.get('rotation_position', 5)}/10",
    ]
    return "\n".join(lines)


def _parse_response(text: str) -> Optional[Dict[str, Any]]:
    """从 LLM 响应中解析 JSON"""
    text = text.strip()
    # 尝试提取 JSON 块
    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start)
        text = text[start:end].strip()
    elif "```" in text:
        start = text.index("```") + 3
        end = text.index("```", start)
        text = text[start:end].strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        # 尝试找第一个 { }
        try:
            s = text.index("{")
            e = text.rindex("}") + 1
            result = json.loads(text[s:e])
        except (ValueError, json.JSONDecodeError):
            return None

    # 校验必要字段
    required = {"final_score", "signal", "confidence", "reasons"}
    if not required.issubset(result.keys()):
        return None

    # 类型校验
    try:
        result["final_score"] = float(result["final_score"])
        result["confidence"] = int(result["confidence"])
        result["signal"] = str(result["signal"])
        result["reasons"] = list(result["reasons"])
    except (ValueError, TypeError):
        return None

    # 范围校验
    result["final_score"] = max(1.0, min(10.0, result["final_score"]))
    result["confidence"] = max(30, min(95, result["confidence"]))
    valid_signals = {"强烈买入", "买入", "持有", "卖出", "强烈卖出"}
    if result["signal"] not in valid_signals:
        # 尝试映射英文
        signal_map = {
            "strong buy": "强烈买入", "buy": "买入",
            "hold": "持有", "sell": "卖出", "strong sell": "强烈卖出",
        }
        result["signal"] = signal_map.get(result["signal"].lower(), "持有")

    return result


def call_openrouter(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    max_tokens: int = _DEFAULT_MAX_TOKENS,
) -> Optional[Dict[str, Any]]:
    """调用 OpenRouter Chat Completions API，返回完整响应 JSON 或 None"""
    api_key = _get_api_key()
    if not api_key:
        return None

    url = f"{_get_base_url()}/chat/completions"
    body = {
        "model": model or _get_model(),
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.3,  # 低温度保证一致性
    }
    data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/stock-system",
            "X-Title": "Stock Prediction System",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=_get_timeout()) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[LLM] OpenRouter HTTP {e.code}: {body[:300]}")
        return None
    except Exception as e:
        print(f"[LLM] OpenRouter 请求失败: {e}")
        return None


def predict_single(stock: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """对单只股票调用 LLM 预测，失败返回 None"""
    api_key = _get_api_key()
    if not api_key:
        print("[LLM] 未设置 OPENROUTER_API_KEY，跳过 LLM 预测")
        return None

    user_prompt = _build_single_stock_prompt(stock)
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    resp = call_openrouter(messages)
    if not resp:
        return None

    try:
        content = resp["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        print("[LLM] 响应格式异常")
        return None

    result = _parse_response(content)
    if result:
        result["_model"] = resp.get("model", "unknown")
        print(f"[LLM] {stock.get('name', '?')} → {result['signal']}({result['final_score']}) "
              f"信心{result['confidence']} [{result['_model']}]")
    else:
        print(f"[LLM] {stock.get('name', '?')} 响应解析失败: {content[:200]}")
    return result


def predict_batch(stocks: List[Dict[str, Any]]) -> Optional[List[Optional[Dict[str, Any]]]]:
    """批量预测多只股票（单次 API 调用），返回与输入等长的结果列表。
    某只股票解析失败则该位置为 None。整体调用失败返回 None。"""
    api_key = _get_api_key()
    if not api_key:
        print("[LLM] 未设置 OPENROUTER_API_KEY，跳过 LLM 预测")
        return None

    # 构建批量 prompt
    stock_blocks = []
    for i, s in enumerate(stocks):
        block = _build_single_stock_prompt(s)
        stock_blocks.append(f"--- 股票 #{i+1} ---\n{block}")

    user_prompt = (
        "请逐一预测以下 {} 只A股未来1-5个交易日的走势。\n"
        "对每只股票分别给出评分和信号。\n\n"
        "{}\n\n"
        "请返回一个 JSON 数组，每个元素对应一只股票：\n"
        '[{{"final_score": 7.5, "signal": "买入", "confidence": 72, "reasons": ["理由1","理由2"]}},...]\n'
        "不要输出其他内容。"
    ).format(len(stocks), "\n\n".join(stock_blocks))

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    resp = call_openrouter(messages, max_tokens=2048)
    if not resp:
        return None

    try:
        content = resp["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        print("[LLM] 响应格式异常")
        return None

    # 解析 JSON 数组
    content = content.strip()
    if "```json" in content:
        content = content[content.index("```json") + 7 :]
        if "```" in content:
            content = content[: content.index("```")].strip()
    elif "```" in content:
        content = content[content.index("```") + 3 :]
        if "```" in content:
            content = content[: content.index("```")].strip()

    try:
        arr = json.loads(content)
    except json.JSONDecodeError:
        # 尝试提取数组部分
        try:
            s = content.index("[")
            e = content.rindex("]") + 1
            arr = json.loads(content[s:e])
        except (ValueError, json.JSONDecodeError):
            print(f"[LLM] 批量响应解析失败: {content[:300]}")
            return None

    if not isinstance(arr, list):
        return None

    # 逐项解析
    model_used = resp.get("model", "unknown")
    results: List[Optional[Dict[str, Any]]] = []
    for i, item in enumerate(arr):
        name = stocks[i].get("name", "?") if i < len(stocks) else "?"
        if not isinstance(item, dict):
            results.append(None)
            print(f"[LLM] {name} 结果格式异常，跳过")
            continue
        parsed = _parse_response(json.dumps(item))
        if parsed:
            parsed["_model"] = model_used
            print(f"[LLM] {name} → {parsed['signal']}({parsed['final_score']}) "
                  f"信心{parsed['confidence']}")
        else:
            print(f"[LLM] {name} 解析失败: {item}")
        results.append(parsed)

    return results


# ── 便捷入口：与现有 PredictionEngine 对接 ──

def stock_to_llm_input(
    stock_name: str,
    stock_symbol: str,
    stock_sector: str,
    current_price: float,
    change_percent: float,
    technical: Dict,
    fundamental: Dict,
    sentiment: Dict,
    sector: Dict,
) -> Dict[str, Any]:
    """将 StockConfig + StockInputs 组装成 llm_predictor 需要的字典"""
    return {
        "name": stock_name,
        "symbol": stock_symbol,
        "sector_name": stock_sector,
        "current_price": current_price,
        "change_percent": change_percent,
        "technical": technical,
        "fundamental": fundamental,
        "sentiment": sentiment,
        "sector": sector,
    }


def is_llm_enabled() -> bool:
    """检查 LLM 预测是否可用"""
    return bool(_get_api_key())

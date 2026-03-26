#!/usr/bin/env python3
import sys
sys.path.append('refactored')

import json
from openclaw_search_provider import OpenclawAgentWebProvider

# Test the provider with detailed debugging
provider = OpenclawAgentWebProvider()

# Monkey patch the _invoke_agent method to add debugging
original_invoke = provider._invoke_agent

def debug_invoke_agent(stock):
    print(f"=== DEBUG: _invoke_agent called for {stock.name} ({stock.symbol}) ===")
    
    import subprocess
    import time
    
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
    
    from openclaw_search_provider import _parse_agent_stdout
    
    cmd = [
        provider._bin, "agent"
    ]
    if provider._use_local:
        cmd.append("--local")
    cmd.extend([
        "--agent", provider._agent_id,
        "--json", "-m", prompt,
        "--timeout", str(provider._timeout),
    ])
    
    print(f"Running command: {' '.join(cmd[:5])}... (truncated)")
    
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=provider._timeout + 180,
        )
        
        print(f"Return code: {proc.returncode}")
        print(f"Stdout length: {len(proc.stdout) if proc.stdout else 0}")
        print(f"Stderr length: {len(proc.stderr) if proc.stderr else 0}")
        
        # Try parsing both stdout and stderr
        payload_text = None
        
        if proc.stdout:
            payload_text, _ = _parse_agent_stdout(proc.stdout)
            print(f"Parsed from stdout: {repr(payload_text[:200]) if payload_text else None}")
        
        if not payload_text and proc.stderr:
            payload_text, _ = _parse_agent_stdout(proc.stderr)
            print(f"Parsed from stderr: {repr(payload_text[:200]) if payload_text else None}")
        
        if not payload_text:
            raise RuntimeError("No payload text found")
        
        print(f"Final payload text: {repr(payload_text[:200])}")
        
        # Now try the parsing logic
        try:
            outer_data = json.loads(payload_text)
            print(f"Outer data type: {type(outer_data)}")
            if isinstance(outer_data, dict):
                print(f"Outer data keys: {list(outer_data.keys())}")
                if "text" in outer_data:
                    inner_text = outer_data["text"]
                    print(f"Inner text: {repr(inner_text)}")
                    if inner_text:
                        inner_data = json.loads(inner_text)
                        print(f"Inner data: {inner_data}")
                        if isinstance(inner_data, dict) and "current_price" in inner_data:
                            print("SUCCESS: Found current_price in inner data")
                            return inner_data
        except Exception as e:
            print(f"Parsing error: {e}")
            import traceback
            traceback.print_exc()
        
        # If we get here, fall back to original parsing
        print("Falling back to original parsing...")
        from openclaw_search_provider import _parse_inner_json_object
        data = _parse_inner_json_object(payload_text)
        if not data:
            raise RuntimeError(f"无法从 Agent 回复中解析 JSON: {payload_text[:500]}")
        return data
        
    except Exception as e:
        print(f"Exception in debug_invoke_agent: {e}")
        import traceback
        traceback.print_exc()
        raise

provider._invoke_agent = debug_invoke_agent

# Test
from predict_then_summarize import StockConfig
stock = StockConfig('贵州茅台', '600519', '白酒', 0.9)

try:
    result = provider.fetch(stock)
    print(f"\n=== FINAL RESULT ===")
    print(f"Current price: {result.current_price}")
    print(f"Change percent: {result.change_percent}")
except Exception as e:
    print(f"\n=== FINAL ERROR ===")
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
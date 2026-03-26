#!/usr/bin/env python3
import subprocess
import json
import os

# Test the exact command that's being run
stock_name = '贵州茅台'
stock_code = '600519'

prompt = (
    f"请使用你可用的网页搜索、网页抓取或浏览器类工具，查询 A 股 {stock_name}（股票代码 {stock_code}）"
    f"当前可参考的实时或最新行情：最新价（人民币元）、涨跌幅（百分比数字，例如 -1.25 表示跌 1.25%）。\n"
    f"务必基于搜索结果中的公开页面作答，不要编造。\n"
    f"最后只输出一行合法 JSON，不要 Markdown 代码块，格式严格为：\n"
    f'{{"current_price": <number|null>, "change_percent": <number|null>}}\n'
    f"若确实查不到，对应字段用 null。"
)

cmd = [
    "/Users/thinkway/.nvm/versions/node/v24.14.0/bin/openclaw",
    "agent",
    "--local",
    "--agent",
    "main",
    "--json",
    "-m",
    prompt,
    "--timeout",
    "600",
]

print("Running command...")

try:
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=780,  # timeout + 180
    )
    
    print(f"Return code: {proc.returncode}")
    
    # Save output to files for analysis
    with open('/Users/thinkway/.openclaw/workspace/stock_system/stdout.txt', 'w') as f:
        f.write(proc.stdout or '')
    
    with open('/Users/thinkway/.openclaw/workspace/stock_system/stderr.txt', 'w') as f:
        f.write(proc.stderr or '')
    
    print("Output saved to stdout.txt and stderr.txt")
    
    # Check if we have payloads
    if proc.stdout:
        try:
            outer = json.loads(proc.stdout)
            payloads = outer.get("payloads")
            if isinstance(payloads, list) and payloads:
                text = payloads[0].get("text")
                print(f"Payload text found: {repr(text[:200])}")
            else:
                print("No payloads found or payloads is not a list")
                print("Available keys:", list(outer.keys()) if isinstance(outer, dict) else "Not a dict")
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print("First 500 chars of stdout:", repr(proc.stdout[:500]))
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
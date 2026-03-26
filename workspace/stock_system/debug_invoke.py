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

print("Running command:")
print(" ".join(cmd))
print("\nPrompt:")
print(prompt)

try:
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=780,  # timeout + 180
    )
    
    print(f"\nReturn code: {proc.returncode}")
    print(f"Stdout length: {len(proc.stdout) if proc.stdout else 0}")
    print(f"Stderr length: {len(proc.stderr) if proc.stderr else 0}")
    
    print("\nStdout:")
    print(repr(proc.stdout))
    
    print("\nStderr:")
    print(repr(proc.stderr))
    
    # Try to parse
    if proc.stdout:
        try:
            outer = json.loads(proc.stdout)
            print("\nParsed JSON:")
            print(json.dumps(outer, indent=2, ensure_ascii=False))
            
            payloads = outer.get("payloads")
            if isinstance(payloads, list) and payloads:
                text = payloads[0].get("text")
                print(f"\nPayload text: {repr(text)}")
        except json.JSONDecodeError as e:
            print(f"\nJSON parse error: {e}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
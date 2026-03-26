#!/usr/bin/env python3
import json
import re

def _strip_json_from_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```\s*$", "", text)
    return text.strip()

def _parse_agent_stdout(stdout: str):
    """返回 (payload_text, raw)。"""
    raw = stdout.strip()
    if not raw:
        return None, raw
    
    # Try to find JSON object in the text
    # Look for the last JSON object in case there are warnings before it
    json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    matches = list(re.finditer(json_pattern, raw, re.DOTALL))
    
    if matches:
        # Try the last match first (most likely to be the actual response)
        for match in reversed(matches):
            try:
                test_obj = json.loads(match.group(0))
                if "payloads" in test_obj:
                    return match.group(0), raw
            except json.JSONDecodeError:
                continue
    
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

# Test with actual stderr content
test_stderr = """Config warnings:
- plugins.entries.acpx: plugin acpx: duplicate plugin id detected; bundled plugin will be overridden by config plugin (/Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/extensions/acpx/index.js)
Config warnings:
- plugins.entries.acpx: plugin acpx: duplicate plugin id detected; bundled plugin will be overridden by config plugin (/Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/extensions/acpx/index.js)
[agents/model-providers] Failed to discover Ollama models: TypeError: fetch failed
[agents/model-providers] Failed to discover Ollama models: TypeError: fetch failed
[agents/model-providers] Failed to discover Ollama models: TypeError: fetch failed
{
  "payloads": [
    {
      "text": "{\"current_price\":1445.00,\"change_percent\":-0.54}",
      "mediaUrl": null
    }
  ],
  "meta": {
    "durationMs": 2777,
    "agentMeta": {
      "sessionId": "179b00b9-de5a-4f90-a4d6-01b69c455aaa",
      "provider": "oneapi",
      "model": "kimi-k2-250905",
      "usage": {
        "input": 22730,
        "output": 17,
        "total": 22747
      }
    }
  }
}"""

print("Testing with actual stderr content...")
payload_text, raw = _parse_agent_stdout(test_stderr)
print("Extracted payload text:", repr(payload_text))

if payload_text:
    try:
        outer = json.loads(payload_text)
        print("Outer JSON keys:", list(outer.keys()))
        if "payloads" in outer and isinstance(outer["payloads"], list) and outer["payloads"]:
            inner_text = outer["payloads"][0].get("text")
            print("Inner text:", repr(inner_text))
            if inner_text:
                inner_data = json.loads(inner_text)
                print("Inner data:", inner_data)
    except Exception as e:
        print("Error parsing:", e)
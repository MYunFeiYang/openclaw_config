#!/usr/bin/env python3
import json
import re

def _parse_agent_stdout(stdout: str):
    """返回 (payload_text, raw)。"""
    raw = stdout.strip()
    if not raw:
        return None, raw
    
    # Look for the JSON object that contains payloads
    # Find the position where "payloads" appears, then look for the enclosing braces
    
    # Simple approach: find the JSON object that contains "payloads"
    # Look for pattern: { ... "payloads": [ ... ] ... }
    
    # Find the last complete JSON object in the text
    brace_depth = 0
    json_start = -1
    json_candidates = []
    
    for i, char in enumerate(raw):
        if char == '{':
            if brace_depth == 0:
                json_start = i
            brace_depth += 1
        elif char == '}':
            brace_depth -= 1
            if brace_depth == 0 and json_start != -1:
                # Found a complete JSON object
                json_str = raw[json_start:i+1]
                json_candidates.append((json_start, json_str))
                json_start = -1
    
    # Try each candidate JSON object (starting from the last one)
    for start_pos, json_str in reversed(json_candidates):
        try:
            parsed = json.loads(json_str)
            if isinstance(parsed, dict) and "payloads" in parsed:
                payloads = parsed.get("payloads")
                if isinstance(payloads, list) and payloads:
                    t = payloads[0].get("text")
                    if isinstance(t, str):
                        return t, raw
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

# Test with the actual stderr content
test_stderr = """Config warnings:
- plugins.entries.acpx: plugin acpx: duplicate plugin id detected; bundled plugin will be overridden by config plugin (/Users/thinkway/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/extensions/acpx/index.js)
[agents/model-providers] Failed to discover Ollama models: TypeError: fetch failed
{
  "payloads": [
    {
      "text": "{\"current_price\":1445.00,\"change_percent\":-0.54}",
      "mediaUrl": null
    }
  ],
  "meta": {
    "durationMs": 2777
  }
}"""

print("Testing with improved JSON extraction...")
payload_text, raw = _parse_agent_stdout(test_stderr)
print("Extracted payload text:", repr(payload_text))

if payload_text:
    try:
        # This should be the inner JSON string
        inner_data = json.loads(payload_text)
        print("Inner data:", inner_data)
        print("Has current_price:", "current_price" in inner_data)
    except Exception as e:
        print("Error parsing inner JSON:", e)
else:
    print("No payload text extracted!")
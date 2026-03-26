#!/usr/bin/env python3
import json
import re

def _parse_agent_stdout(stdout: str):
    """返回 (payload_text, raw)。"""
    raw = stdout.strip()
    if not raw:
        return None, raw
    
    # Look for the JSON object that contains payloads
    # Find the last occurrence of a JSON object that has "payloads" key
    
    # First, let's find all JSON objects in the text
    json_objects = []
    
    # Pattern to match JSON objects (this is a simplified approach)
    # We'll look for the pattern that starts with { and ends with } and contains "payloads"
    
    # Find the position where "payloads" appears, then look for the enclosing braces
    payloads_pos = raw.find('"payloads"')
    if payloads_pos != -1:
        # Find the opening brace before payloads
        start_pos = payloads_pos
        brace_count = 0
        json_start = -1
        
        # Go backwards to find the opening brace
        for i in range(start_pos, -1, -1):
            if raw[i] == '{':
                if brace_count == 0:
                    json_start = i
                    break
                brace_count -= 1
            elif raw[i] == '}':
                brace_count += 1
        
        if json_start != -1:
            # Now find the matching closing brace
            brace_count = 0
            json_end = -1
            for i in range(json_start, len(raw)):
                if raw[i] == '{':
                    brace_count += 1
                elif raw[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = i + 1
                        break
            
            if json_end != -1:
                json_str = raw[json_start:json_end]
                print(f"Found JSON string: {json_str[:200]}...")
                try:
                    parsed = json.loads(json_str)
                    if "payloads" in parsed:
                        payloads = parsed.get("payloads")
                        if isinstance(payloads, list) and payloads:
                            t = payloads[0].get("text")
                            if isinstance(t, str):
                                return t, raw
                except json.JSONDecodeError:
                    pass
    
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

print("Testing improved parsing...")
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
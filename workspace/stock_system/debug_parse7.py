#!/usr/bin/env python3
import json
import re

def _parse_agent_stdout(stdout: str):
    """返回 (payload_text, raw)。"""
    raw = stdout.strip()
    if not raw:
        return None, raw
    
    # Look for the JSON object containing payloads
    # Use a more robust approach to find the complete JSON
    
    # Find all potential JSON objects
    json_objects = []
    
    # Pattern to find JSON objects - look for balanced braces
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

# Test with the actual stderr content
test_stderr = r'''Config warnings:
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
}'''

print("Testing with robust JSON extraction...")
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
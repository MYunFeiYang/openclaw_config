#!/usr/bin/env python3
import json
import re

def _strip_json_from_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```\s*$", "", text)
    return text.strip()

def _parse_inner_json_object(text: str):
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

# Test the actual data structure
test_data = {'text': '{"current_price":1445.00,"change_percent":-0.54}', 'mediaUrl': None}

print("Test data:", test_data)
print("Type:", type(test_data))

# This is what we get from the agent
payload_text = '{"text": "{\\"current_price\\":1445.00,\\"change_percent\\":-0.54}", "mediaUrl": null}'
print("\nPayload text:", repr(payload_text))

# Try to parse the outer JSON
try:
    outer = json.loads(payload_text)
    print("Outer JSON parsed:", outer)
    
    # Extract the text field
    inner_text = outer.get('text')
    print("Inner text:", repr(inner_text))
    
    if inner_text:
        # Parse the inner JSON
        inner_data = json.loads(inner_text)
        print("Inner data:", inner_data)
        
except Exception as e:
    print("Error:", e)

# Test the parsing functions
result = _parse_inner_json_object(payload_text)
print("Parse result:", result)
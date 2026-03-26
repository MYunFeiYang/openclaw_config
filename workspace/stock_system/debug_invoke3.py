#!/usr/bin/env python3
import sys
sys.path.append('refactored')

import json
from openclaw_search_provider import OpenclawAgentWebProvider

# Create a mock provider and test the parsing
provider = OpenclawAgentWebProvider()

# Simulate what the agent returns
mock_payload_text = '{"text": "{\\"current_price\\":1445.00,\\"change_percent\\":-0.54}", "mediaUrl": null}'

print("Mock payload text:", repr(mock_payload_text))

# Test the parsing logic from the fixed code
def test_parsing(payload_text):
    print(f"\nTesting parsing for: {payload_text[:100]}...")
    
    # First try to parse it as the outer JSON (from OpenClaw agent format)
    try:
        outer_data = json.loads(payload_text)
        print(f"Outer data parsed: {type(outer_data)} - {list(outer_data.keys()) if isinstance(outer_data, dict) else 'not dict'}")
        
        if isinstance(outer_data, dict) and "text" in outer_data:
            # This is the OpenClaw agent format, extract the text field
            inner_text = outer_data["text"]
            print(f"Inner text: {repr(inner_text)}")
            
            if inner_text:
                inner_data = json.loads(inner_text)
                print(f"Inner data: {inner_data}")
                
                if isinstance(inner_data, dict) and "current_price" in inner_data:
                    print("SUCCESS: Found current_price in inner data")
                    return inner_data
                else:
                    print(f"FAIL: inner_data is not dict or missing current_price: {type(inner_data)}")
        else:
            print("FAIL: outer_data is not dict or missing text field")
    except json.JSONDecodeError as e:
        print(f"FAIL: Outer JSON parse error: {e}")
    
    return None

result = test_parsing(mock_payload_text)
print(f"\nFinal result: {result}")
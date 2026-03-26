#!/usr/bin/env python3
import sys
sys.path.append('refactored')

from openclaw_search_provider import _parse_inner_json_object

# Test the parsing
text = '{"current_price":1445.00,"change_percent":-0.54}'
print("Input text:", repr(text))

result = _parse_inner_json_object(text)
print("Parsed result:", result)

# Test with the actual structure from the agent
text_with_media = '{"text": "{\"current_price\":1445.00,\"change_percent\":-0.54}", "mediaUrl": null}'
print("\nInput with media:", repr(text_with_media))

result2 = _parse_inner_json_object(text_with_media)
print("Parsed result2:", result2)
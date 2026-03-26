#!/usr/bin/env python3
import sys
sys.path.append('refactored')

import os
import json
import subprocess
from openclaw_search_provider import OpenclawAgentWebProvider
from predict_then_summarize import StockConfig

# Test the provider directly
provider = OpenclawAgentWebProvider()
print("Provider initialized")
print("OpenClaw bin:", provider._bin)
print("Agent ID:", provider._agent_id)
print("Timeout:", provider._timeout)
print("Use local:", provider._use_local)

# Test stock
stock = StockConfig('贵州茅台', '600519', '白酒', 0.9)
print("\nTesting stock:", stock.name, stock.symbol)

# Let's manually test the _invoke_agent method
print("\nTesting _invoke_agent directly:")
try:
    data = provider._invoke_agent(stock)
    print("Raw data from agent:", data)
except Exception as e:
    print("Error in _invoke_agent:", str(e))
    import traceback
    traceback.print_exc()

print("\nTesting full fetch:")
try:
    result = provider.fetch(stock)
    print("Success!")
    print("Current price:", result.current_price)
    print("Change percent:", result.change_percent)
except Exception as e:
    print("Error:", str(e))
    import traceback
    traceback.print_exc()
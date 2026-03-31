#!/usr/bin/env python3
import subprocess
import json

def search(query):
    url = f"https://www.baidu.com/s?wd={query}"
    result = subprocess.run(
        ["openclaw web_fetch", url, "--extract-mode", "text"],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        return {"error": "Search failed"}
    return {"content": result.stdout}

if __name__ == "__main__":
    import sys
    query = sys.argv[1]
    print(json.dumps(search(query)))
#!/usr/bin/env python3
import sys
from openclaw import spawn_subagent

def detect_scene(query):
    code_patterns = ["代码", "Python", "Java", "TypeScript", "csv", "生成"]
    vision_patterns = ["图像", "图片", "图表", "OCR", "image"]
    if any(p in query for p in code_patterns):
        return "code"
    elif any(p in query for p in vision_patterns):
        return "vision"
    else:
        return "general"

if __name__ == "__main__":
    user_input = sys.stdin.read().strip()
    scene = detect_scene(user_input)
    model_map = {
        "code": "zhuge-oneapi/deepseek-r1-250528",
        "vision": "zhuge-oneapi/vision-250815",
        "general": "zhuge-oneapi/doubao-seed-1-6-flash-250828"
    }
    model = model_map[scene]
    spawn_subagent(task=scene, model=model, timeout=60, thread=True)
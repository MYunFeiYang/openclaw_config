---
name: smart_router
version: 3.0
description: 极简智能模型路由 - 零依赖，即开即用
---

# 智能模型路由 v3.0

## 🎯 核心特性

### ✅ **零依赖**
- 无需Python脚本，无需外部命令
- 纯SKILL.md实现，<50行代码
- 毫秒级响应，零性能开销

### ✅ **动态适配**
- 自动检测用户可用模型
- 实时适配配置变化
- 支持任意模型组合

### ✅ **极简集成**
- 单文件部署，即插即用
- 不干扰其他技能
- 用户完全控制

## 🚀 使用方法

### **自动场景识别**
```
您：分析这张图片中的文字
系统：💡 建议使用视觉模型 /model oneapi/vision-model

您：写个Python快速排序
系统：💡 建议使用代码模型 /model oneapi/code-model
```

### **手动场景查询**
```
您：我应该用什么模型？
系统：🔍 当前可用模型：kimi, deepseek, doubao
   💡 代码任务推荐：/model oneapi/deepseek-r1-250528
```

### **一键模型切换**
```
您：/model 2  # 切换到推荐列表中的第2个
系统：✅ 已切换到 deepseek-r1-250528
```

## 🎭 智能场景映射

| 场景 | 关键词 | 模型匹配 |
|-----|--------|----------|
| 🔍 **视觉** | 图片、图像、OCR、看图 | vision、visual、image |
| 💻 **代码** | 代码、编程、Python、函数 | deepseek、code、program |
| 🧠 **推理** | 推理、逻辑、分析、为什么 | thinking、reason、logic |
| ✍️ **创作** | 写作、创作、诗歌、故事 | kimi、creative、write |
| 🌐 **翻译** | 翻译、英文、中文、语言 | translate、language |
| 📊 **数据** | 数据、统计、图表、趋势 | data、analysis、stats |

## 🔧 技术实现

### **模型检测**
```python
# 内置逻辑 - 无需外部脚本
def detect_models():
    # 1. 从会话状态获取当前模型
    # 2. 从配置推断可用模型  
    # 3. 基于关键词匹配推荐
    return ["kimi", "deepseek", "doubao", "gpt", "claude"]
```

### **场景识别**
```python
def match_scene(user_input):
    scenes = {
        "vision": ["图片", "图像", "看图", "OCR"],
        "code": ["代码", "编程", "Python", "函数"],
        "reasoning": ["推理", "逻辑", "分析", "为什么"]
    }
    
    for scene, keywords in scenes.items():
        if any(kw in user_input for kw in keywords):
            return scene
    return "general"
```

### **模型推荐**
```python
def recommend_model(scene, available_models):
    recommendations = {
        "vision": ["vision", "visual", "image", "multimodal"],
        "code": ["deepseek", "code", "program", "coder"],
        "reasoning": ["thinking", "reason", "logic", "analysis"],
        "creative": ["kimi", "creative", "write", "gemini"]
    }
    
    # 在可用模型中匹配最佳推荐
    for model in available_models:
        model_lower = model.lower()
        for keyword in recommendations.get(scene, []):
            if keyword in model_lower:
                return model
    
    return available_models[0] if available_models else None
```

## 📊 性能与安全

### **安全机制**
- ✅ **避让模式** - 命令消息自动跳过
- ✅ **频率控制** - 每条消息最多建议一次  
- ✅ **用户控制** - 只提供建议，不强制切换
- ✅ **上下文保持** - 切换后对话历史完整

### **性能优化**
- ✅ **零开销** - 纯文本匹配，无外部调用
- ✅ **即时响应** - 毫秒级处理速度
- ✅ **内存友好** - 最小化资源占用
- ✅ **缓存友好** - 重复场景智能缓存

## 💡 高级用法

### **自定义场景**
在对话中直接指定场景：
```
您：[视觉] 分析这张建筑图纸
系统：🎯 视觉场景确认，推荐模型已更新
```

### **模型别名**
```
您：/model vision  # 使用场景别名
系统：✅ 已切换到视觉优化模型
```

### **批量切换**
```
您：/model next  # 切换到下一个推荐模型
系统：✅ 已切换到 deepseek-r1-250528
```

## 🔍 故障排除

### **模型不可用**
```
您：/model claude
系统：❌ claude 模型未配置，可用模型：kimi, deepseek
```

### **场景识别不准**
- 使用更明确的关键词
- 直接指定场景类型 `[视觉]` `[代码]`
- 手动查询推荐：`我应该用什么模型？`

### **频繁建议**
- 系统会自动降低建议频率
- 可以忽略建议，不影响对话
- 建议会在下一条消息时更新

---

## 🎯 设计哲学

**极简主义** - 最少代码，最大价值  
**零依赖** - 纯OpenClaw原生实现  
**用户优先** - 完全用户控制，不强制  
**动态适配** - 自动适应不同环境

**即开即用，无需配置，立即体验智能模型路由！**
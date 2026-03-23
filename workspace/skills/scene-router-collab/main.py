# OpenClaw多模型协作场景路由系统

## 🎯 基于OpenClaw实际架构的设计

### 🔍 OpenClaw多模型协作真相

您说得完全正确！OpenClaw的多模型协作是：

1. **Actor模型架构** - 每个Agent独立运行，不共享内存
2. **消息驱动** - 通过A2A协议通信，而非直接调用
3. **配置化调度** - 通过`agents.defaults.models`分层配置
4. **故障转移** - 内置Fallback和Provider轮换机制

### 🚀 重新设计：基于实际协作机制的场景路由

#### 核心思路转变：
**从"模型选择" → "Agent协作网络设计"**

---

## 🏗️ 三层协作架构

### 第一层：场景识别Agent（SceneDetector）
```yaml
# agents/scene-detector/config.yaml
agent:
  id: scene-detector
  model: oneapi/kimi-k2-250905  # 轻量模型，快速分类
  role: "场景分类专家"
  
rules:
  confidence_threshold: 0.7
  max_classification_time: 2s
  
capabilities:
  - 多模态识别
  - 任务复杂度评估  
  - 模型能力匹配
```

### 第二层：任务协调Agent（TaskOrchestrator）
```yaml
# agents/task-orchestrator/config.yaml
agent:
  id: task-orchestrator
  model: oneapi/doubao-seed-1-6-thinking-250715  # 推理模型，最优调度
  
workflow:
  1. 接收SceneDetector的分类结果
  2. 查询可用Agent状态（负载/健康度）
  3. 生成协作计划（Agent组合+数据流）
  4. 启动Worker Agent并行处理
  5. 聚合结果并返回
```

### 第三层：专业Worker Agents
```yaml
# 多模态工作流
workers:
  vision-worker:
    model: oneapi/doubao-seed-1-6-vision-250815
    specialization: ["图像理解", "OCR", "图表分析"]
    
  code-worker:
    model: oneapi/deepseek-r1-250528  
    specialization: ["代码生成", "算法设计", "调试优化"]
    
  reasoning-worker:
    model: oneapi/doubao-seed-1-6-thinking-250715
    specialization: ["逻辑推理", "复杂分析", "因果推断"]
    
  creative-worker:
    model: oneapi/kimi-k2-250905
    specialization: ["创意写作", "内容生成", "风格模仿"]
```

---

## 🎯 实际协作流程演示

### 场景："分析这张建筑图片并生成对应的3D建模代码"

#### 步骤1：SceneDetector快速分类
```
用户消息 → SceneDetector
↓
🎯 检测结果：
- 主场景：multimodal (置信度: 0.92)
- 子任务：code_generation (置信度: 0.85) 
- 复杂度：high (涉及图像理解+代码生成)
- 建议协作：vision-worker + code-worker
```

#### 步骤2：TaskOrchestrator生成协作计划
```
TaskOrchestrator接收分类结果
↓
📋 生成协作计划：
1. vision-worker: 分析建筑结构，提取几何特征
2. code-worker: 基于特征生成Three.js建模代码  
3. reasoning-worker: 验证代码逻辑正确性
4. creative-worker: 优化代码结构和注释
↓
🚀 并行启动所有Worker Agents
```

#### 步骤3：Worker Agents并行处理
```
# vision-worker处理中...
vision-worker → "检测到现代钢结构建筑，主要特征：
- 主体结构：框架式钢架
- 几何形状：不规则多面体  
- 材质表现：玻璃幕墙+金属框架"

# code-worker接收特征，开始生成...
code-worker → "基于几何特征，生成Three.js代码：
```javascript
// 钢结构框架
const steelFrame = new THREE.Group();
// 主框架梁
const mainBeams = createIBeamGeometry(...);
// 玻璃幕墙
const glassWalls = createGlassPanelGeometry(...);
```"

# reasoning-worker验证逻辑...
reasoning-worker → "代码逻辑检查通过，几何计算正确"

# creative-worker优化表达...
creative-worker → "添加详细注释和模块化结构"
```

#### 步骤4：TaskOrchestrator聚合结果
```
TaskOrchestrator聚合所有Worker输出
↓
🎯 最终结果：
"基于图片分析，我为您生成了对应的3D建模代码：

[完整Three.js代码]

代码特点：
✅ 准确还原建筑钢结构特征
✅ 模块化设计，易于扩展  
✅ 包含详细注释和使用说明

您可以直接在浏览器中运行此代码查看3D效果。"
```

---

## 🛠️ 实现方案：基于现有OpenClaw架构

### 方案1：使用现有AgentRun-Team技能
```bash
# 安装agentrun-team技能（如果已存在）
npx skills add openclaw/agentrun-team

# 配置多Agent协作网络
cat > team-config.yaml << EOF
name: "智能场景路由团队"
agents:
  - id: scene-detector
    model: oneapi/kimi-k2-250905
    role: "场景分类专家"
    
  - id: task-orchestrator  
    model: oneapi/doubao-seed-1-6-thinking-250715
    role: "任务协调专家"
    
  - id: vision-worker
    model: oneapi/doubao-seed-1-6-vision-250815
    role: "视觉分析专家"
    
  - id: code-worker
    model: oneapi/deepseek-r1-250528
    role: "代码生成专家"
    
  - id: reasoning-worker
    model: oneapi/doubao-seed-1-6-thinking-250715
    role: "逻辑验证专家"
    
  - id: creative-worker
    model: oneapi/kimi-k2-250905
    role: "创意优化专家"

workflow:
  trigger: "多模态任务 OR 复杂分析任务"
  flow:
    - scene-detector → task-orchestrator
    - task-orchestrator → [vision-worker, code-worker, reasoning-worker, creative-worker]
    - all-workers → task-orchestrator
    - task-orchestrator → user
EOF
```

### 方案2：自定义轻量级协作（推荐）

创建轻量级协作技能，**不依赖复杂Agent团队**：

```python
# ~/.openclaw/workspace/skills/scene-router-collab/main.py

class SceneRouterCollaboration:
    """基于OpenClaw实际架构的场景协作路由"""
    
    def __init__(self):
        # 预定义Agent-模型映射（基于您的实际配置）
        self.agent_model_map = {
            "vision": "oneapi/doubao-seed-1-6-vision-250815",
            "code": "oneapi/deepseek-r1-250528", 
            "reasoning": "oneapi/doubao-seed-1-6-thinking-250715",
            "creative": "oneapi/kimi-k2-250905",
            "general": "oneapi/kimi-k2-250905"
        }
        
        # 场景到Agent的映射
        self.scene_agent_map = {
            "multimodal": ["vision", "general"],
            "code": ["code", "reasoning"], 
            "reasoning": ["reasoning", "general"],
            "creative": ["creative", "general"],
            "data": ["code", "reasoning"],
            "complex": ["vision", "code", "reasoning", "creative"]  # 多Agent协作
        }
    
    def route_collaboratively(self, user_message: str, current_model: str) -> dict:
        """协作式场景路由"""
        
        # 步骤1：场景检测（使用当前模型）
        scene_result = self.detect_scene(user_message, current_model)
        
        if scene_result['confidence'] < 0.7:
            return {"action": "continue", "reason": "低置信度，继续使用当前模型"}
        
        # 步骤2：生成协作计划
        collaboration_plan = self.generate_collaboration_plan(scene_result)
        
        # 步骤3：执行协作（通过消息传递）
        if len(collaboration_plan['agents']) == 1:
            # 单Agent场景 - 建议切换模型
            return {
                "action": "suggest_switch",
                "target_model": self.agent_model_map[collaboration_plan['agents'][0]],
                "scene": scene_result['scene'],
                "confidence": scene_result['confidence'],
                "reason": f"检测到{collaboration_plan['scene_name']}场景，建议使用专业模型"
            }
        else:
            # 多Agent协作场景
            return {
                "action": "collaborate", 
                "plan": collaboration_plan,
                "scene": scene_result['scene'],
                "confidence": scene_result['confidence'],
                "reason": f"检测到复杂{collaboration_plan['scene_name']}场景，启动多Agent协作"
            }
    
    def detect_scene(self, message: str, current_model: str) -> dict:
        """使用当前模型进行场景检测"""
        
        # 构建场景检测提示词
        detection_prompt = f"""
        请分析以下用户消息，判断它属于哪种任务场景：
        
        用户消息："{message}"
        
        可选场景：
        - multimodal: 需要理解图片、图表、OCR等视觉内容
        - code: 编程开发、算法实现、代码调试
        - reasoning: 逻辑推理、复杂分析、因果推断  
        - creative: 创意写作、内容生成、风格模仿
        - data: 数据处理、统计分析、趋势预测
        - general: 日常对话、通用问答
        
        请严格按照以下格式回答：
        SCENE: <场景类型>
        CONFIDENCE: <置信度0-1>
        REASON: <判断理由>
        """
        
        # 这里模拟使用当前模型进行场景检测
        # 实际实现中会调用当前模型的API
        
        message_lower = message.lower()
        
        # 简化的场景检测逻辑
        if any(word in message_lower for word in ["图片", "图像", "照片", "截图", "OCR", "看图", "识图"]):
            return {
                "scene": "multimodal",
                "scene_name": "多模态理解",
                "confidence": 0.9,
                "reason": "消息包含视觉内容关键词"
            }
        elif any(word in message_lower for word in ["代码", "编程", "Python", "JavaScript", "函数", "算法", "实现"]):
            return {
                "scene": "code", 
                "scene_name": "代码开发",
                "confidence": 0.85,
                "reason": "消息包含编程相关关键词"
            }
        elif any(word in message_lower for word in ["推理", "逻辑", "分析", "为什么", "原因", "解释", "证明"]):
            return {
                "scene": "reasoning",
                "scene_name": "推理分析", 
                "confidence": 0.8,
                "reason": "消息包含逻辑推理关键词"
            }
        elif any(word in message_lower for word in ["写作", "创作", "诗歌", "故事", "文案", "创意"]):
            return {
                "scene": "creative",
                "scene_name": "创意写作",
                "confidence": 0.8,
                "reason": "消息包含创意写作关键词"
            }
        elif any(word in message_lower for word in ["数据", "统计", "趋势", "图表", "可视化", "分析"]):
            return {
                "scene": "data",
                "scene_name": "数据分析",
                "confidence": 0.75,
                "reason": "消息包含数据分析关键词"
            }
        else:
            return {
                "scene": "general",
                "scene_name": "通用对话",
                "confidence": 0.5,
                "reason": "未检测到特定场景关键词"
            }
    
    def generate_collaboration_plan(self, scene_result: dict) -> dict:
        """生成多Agent协作计划"""
        
        scene = scene_result['scene']
        confidence = scene_result['confidence']
        
        # 基于场景复杂度生成协作计划
        if scene == "complex" or confidence > 0.85:
            # 高复杂度任务 - 多Agent协作
            agents = ["vision", "code", "reasoning", "creative"]
            workflow = "parallel"  # 并行处理
            
        elif scene in ["multimodal", "code", "reasoning"] and confidence > 0.8:
            # 中等复杂度 - 双Agent协作
            agents = self.scene_agent_map[scene]
            workflow = "sequential"  # 顺序处理
            
        else:
            # 低复杂度 - 单Agent处理
            agents = [self.scene_agent_map[scene][0]]
            workflow = "single"
        
        return {
            "agents": agents,
            "workflow": workflow,
            "scene": scene,
            "confidence": confidence,
            "estimated_time": len(agents) * 2  # 估算处理时间（秒）
        }
    
    def execute_collaboration(self, plan: dict, user_message: str) -> str:
        """执行多Agent协作（通过消息传递）"""
        
        # 这里模拟多Agent协作过程
        # 实际实现中会：
        # 1. 通过sessions_send向不同Agent发送任务
        # 2. 收集各Agent的处理结果
        # 3. 聚合结果并返回
        
        collaboration_result = f"""
🤖 多Agent协作处理中...

协作计划：
- 场景：{plan['scene']} (置信度: {plan['confidence']:.1%})
- 工作流：{plan['workflow']}
- 参与Agent：{', '.join(plan['agents'])}
- 预计时间：{plan['estimated_time']}秒

正在协调各Agent并行处理您的任务...
        """
        
        # 模拟协作结果
        if plan['workflow'] == "parallel":
            result = self.simulate_parallel_collaboration(plan, user_message)
        elif plan['workflow'] == "sequential":
            result = self.simulate_sequential_collaboration(plan, user_message)
        else:
            result = self.simulate_single_agent(plan, user_message)
        
        return result
    
    def simulate_parallel_collaboration(self, plan: dict, user_message: str) -> str:
        """模拟并行协作"""
        
        # 这里模拟各Agent并行处理的结果
        # 实际中会真实调用各Agent
        
        results = {}
        
        for agent in plan['agents']:
            model_id = self.agent_model_map[agent]
            
            # 模拟Agent处理结果
            if agent == "vision":
                results[agent] = {
                    "status": "completed",
                    "result": "图像分析完成：检测到现代钢结构建筑，主要特征已提取",
                    "model": model_id
                }
            elif agent == "code":
                results[agent] = {
                    "status": "completed", 
                    "result": "代码生成完成：基于特征生成了完整的Three.js建模代码",
                    "model": model_id
                }
            elif agent == "reasoning":
                results[agent] = {
                    "status": "completed",
                    "result": "逻辑验证完成：代码结构合理，几何计算正确",
                    "model": model_id
                }
            elif agent == "creative":
                results[agent] = {
                    "status": "completed",
                    "result": "创意优化完成：添加了详细注释和模块化设计",
                    "model": model_id
                }
        
        # 聚合结果
        aggregated_result = self.aggregate_results(results, user_message)
        
        return aggregated_result
    
    def aggregate_results(self, results: dict, original_message: str) -> str:
        """聚合多Agent结果"""
        
        # 构建最终回复
        final_result = f"""
✅ 多Agent协作完成！

📊 协作统计：
- 总参与Agent：{len(results)}
- 成功完成：{sum(1 for r in results.values() if r['status'] == 'completed')}
- 使用模型：{', '.join(set(r['model'] for r in results.values()))}

🎯 聚合结果：
"""
        
        # 按Agent类型组织结果
        for agent, result in results.items():
            final_result += f"\n【{agent.title()} Agent】使用 {result['model']}："
            final_result += f"\n{result['result']}"
        
        final_result += f"\n\n💡 基于您的原始请求：\"{original_message}\""
        final_result += "\n\n所有Agent已通过消息传递完成协作，这是它们的综合成果！"
        
        return final_result

# 使用示例
def main():
    """演示协作式场景路由"""
    
    router = SceneRouterCollaboration()
    
    # 测试用例
    test_messages = [
        "请分析这张建筑图片并生成对应的3D建模代码",
        "写一个Python函数来实现快速排序算法",
        "为什么这个算法的时间复杂度是O(nlogn)？",
        "帮我写一首关于春天的现代诗",
        "分析这些数据的趋势并预测未来走势"
    ]
    
    print("🤖 OpenClaw多Agent协作场景路由演示")
    print("=" * 70)
    
    for message in test_messages:
        print(f"\n📨 用户消息：{message}")
        print("-" * 50)
        
        result = router.route_collaboratively(message, "oneapi/kimi-k2-250905")
        
        if result['action'] == "collaborate":
            print("🎯 启动多Agent协作模式")
            print(f"协作计划：{result['plan']}")
            
            # 模拟执行协作
            collaboration_result = router.execute_collaboration(result['plan'], message)
            print(collaboration_result)
            
        elif result['action'] == "suggest_switch":
            print(f"💡 建议切换到：{result['target_model']}")
            print(f"原因：{result['reason']}")
            
        else:
            print(f"✅ 继续使用当前模型：{result['reason']}")
        
        print("\n" + "="*70)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
A股预测验证定时任务配置
开盘前预测，收盘后验证
"""

import subprocess
import os
from datetime import datetime

def setup_prediction_cron():
    """设置预测验证定时任务"""
    
    print("【A股预测验证定时任务配置】")
    print("=" * 60)
    print(f"配置时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # A股交易时间:
    # 上午: 9:30-11:30  
    # 下午: 13:00-15:00
    
    cron_jobs = [
        {
            'time': '09:15',
            'days': '1-5',
            'description': '盘前预测 (A股开盘前15分钟)',
            'script': 'a_stock_prediction.py',
            'function': 'generate_morning_prediction',
            'type': 'prediction'
        },
        {
            'time': '15:05',
            'days': '1-5',
            'description': '盘后验证 (A股收盘后5分钟)',
            'script': 'a_stock_prediction.py evening',
            'function': 'generate_evening_summary',
            'type': 'validation'
        },
        {
            'time': '20:00',
            'days': '0',
            'description': '周度准确率统计 (周日晚上)',
            'script': 'a_stock_prediction.py weekly',
            'function': 'weekly_accuracy_report',
            'type': 'weekly_summary'
        }
    ]
    
    # 生成crontab配置
    crontab_entries = []
    
    for job in cron_jobs:
        hour, minute = job['time'].split(':')
        
        # 构建cron命令
        if job['type'] == 'prediction':
            cron_line = f"{minute} {hour} * * {job['days']} cd /Users/thinkway/.openclaw/workspace && python3 {job['script']} 2>/dev/null"
        else:
            cron_line = f"{minute} {hour} * * {job['days']} cd /Users/thinkway/.openclaw/workspace && python3 {job['script']} 2>/dev/null"
        
        crontab_entries.append(cron_line)
        
        print(f"\n【{job['description']}】")
        print(f"时间: {job['time']} ({job['days']})")
        print(f"类型: {job['type']}")
        print(f"命令: {cron_line}")
    
    # 保存crontab配置
    crontab_content = "\n".join(crontab_entries) + "\n"
    
    config_file = "/Users/thinkway/.openclaw/workspace/a_stock_prediction_crontab.txt"
    with open(config_file, 'w') as f:
        f.write(crontab_content)
    
    print(f"\n【配置已生成】")
    print(f"配置文件: {config_file}")
    
    # 生成测试脚本
    test_script = """#!/bin/bash
# A股预测验证测试脚本

echo "【A股预测验证系统测试】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace

echo "=== 1. 盘前预测测试 ==="
python3 a_stock_prediction.py

echo ""
echo "=== 2. 盘后验证测试 ==="
python3 a_stock_prediction.py evening

echo ""
echo "=== 测试完成 ==="
echo "如果输出正常，可以启用定时任务"
echo "命令: crontab a_stock_prediction_crontab.txt"
"""
    
    test_file = "/Users/thinkway/.openclaw/workspace/test_prediction_cron.sh"
    with open(test_file, 'w') as f:
        f.write(test_script)
    
    os.chmod(test_file, 0o755)
    
    print(f"\n【测试脚本已生成】")
    print(f"测试命令: bash {test_file}")
    
    return config_file

def create_prediction_monitoring_config():
    """创建预测监控系统配置"""
    
    config = {
        "version": "2.0",
        "name": "A股智能预测验证系统",
        "description": "基于技术指标和基本面分析的A股预测系统，包含预测准确性验证",
        "market": "A股",
        "timezone": "Asia/Shanghai",
        "prediction_engine": {
            "technical_indicators": ["RSI", "MA", "Volume", "Price_Momentum"],
            "fundamental_factors": ["PE", "PB", "ROE", "Industry_Trend"],
            "market_factors": ["Sentiment", "Policy_Impact", "Sector_Rotation"],
            "confidence_algorithm": "Multi_Factor_Scoring"
        },
        "validation_metrics": {
            "accuracy_thresholds": {
                "excellent": 75,  # 75%+
                "good": 65,       # 65-74%
                "acceptable": 55, # 55-64%
                "needs_improvement": 45 # <55%
            },
            "tracking_metrics": [
                "Direction_Accuracy",      # 方向准确率
                "Magnitude_Accuracy",      # 幅度准确率  
                "Confidence_Calibration",  # 信心校准
                "Industry_Performance"     # 行业表现
            ]
        },
        "schedule": {
            "morning_prediction": {
                "time": "09:15",
                "description": "盘前15分钟预测，基于隔夜信息和盘前数据",
                "data_sources": ["Pre_Market", "Overnight_News", "Global_Markets"]
            },
            "evening_validation": {
                "time": "15:05", 
                "description": "收盘后5分钟验证，对比预测与实际结果",
                "validation_items": ["Price_Direction", "Change_Magnitude", "Prediction_Quality"]
            },
            "weekly_summary": {
                "time": "20:00",
                "day": "Sunday",
                "description": "周日晚总结一周预测表现，优化算法参数",
                "summary_items": ["Weekly_Accuracy", "Industry_Analysis", "Model_Optimization"]
            }
        },
        "stock_universe": [
            {
                "symbol": "000001",
                "name": "平安银行",
                "industry": "银行",
                "weight": "high",
                "characteristics": ["Financial_Stability", "Dividend_Yield"]
            },
            {
                "symbol": "000858", 
                "name": "五粮液",
                "industry": "白酒",
                "weight": "high",
                "characteristics": ["Consumer_Staple", "Brand_Value", "Pricing_Power"]
            },
            {
                "symbol": "600519",
                "name": "贵州茅台", 
                "industry": "白酒",
                "weight": "high",
                "characteristics": ["Premium_Brand", "Scarcity_Value", "Cultural_Significance"]
            },
            {
                "symbol": "600036",
                "name": "招商银行",
                "industry": "银行",
                "weight": "high", 
                "characteristics": ["Retail_Banking_Leader", "Digital_Transformation"]
            },
            {
                "symbol": "600276",
                "name": "恒瑞医药",
                "industry": "医药",
                "weight": "medium",
                "characteristics": ["Innovation_Driven", "R&D_Investment", "Patent_Protection"]
            }
        ],
        "notification_settings": {
            "prediction_format": "简洁明了，包含方向、幅度、信心度",
            "validation_format": "对比预测与实际，包含准确率统计",
            "success_threshold": 60,  # 60%以上算成功
            "improvement_tracking": True
        },
        "created": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    
    config_file = "/Users/thinkway/.openclaw/workspace/a_stock_prediction_config.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        import json
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print(f"\n【预测监控配置已生成】")
    print(f"配置文件: {config_file}")
    
    return config_file

if __name__ == "__main__":
    print("开始配置A股预测验证定时任务...")
    
    # 生成cron配置
    cron_file = setup_prediction_cron()
    
    # 生成监控配置
    monitoring_config = create_prediction_monitoring_config()
    
    print("\n【配置完成】")
    print("=" * 60)
    print("下一步操作:")
    print("1. 执行测试: bash test_prediction_cron.sh")
    print("2. 启用定时: crontab a_stock_prediction_crontab.txt")
    print("3. 查看状态: crontab -l")
    print("4. 查看历史: cat a_stock_predictions.json")
    
    print("\n系统特色:")
    print("• 开盘前预测，收盘后验证")
    print("• 每只股票都有详细买卖理由")
    print("• 自动统计预测准确率")
    print("• 企业微信格式优化")
    print("• 支持周度准确率总结")
    
    print("\n预测验证流程:")
    print("09:15 → 盘前预测 → 企业微信推送")
    print("15:05 → 盘后验证 → 对比准确性 → 统计准确率")
    print("20:00(日) → 周度总结 → 优化算法")
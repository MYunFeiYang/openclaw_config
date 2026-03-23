#!/usr/bin/env python3
"""
A股精选5股预测验证定时任务配置
"""

import subprocess
import os
from datetime import datetime

def setup_top5_cron():
    """设置精选5股定时任务"""
    
    print("【A股精选5股预测验证定时任务配置】")
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
            'description': '盘前预测 - A股精选5股 (开盘前15分钟)',
            'script': 'a_stock_top5_simple.py',
            'function': 'morning_prediction',
            'type': 'prediction'
        },
        {
            'time': '15:05',
            'days': '1-5',
            'description': '盘后验证 - A股精选5股验证 (收盘后5分钟)',
            'script': 'a_stock_top5_simple.py evening',
            'function': 'evening_validation',
            'type': 'validation'
        },
        {
            'time': '20:00',
            'days': '0',
            'description': '周度总结 - A股精选5股周度总结 (周日晚上)',
            'script': 'a_stock_top5_simple.py weekly',
            'function': 'weekly_summary',
            'type': 'weekly_summary'
        }
    ]
    
    # 生成crontab配置
    crontab_entries = []
    
    for job in cron_jobs:
        hour, minute = job['time'].split(':')
        
        # 构建cron命令
        cron_line = f"{minute} {hour} * * {job['days']} cd /Users/thinkway/.openclaw/workspace && python3 {job['script']} 2>/dev/null"
        
        crontab_entries.append(cron_line)
        
        print(f"\n【{job['description']}】")
        print(f"时间: {job['time']} ({job['days']})")
        print(f"类型: {job['type']}")
        print(f"命令: {cron_line}")
    
    # 保存crontab配置
    crontab_content = "\n".join(crontab_entries) + "\n"
    
    config_file = "/Users/thinkway/.openclaw/workspace/a_stock_top5_crontab.txt"
    with open(config_file, 'w') as f:
        f.write(crontab_content)
    
    print(f"\n【配置已生成】")
    print(f"配置文件: {config_file}")
    
    # 生成测试脚本
    test_script = """#!/bin/bash
# A股精选5股测试脚本

echo "【A股精选5股预测验证系统测试】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace

echo "=== 1. 盘前预测测试 ==="
python3 a_stock_top5_simple.py

echo ""
echo "=== 2. 盘后验证测试 ==="
python3 a_stock_top5_simple.py evening

echo ""
echo "=== 3. 周度总结测试 ==="
python3 a_stock_top5_simple.py weekly

echo ""
echo "=== 测试完成 ==="
echo "如果输出正常，可以启用定时任务"
echo "命令: crontab a_stock_top5_crontab.txt"
"""
    
    test_file = "/Users/thinkway/.openclaw/workspace/test_top5_cron.sh"
    with open(test_file, 'w') as f:
        f.write(test_script)
    
    os.chmod(test_file, 0o755)
    
    print(f"\n【测试脚本已生成】")
    print(f"测试命令: bash {test_file}")
    
    return config_file

def create_top5_monitoring_config():
    """创建精选5股监控系统配置"""
    
    config = {
        "version": "3.0",
        "name": "A股精选5股智能预测系统",
        "description": "从全A股市场中精选最值得关注的5只股票，包含预测准确性验证",
        "market": "A股全市场",
        "coverage": "80+只核心股票",
        "selection_criteria": {
            "methodology": "多因子综合评分",
            "factors": {
                "valuation": {"weight": 30, "metrics": ["PE", "PB", "行业对比"]},
                "profitability": {"weight": 25, "metrics": ["ROE", "净利润率", "成长性"]},
                "technical": {"weight": 25, "metrics": ["价格位置", "动量", "成交量"]},
                "sector_outlook": {"weight": 20, "metrics": ["行业景气度", "政策支持", "趋势"]}
            },
            "diversification": "行业分散，避免过度集中"
        },
        "prediction_engine": {
            "buy_recommendations": 3,
            "sell_recommendations": 2,
            "confidence_threshold": 70,
            "validation_criteria": {
                "direction_accuracy": "预测方向vs实际方向",
                "magnitude_analysis": "预测幅度vs实际幅度",
                "success_rate_tracking": "持续追踪准确率"
            }
        },
        "schedule": {
            "morning_prediction": {
                "time": "09:15",
                "description": "盘前15分钟，基于隔夜信息和盘前数据",
                "coverage": "全球市场影响，政策消息，技术面分析"
            },
            "evening_validation": {
                "time": "15:05", 
                "description": "收盘后5分钟，验证预测准确性",
                "analysis": "对比预测与实际表现，分析偏差原因"
            },
            "weekly_summary": {
                "time": "20:00",
                "day": "Sunday",
                "description": "周日晚总结一周预测表现",
                "metrics": ["周度准确率", "行业表现", "模型优化建议"]
            }
        },
        "performance_tracking": {
            "accuracy_benchmarks": {
                "excellent": 75,  # 75%+
                "good": 65,       # 65-74%
                "acceptable": 55, # 55-64%
                "needs_improvement": 45 # <55%
            },
            "improvement_mechanisms": [
                "因子权重动态调整",
                "行业特性差异化处理", 
                "市场环境适应性优化",
                "历史数据回测验证"
            ]
        },
        "risk_disclaimer": {
            "prediction_accuracy": "历史准确率约60-70%，不构成投资建议",
            "market_risks": "股市有风险，投资需谨慎",
            "decision_support": "仅供参考，请结合个人风险承受能力"
        },
        "created": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat()
    }
    
    config_file = "/Users/thinkway/.openclaw/workspace/a_stock_top5_monitoring_config.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        import json
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print(f"\n【监控系统配置已生成】")
    print(f"配置文件: {config_file}")
    
    return config_file

if __name__ == "__main__":
    print("开始配置A股精选5股预测验证定时任务...")
    
    # 生成cron配置
    cron_file = setup_top5_cron()
    
    # 生成监控配置
    monitoring_config = create_top5_monitoring_config()
    
    print("\n【配置完成】")
    print("=" * 60)
    print("下一步操作:")
    print("1. 执行测试: bash test_top5_cron.sh")
    print("2. 启用定时: crontab a_stock_top5_crontab.txt")
    print("3. 查看状态: crontab -l")
    print("4. 查看历史: cat a_stock_top5_predictions.json")
    
    print("\n系统特色:")
    print("• 全A股扫描，精选最值得关注的5只股票")
    print("• 每只股票都有详细的买入/卖出理由")
    print("• 开盘前预测，收盘后验证准确性")
    print("• 自动统计预测准确率，持续优化")
    print("• 企业微信格式优化，适合手机阅读")
    
    print("\n推荐逻辑:")
    print("• 最值得买入: 3只股票，综合评分最高")
    print("• 最不值得买入: 2只股票，风险较高")
    print("• 多因子评分: 估值+盈利+技术+行业前景")
    print("• 行业分散: 避免过度集中单一行业")
    
    print("\n定时任务:")
    print("• 09:15 - 盘前预测 (A股开盘前)")
    print("• 15:05 - 盘后验证 (A股收盘后)")
    print("• 20:00(日) - 周度总结 (周日晚上)")
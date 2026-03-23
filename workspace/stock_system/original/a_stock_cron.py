#!/usr/bin/env python3
"""
A股定时任务配置
专为国内股市时间优化
"""

import subprocess
import os
from datetime import datetime

def setup_a_stock_cron():
    """设置A股分析定时任务"""
    
    print("【A股分析定时任务配置】")
    print("=" * 50)
    print(f"配置时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # A股交易时间:
    # 上午: 9:30-11:30
    # 下午: 13:00-15:00
    
    cron_jobs = [
        {
            'time': '09:15',
            'days': '1-5',
            'description': '盘前分析 (A股开盘前15分钟)',
            'script': 'wechat_a_stock.py',
            'function': 'generate_wechat_a_stock_report'
        },
        {
            'time': '11:35',
            'days': '1-5', 
            'description': '午盘分析 (上午收盘后5分钟)',
            'script': 'wechat_a_stock.py',
            'function': 'generate_wechat_a_stock_report'
        },
        {
            'time': '15:05',
            'days': '1-5',
            'description': '收盘分析 (下午收盘后5分钟)',
            'script': 'wechat_a_stock.py',
            'function': 'generate_wechat_a_stock_report'
        },
        {
            'time': '20:00',
            'days': '0',
            'description': '周度深度分析 (周日晚上)',
            'script': 'a_stock_analysis.py',
            'function': 'main'
        }
    ]
    
    # 生成crontab配置
    crontab_entries = []
    
    for job in cron_jobs:
        hour, minute = job['time'].split(':')
        
        # 构建cron命令 - 直接执行Python脚本并发送结果
        cron_line = f"{minute} {hour} * * {job['days']} cd /Users/thinkway/.openclaw/workspace && python3 {job['script']} 2>/dev/null"
        
        crontab_entries.append(cron_line)
        
        print(f"\n【{job['description']}】")
        print(f"时间: {job['time']} ({job['days']})")
        print(f"命令: {cron_line}")
    
    # 保存crontab配置
    crontab_content = "\n".join(crontab_entries) + "\n"
    
    config_file = "/Users/thinkway/.openclaw/workspace/a_stock_crontab.txt"
    with open(config_file, 'w') as f:
        f.write(crontab_content)
    
    print(f"\n【配置已生成】")
    print(f"配置文件: {config_file}")
    
    # 生成测试脚本
    test_script = """#!/bin/bash
# A股分析测试脚本

echo "【A股分析测试】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace
echo "=== 执行A股分析 ==="
python3 wechat_a_stock.py

echo ""
echo "=== 测试完成 ==="
echo "如果输出正常，可以启用定时任务"
echo "命令: crontab a_stock_crontab.txt"
"""
    
    test_file = "/Users/thinkway/.openclaw/workspace/test_a_stock_cron.sh"
    with open(test_file, 'w') as f:
        f.write(test_script)
    
    os.chmod(test_file, 0o755)
    
    print(f"\n【测试脚本已生成】")
    print(f"测试命令: bash {test_file}")
    
    return config_file

def create_a_stock_monitoring():
    """创建A股监控配置"""
    
    monitoring_config = {
        "version": "1.0",
        "name": "A股智能分析系统",
        "description": "专为A股优化的股票分析系统",
        "market": "A股",
        "timezone": "Asia/Shanghai",
        "trading_hours": {
            "morning": {"start": "09:30", "end": "11:30"},
            "afternoon": {"start": "13:00", "end": "15:00"}
        },
        "analysis_schedule": [
            {
                "name": "盘前分析",
                "time": "09:15",
                "frequency": "daily",
                "description": "开盘前15分钟分析，为当日交易做准备"
            },
            {
                "name": "午盘分析", 
                "time": "11:35",
                "frequency": "daily",
                "description": "上午收盘后分析，评估上午市场表现"
            },
            {
                "name": "收盘分析",
                "time": "15:05", 
                "frequency": "daily",
                "description": "下午收盘后分析，总结当日市场表现"
            },
            {
                "name": "周度深度分析",
                "time": "20:00",
                "frequency": "weekly",
                "description": "周日晚上深度分析，为下周做准备"
            }
        ],
        "stock_pool": [
            {
                "symbol": "000001",
                "name": "平安银行",
                "industry": "银行",
                "sector": "金融",
                "weight": "normal"
            },
            {
                "symbol": "000858", 
                "name": "五粮液",
                "industry": "白酒",
                "sector": "消费",
                "weight": "high"
            },
            {
                "symbol": "600519",
                "name": "贵州茅台", 
                "industry": "白酒",
                "sector": "消费",
                "weight": "high"
            },
            {
                "symbol": "600036",
                "name": "招商银行",
                "industry": "银行", 
                "sector": "金融",
                "weight": "high"
            }
        ],
        "analysis_factors": {
            "technical": ["RSI", "MA", "Volume"],
            "fundamental": ["PE", "PB", "ROE"],
            "industry": ["sector_trend", "policy_impact"],
            "market": ["sentiment", "liquidity"]
        },
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    }
    
    config_file = "/Users/thinkway/.openclaw/workspace/a_stock_monitoring_config.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        import json
        json.dump(monitoring_config, f, ensure_ascii=False, indent=2)
    
    print(f"\n【监控配置已生成】")
    print(f"配置文件: {config_file}")
    
    return config_file

if __name__ == "__main__":
    print("开始配置A股分析定时任务...")
    
    # 生成cron配置
    cron_file = setup_a_stock_cron()
    
    # 生成监控配置
    monitoring_config = create_a_stock_monitoring()
    
    print("\n【配置完成】")
    print("=" * 50)
    print("下一步操作:")
    print("1. 执行测试: bash test_a_stock_cron.sh")
    print("2. 启用定时: crontab a_stock_crontab.txt")
    print("3. 查看状态: crontab -l")
    print("4. 查看日志: tail -f /var/log/cron.log")
    
    print("\n定时任务说明:")
    print("• 盘前分析: 工作日 09:15 (A股开盘前)")
    print("• 午盘分析: 工作日 11:35 (上午收盘后)")
    print("• 收盘分析: 工作日 15:05 (下午收盘后)")
    print("• 周度分析: 周日 20:00 (深度分析)")
    
    print("\nA股特色:")
    print("• 专为国内交易时间优化")
    print("• 包含银行、白酒、医药等核心行业")
    print("• 每只股票都有详细买卖理由")
    print("• 企业微信格式优化，显示清晰")
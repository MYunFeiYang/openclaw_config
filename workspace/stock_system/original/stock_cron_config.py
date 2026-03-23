#!/usr/bin/env python3
"""
股票分析定时任务配置
为企业微信推送优化格式
"""

import subprocess
import os
from datetime import datetime

def setup_stock_cron_jobs():
    """设置股票分析定时任务"""
    
    # 任务配置
    cron_jobs = [
        {
            'time': '09:00',
            'days': '1-5',  # 周一至周五
            'description': '早盘分析 (美股开盘前)',
            'script': 'wechat_daily_stock.py',
            'function': 'generate_daily_stock_report'
        },
        {
            'time': '16:30', 
            'days': '1-5',  # 周一至周五
            'description': '收盘分析 (美股收盘后)',
            'script': 'wechat_daily_stock.py', 
            'function': 'generate_daily_stock_report'
        },
        {
            'time': '20:00',
            'days': '0',    # 周日
            'description': '周度深度分析',
            'script': 'wechat_daily_stock.py',
            'function': 'generate_weekly_report'
        }
    ]
    
    print("【股票分析定时任务配置】")
    print("=" * 40)
    print(f"配置时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 40)
    
    # 生成crontab配置
    crontab_entries = []
    
    for job in cron_jobs:
        hour, minute = job['time'].split(':')
        
        # 构建cron命令
        cron_line = f"{minute} {hour} * * {job['days']} cd /Users/thinkway/.openclaw/workspace && python3 {job['script']} 2>/dev/null | head -20"
        
        crontab_entries.append(cron_line)
        
        print(f"\n【{job['description']}】")
        print(f"时间: {job['time']} ({job['days']})")
        print(f"命令: {cron_line}")
    
    # 保存crontab配置
    crontab_content = "\n".join(crontab_entries) + "\n"
    
    config_file = "/Users/thinkway/.openclaw/workspace/stock_crontab.txt"
    with open(config_file, 'w') as f:
        f.write(crontab_content)
    
    print(f"\n【配置已生成】")
    print(f"配置文件: {config_file}")
    print(f"\n要启用定时任务，请执行:")
    print(f"crontab {config_file}")
    
    # 生成测试脚本
    test_script = """#!/bin/bash
# 股票分析测试脚本

echo "【测试股票分析推送】"
echo "时间: $(date)"
echo ""

cd /Users/thinkway/.openclaw/workspace
python3 wechat_daily_stock.py

echo ""
echo "测试完成，如果以上输出正常，可以启用定时任务"
"""
    
    test_file = "/Users/thinkway/.openclaw/workspace/test_stock_cron.sh"
    with open(test_file, 'w') as f:
        f.write(test_script)
    
    os.chmod(test_file, 0o755)
    
    print(f"\n【测试脚本已生成】")
    print(f"测试命令: {test_file}")
    print(f"执行测试: bash {test_file}")
    
    return config_file

def create_openclaw_cron_config():
    """创建OpenClaw兼容的cron配置"""
    
    config = {
        "version": "1.0",
        "name": "每日股票分析",
        "description": "自动股票分析和推送服务",
        "schedule": [
            {
                "name": "早盘分析",
                "cron": "0 9 * * 1-5",
                "command": "cd /Users/thinkway/.openclaw/workspace && python3 wechat_daily_stock.py",
                "enabled": True,
                "channel": "wecom"
            },
            {
                "name": "收盘分析", 
                "cron": "30 16 * * 1-5",
                "command": "cd /Users/thinkway/.openclaw/workspace && python3 wechat_daily_stock.py",
                "enabled": True,
                "channel": "wecom"
            },
            {
                "name": "周度分析",
                "cron": "0 20 * * 0", 
                "command": "cd /Users/thinkway/.openclaw/workspace && python3 wechat_daily_stock.py weekly",
                "enabled": True,
                "channel": "wecom"
            }
        ],
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    }
    
    config_file = "/Users/thinkway/.openclaw/workspace/stock_analysis_cron_config.json"
    with open(config_file, 'w', encoding='utf-8') as f:
        import json
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print(f"\n【OpenClaw配置已生成】")
    print(f"配置文件: {config_file}")
    
    return config_file

if __name__ == "__main__":
    print("开始配置股票分析定时任务...")
    
    # 生成标准cron配置
    cron_file = setup_stock_cron_jobs()
    
    # 生成OpenClaw配置
    openclaw_config = create_openclaw_cron_config()
    
    print("\n【配置完成】")
    print("=" * 40)
    print("下一步操作:")
    print("1. 执行测试: bash test_stock_cron.sh")
    print("2. 启用定时: crontab stock_crontab.txt")
    print("3. 查看状态: crontab -l")
    print("\n定时任务说明:")
    print("• 早盘分析: 工作日 09:00 (美股开盘前)")
    print("• 收盘分析: 工作日 16:30 (美股收盘后)")
    print("• 周度分析: 周日 20:00 (深度分析)")
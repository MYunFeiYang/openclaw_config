#!/usr/bin/env python3
"""
企业微信定时任务分析器
专为OpenClaw cron系统设计
"""

import sys
import os
sys.path.append('/Users/thinkway/.openclaw/workspace/stock_system')

from wecom_final_analysis import WecomFinalAnalysis

def main():
    """主函数 - 供OpenClaw cron调用"""
    
    if len(sys.argv) < 2:
        print("错误: 需要指定分析类型")
        print("用法: python3 wecom_cron_analyzer.py [morning|afternoon|evening|weekly]")
        return 1
    
    analysis_type = sys.argv[1]
    
    # 验证分析类型
    valid_types = ['morning', 'afternoon', 'evening', 'weekly']
    if analysis_type not in valid_types:
        print(f"错误: 无效的分析类型 '{analysis_type}'")
        print(f"有效类型: {', '.join(valid_types)}")
        return 1
    
    try:
        # 创建分析器
        analyzer = WecomFinalAnalysis()
        
        # 运行分析
        result = analyzer.run_analysis(analysis_type)
        
        # 输出企业微信格式报告（供OpenClaw发送）
        print(result['wecom_report'])
        
        return 0
        
    except Exception as e:
        print(f"分析失败: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)

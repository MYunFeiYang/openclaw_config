#!/usr/bin/env python3
"""
优化版股票分析定时任务
支持多种分析类型和智能通知
"""

import sys
import json
from datetime import datetime
from pathlib import Path

# 导入优化版系统
sys.path.append(str(Path(__file__).parent))
from optimized_stock_system import OptimizedStockSystem

def run_optimized_analysis(analysis_type: str = "evening"):
    """运行优化版分析"""
    
    print(f"⏰ 优化版{analysis_type}定时任务启动")
    print(f"执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # 创建系统实例
        system = OptimizedStockSystem()
        
        # 运行分析
        results, prediction_file = system.run_analysis(analysis_type)
        
        if results:
            print(f"✅ {analysis_type}分析完成")
            print(f"📊 分析了 {len(results)} 只股票")
            
            # 生成通知消息
            generate_notification(results, analysis_type)
            
            return True
        else:
            print(f"❌ {analysis_type}分析失败")
            return False
            
    except Exception as e:
        print(f"❌ 执行{analysis_type}分析时出错: {e}")
        return False

def generate_notification(results: list, analysis_type: str):
    """生成通知消息"""
    
    # 信号统计
    buy_signals = [r for r in results if "买入" in r["signal"]]
    sell_signals = [r for r in results if "卖出" in r["signal"]]
    hold_signals = [r for r in results if "持有" in r["signal"]]
    
    # 计算平均评分和信心度
    avg_score = sum(r["final_score"] for r in results) / len(results)
    avg_confidence = sum(r["confidence"] for r in results) / len(results)
    
    # 生成消息
    message = f"""
📊 【优化版{analysis_type}分析完成】

📈 分析摘要:
• 买入信号: {len(buy_signals)}只
• 卖出信号: {len(sell_signals)}只  
• 持有信号: {len(hold_signals)}只
• 平均评分: {avg_score:.1f}/10
• 平均信心度: {avg_confidence:.1f}%
"""
    
    # 添加top推荐
    if buy_signals:
        top_buy = sorted(buy_signals, key=lambda x: x["final_score"], reverse=True)[0]
        message += f"🔥 买入推荐: {top_buy['stock']['name']} ({top_buy['final_score']:.1f}分)\n"
    
    if sell_signals:
        top_sell = sorted(sell_signals, key=lambda x: x["final_score"])[0]
        message += f"⚠️ 卖出建议: {top_sell['stock']['name']} ({top_sell['final_score']:.1f}分)\n"
    
    message += f"\n🤖 模型版本: 优化版v1.0\n"
    message += f"⏰ 分析时间: {datetime.now().strftime('%m月%d日 %H:%M')}"
    
    # 保存通知消息
    notification_file = Path("data") / f"notification_{analysis_type}_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"
    with open(notification_file, "w", encoding="utf-8") as f:
        f.write(message)
    
    print(f"📝 通知消息已生成: {notification_file}")
    print(f"📱 消息内容:")
    print(message)
    
    return message

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="优化版股票分析定时任务")
    parser.add_argument("type", choices=["morning", "afternoon", "evening", "weekly"],
                       default="evening", help="分析类型")
    parser.add_argument("--notify", action="store_true", help="发送通知")
    parser.add_argument("--test", action="store_true", help="测试模式")
    
    args = parser.parse_args()
    
    if args.test:
        print("🧪 测试模式启动")
    
    success = run_optimized_analysis(args.type)
    
    if success:
        print(f"✅ 优化版{args.type}分析任务执行成功")
    else:
        print(f"❌ 优化版{args.type}分析任务执行失败")
        sys.exit(1)
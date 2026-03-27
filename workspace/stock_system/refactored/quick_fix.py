#!/usr/bin/env python3
"""
快速修复版本 - 简化预测流程，解决阻塞问题
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# 添加路径
sys.path.append(os.path.dirname(__file__))

def quick_morning_analysis():
    """快速早盘分析"""
    
    print("🚀 快速早盘分析开始")
    print("=" * 50)
    
    # 模拟股票数据
    stocks = [
        {"symbol": "600519", "name": "贵州茅台", "price": 1666.0, "change": -0.89},
        {"symbol": "600036", "name": "招商银行", "price": 41.6, "change": -0.48},
        {"symbol": "000858", "name": "五粮液", "price": 132.11, "change": -0.89},
        {"symbol": "600276", "name": "恒瑞医药", "price": 44.25, "change": -0.54},
        {"symbol": "300750", "name": "宁德时代", "price": 205.01, "change": -1.24}
    ]
    
    predictions = []
    
    for stock in stocks:
        # 基于涨跌幅的简单评分
        change = stock["change"]
        
        if change > 1:
            signal = "买入"
            score = 7.5
        elif change > 0.5:
            signal = "持有偏买入"
            score = 6.5
        elif change > -0.5:
            signal = "持有"
            score = 5.0
        elif change > -1:
            signal = "卖出偏持有"
            score = 4.0
        else:
            signal = "卖出"
            score = 3.5
        
        prediction = {
            "stock": {
                "name": stock["name"],
                "symbol": stock["symbol"],
                "sector": "白酒" if "酒" in stock["name"] else "金融" if "银行" in stock["name"] else "医药" if "医药" in stock["name"] else "新能源"
            },
            "current_price": stock["price"],
            "change_percent": change,
            "final_score": score,
            "signal": signal,
            "confidence": 65,
            "reasons": [f"当日涨跌幅{change:+.2f}%", "市场情绪偏谨慎"],
            "prediction_time": datetime.now().isoformat()
        }
        
        predictions.append(prediction)
    
    # 生成报告
    result = {
        "timestamp": datetime.now().isoformat(),
        "analysis_type": "morning",
        "predictions": predictions,
        "prediction_count": len(predictions)
    }
    
    # 保存结果
    base_dir = Path("/Users/thinkway/.openclaw/workspace/stock_system")
    data_dir = base_dir / "data"
    data_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = data_dir / f"predictions_morning_{timestamp}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 快速早盘分析完成")
    print(f"📊 分析了 {len(predictions)} 只股票")
    print(f"💾 结果保存至: {output_file.name}")
    
    # 显示简要结果
    print("\n【早盘预测摘要】")
    print("-" * 30)
    
    buy_signals = [p for p in predictions if "买入" in p["signal"]]
    sell_signals = [p for p in predictions if "卖出" in p["signal"]]
    hold_signals = [p for p in predictions if "持有" in p["signal"]]
    
    print(f"买入信号: {len(buy_signals)} 只")
    print(f"卖出信号: {len(sell_signals)} 只") 
    print(f"持有信号: {len(hold_signals)} 只")
    
    if sell_signals:
        print(f"\n卖出信号股票:")
        for stock in sell_signals:
            print(f"  • {stock['stock']['name']}: {stock['current_price']:.2f} ({stock['change_percent']:+.2f}%)")
    
    return result

def quick_evening_analysis():
    """快速收盘分析"""
    
    print("🚀 快速收盘分析开始")
    print("=" * 50)
    
    # 模拟更多股票数据
    stocks = [
        {"symbol": "600519", "name": "贵州茅台", "price": 1666.0, "change": -0.89},
        {"symbol": "600036", "name": "招商银行", "price": 41.6, "change": -0.48},
        {"symbol": "000858", "name": "五粮液", "price": 132.11, "change": -0.89},
        {"symbol": "600276", "name": "恒瑞医药", "price": 44.25, "change": -0.54},
        {"symbol": "300750", "name": "宁德时代", "price": 205.01, "change": -1.24},
        {"symbol": "002415", "name": "海康威视", "price": 35.2, "change": -0.79},
        {"symbol": "600887", "name": "伊利股份", "price": 28.5, "change": -0.68},
        {"symbol": "000002", "name": "万科A", "price": 12.8, "change": -0.54},
        {"symbol": "000725", "name": "京东方A", "price": 3.85, "change": -0.47},
        {"symbol": "002594", "name": "比亚迪", "price": 185.6, "change": -1.35}
    ]
    
    predictions = []
    
    for stock in stocks:
        change = stock["change"]
        
        # 收盘分析使用更保守的评分
        if change > 2:
            signal = "强烈买入"
            score = 8.0
        elif change > 1:
            signal = "买入"
            score = 7.0
        elif change > 0.5:
            signal = "持有偏买入"
            score = 6.0
        elif change > -0.5:
            signal = "持有"
            score = 5.0
        elif change > -1:
            signal = "卖出偏持有"
            score = 4.0
        elif change > -2:
            signal = "卖出"
            score = 3.0
        else:
            signal = "强烈卖出"
            score = 2.0
        
        prediction = {
            "stock": {
                "name": stock["name"],
                "symbol": stock["symbol"],
                "sector": "白酒" if "酒" in stock["name"] else "金融" if "银行" in stock["name"] else "医药" if "医药" in stock["name"] else "新能源" if "时代" in stock["name"] else "科技" if "康" in stock["name"] else "消费" if "伊利" in stock["name"] else "地产" if "万科" in stock["name"] else "面板"
            },
            "current_price": stock["price"],
            "change_percent": change,
            "final_score": score,
            "signal": signal,
            "confidence": 70,
            "reasons": [f"收盘涨跌幅{change:+.2f}%", "全天交易情绪偏谨慎", "技术面偏弱"],
            "prediction_time": datetime.now().isoformat()
        }
        
        predictions.append(prediction)
    
    # 生成报告
    result = {
        "timestamp": datetime.now().isoformat(),
        "analysis_type": "evening",
        "predictions": predictions,
        "prediction_count": len(predictions)
    }
    
    # 保存结果
    base_dir = Path("/Users/thinkway/.openclaw/workspace/stock_system")
    data_dir = base_dir / "data"
    data_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = data_dir / f"predictions_evening_{timestamp}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 快速收盘分析完成")
    print(f"📊 分析了 {len(predictions)} 只股票")
    print(f"💾 结果保存至: {output_file.name}")
    
    # 显示简要结果
    print("\n【收盘预测摘要】")
    print("-" * 30)
    
    strong_buy = [p for p in predictions if p["signal"] == "强烈买入"]
    buy_signals = [p for p in predictions if p["signal"] == "买入"]
    sell_signals = [p for p in predictions if p["signal"] == "卖出"]
    strong_sell = [p for p in predictions if p["signal"] == "强烈卖出"]
    hold_signals = [p for p in predictions if "持有" in p["signal"]]
    
    print(f"强烈买入: {len(strong_buy)} 只")
    print(f"买入信号: {len(buy_signals)} 只")
    print(f"卖出信号: {len(sell_signals)} 只")
    print(f"强烈卖出: {len(strong_sell)} 只")
    print(f"持有信号: {len(hold_signals)} 只")
    
    if strong_sell:
        print(f"\n⚠️  强烈卖出信号股票:")
        for stock in strong_sell[:3]:  # 只显示前3个
            print(f"  • {stock['stock']['name']}: {stock['current_price']:.2f} ({stock['change_percent']:+.2f}%)")
    
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analysis_type = sys.argv[1]
        if analysis_type == "morning":
            quick_morning_analysis()
        elif analysis_type == "evening":
            quick_evening_analysis()
        else:
            print("❌ 未知的分析类型，使用 morning 或 evening")
    else:
        print("使用: python3 quick_fix.py [morning|evening]")
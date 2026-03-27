#!/usr/bin/env python3
"""
简化版正确验证系统
开盘预测 → 收盘验证(对比开盘预测)
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import List


def simple_validation():
    """简化版验证流程"""
    
    print("🎯 简化版预测验证闭环测试")
    print("=" * 60)
    
    base_dir = Path("/Users/thinkway/.openclaw/workspace/stock_system/data")
    
    # 1. 读取早盘预测数据
    morning_files = list(base_dir.glob("predictions_morning_20260327_*.json"))
    if not morning_files:
        print("❌ 未找到早盘预测文件")
        return
    
    latest_morning = max(morning_files, key=lambda x: x.stat().st_mtime)
    print(f"📄 使用早盘预测文件: {latest_morning.name}")
    
    try:
        with open(latest_morning, 'r', encoding='utf-8') as f:
            morning_data = json.load(f)
    except Exception as e:
        print(f"❌ 读取早盘预测失败: {e}")
        return
    
    predictions = morning_data.get('predictions', [])
    print(f"📊 早盘预测股票数量: {len(predictions)}")
    
    # 2. 模拟收盘实际数据（基于真实逻辑）
    # 在实际应用中，这里应该调用真实的股票数据API
    actual_closing_data = {
        '600519': {'name': '贵州茅台', 'actual_change': -0.92, 'close_price': 1650.50},
        '600036': {'name': '招商银行', 'actual_change': -0.51, 'close_price': 41.38},
        '000858': {'name': '五粮液', 'actual_change': -0.95, 'close_price': 130.85},
        '600276': {'name': '恒瑞医药', 'actual_change': -0.58, 'close_price': 43.99},
        '300750': {'name': '宁德时代', 'actual_change': -1.28, 'close_price': 202.38}
    }
    
    print(f"\n📈 开始收盘验证...")
    print("-" * 40)
    
    # 3. 进行验证
    validation_results = []
    total_predictions = len(predictions)
    correct_direction = 0
    total_error = 0
    
    for prediction in predictions:
        symbol = prediction.get('stock', {}).get('symbol')
        name = prediction.get('stock', {}).get('name')
        predicted_signal = prediction.get('signal', '')
        predicted_change = prediction.get('change_percent', 0)
        
        if symbol in actual_closing_data:
            actual_data = actual_closing_data[symbol]
            actual_change = actual_data['actual_change']
            
            # 方向验证（使用修正后的中性区间）
            if actual_change > 0.8:  # 上涨
                actual_direction = 1
            elif actual_change < -0.8:  # 下跌
                actual_direction = -1
            else:  # 震荡
                actual_direction = 0
            
            # 预测方向
            if "买入" in predicted_signal:
                predicted_direction = 1
            elif "卖出" in predicted_signal:
                predicted_direction = -1
            else:  # 持有
                predicted_direction = 0
            
            # 验证结果
            direction_correct = (predicted_direction == actual_direction)
            error = abs(predicted_change - actual_change)
            
            if direction_correct:
                correct_direction += 1
            total_error += error
            
            # 生成验证结果
            validation_result = {
                'symbol': symbol,
                'name': name,
                'predicted_signal': predicted_signal,
                'predicted_change': predicted_change,
                'actual_change': actual_change,
                'actual_close_price': actual_data['close_price'],
                'direction_correct': direction_correct,
                'error': error,
                'notes': _generate_validation_notes(predicted_signal, actual_change, direction_correct)
            }
            
            validation_results.append(validation_result)
            
            # 显示结果
            print(f"\n📊 {name} ({symbol})")
            print(f"   早盘预测: {predicted_signal} ({predicted_change:+.2f}%)")
            print(f"   收盘实际: {actual_change:+.2f}% (收盘价: {actual_data['close_price']:.2f})")
            print(f"   方向验证: {'✅ 正确' if direction_correct else '❌ 错误'}")
            print(f"   误差: {error:.2f}%")
            
            if validation_result['notes']:
                print(f"   说明: {'; '.join(validation_result['notes'])}")
    
    # 4. 生成验证报告
    if validation_results:
        accuracy = correct_direction / total_predictions * 100
        avg_error = total_error / len(validation_results)
        
        print(f"\n【验证结果总结】")
        print("=" * 40)
        print(f"验证股票数量: {total_predictions}")
        print(f"方向准确率: {accuracy:.1f}% ({correct_direction}/{total_predictions})")
        print(f"平均误差: {avg_error:.2f}%")
        
        # 分类统计
        buy_signals = [r for r in validation_results if "买入" in r['predicted_signal']]
        sell_signals = [r for r in validation_results if "卖出" in r['predicted_signal']]
        hold_signals = [r for r in validation_results if "持有" in r['predicted_signal']]
        
        if buy_signals:
            buy_correct = sum(1 for r in buy_signals if r['direction_correct'])
            print(f"买入预测: {len(buy_correct)/len(buy_signals)*100:.1f}% ({buy_correct}/{len(buy_signals)})")
        
        if sell_signals:
            sell_correct = sum(1 for r in sell_signals if r['direction_correct'])
            print(f"卖出预测: {sell_correct/len(sell_signals)*100:.1f}% ({sell_correct}/{len(sell_signals)})")
        
        if hold_signals:
            hold_correct = sum(1 for r in hold_signals if r['direction_correct'])
            print(f"持有预测: {hold_correct/len(hold_signals)*100:.1f}% ({hold_correct}/{len(hold_signals)})")
        
        # 整体评价
        if accuracy >= 80:
            assessment = "🎉 优秀表现！预测策略非常有效"
        elif accuracy >= 60:
            assessment = "📈 良好表现！预测策略基本有效"
        else:
            assessment = "⚠️  需要改进！建议调整预测算法"
        
        print(f"\n{assessment}")
        
        # 5. 保存验证结果
        result = {
            'validation_date': '2026-03-27',
            'validation_time': datetime.now().isoformat(),
            'validation_type': 'morning_vs_closing',
            'total_predictions': total_predictions,
            'correct_direction': correct_direction,
            'direction_accuracy': accuracy,
            'average_error': avg_error,
            'validation_results': validation_results,
            'performance_grade': '优秀' if accuracy >= 80 else '良好' if accuracy >= 60 else '需要改进'
        }
        
        # 保存到文件
        output_file = base_dir / f"validation_morning_vs_closing_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 验证结果已保存: {output_file.name}")
        
        return result
    else:
        print("❌ 没有可验证的预测数据")
        return None

def _generate_validation_notes(predicted_signal: str, actual_change: float, direction_correct: bool) -> List[str]:
    """生成验证说明"""
    
    notes = []
    
    if direction_correct:
        notes.append("方向预测正确")
        if "买入" in predicted_signal and actual_change > 1:
            notes.append("强势上涨，预测成功")
        elif "卖出" in predicted_signal and actual_change < -1:
            notes.append("强势下跌，预测成功")
        elif "持有" in predicted_signal and -0.8 < actual_change < 0.8:
            notes.append("震荡整理，预测准确")
    else:
        notes.append("方向预测错误")
        if "买入" in predicted_signal and actual_change < -0.8:
            notes.append("预测上涨但实际大幅下跌")
        elif "卖出" in predicted_signal and actual_change > 0.8:
            notes.append("预测下跌但实际大幅上涨")
        elif "持有" in predicted_signal and (actual_change > 1 or actual_change < -1):
            notes.append("预测震荡但出现大幅波动")
    
    return notes


if __name__ == "__main__":
    simple_validation()
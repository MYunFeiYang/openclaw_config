#!/usr/bin/env python3
"""
正确的预测验证闭环系统
开盘预测 → 盘中观察 → 收盘验证(对比开盘预测) → 次日开盘验证
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class PredictionValidationCycle:
    """预测验证闭环系统"""
    
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or self._default_base_dir())
        self.data_dir = self.base_dir / "data"
        self.validation_dir = self.data_dir / "validation"
        self.prediction_dir = self.data_dir / "predictions"
        
        # 确保目录存在
        for dir_path in [self.data_dir, self.validation_dir, self.prediction_dir]:
            dir_path.mkdir(exist_ok=True)
    
    def _default_base_dir(self) -> str:
        """获取默认基础目录"""
        return os.environ.get(
            "STOCK_SYSTEM_ROOT",
            str(Path(__file__).resolve().parent.parent),
        )
    
    def validate_evening_against_morning(self, evening_date: str) -> Dict:
        """
        收盘验证早盘预测
        验证逻辑：早盘预测 vs 当日收盘实际表现
        """
        
        print(f"🚀 开始收盘验证早盘预测 ({evening_date})")
        print("=" * 60)
        
        # 1. 找到当天的早盘预测
        morning_predictions = self._find_morning_predictions(evening_date)
        
        if not morning_predictions:
            print(f"⚠️  未找到 {evening_date} 的早盘预测数据")
            return {}
        
        print(f"✅ 找到 {len(morning_predictions)} 条早盘预测")
        
        # 2. 获取当日收盘实际数据
        actual_data = self._get_actual_closing_data(evening_date)
        
        if not actual_data:
            print(f"⚠️  未获取到 {evening_date} 的收盘实际数据")
            return {}
        
        # 3. 进行验证
        validation_results = []
        total_predictions = len(morning_predictions)
        correct_direction = 0
        
        for prediction in morning_predictions:
            symbol = prediction.get('stock', {}).get('symbol')
            name = prediction.get('stock', {}).get('name')
            predicted_signal = prediction.get('signal', '')
            predicted_change = prediction.get('change_percent', 0)
            
            if symbol in actual_data:
                actual_change = actual_data[symbol]['actual_change']
                
                # 验证方向
                validation_result = self._validate_prediction(
                    predicted_signal, predicted_change, actual_change
                )
                
                validation_result['symbol'] = symbol
                validation_result['stock_name'] = name
                validation_result['predicted_signal'] = predicted_signal
                validation_result['predicted_change'] = predicted_change
                validation_result['actual_change'] = actual_change
                
                validation_results.append(validation_result)
                
                if validation_result['direction_correct']:
                    correct_direction += 1
                
                print(f"\n📊 {name} ({symbol})")
                print(f"   早盘预测: {predicted_signal} ({predicted_change:+.2f}%)")
                print(f"   收盘实际: {actual_change:+.2f}%")
                print(f"   方向验证: {'✅ 正确' if validation_result['direction_correct'] else '❌ 错误'}")
                print(f"   误差: {validation_result['error']:.2f}%")
        
        # 4. 生成验证报告
        accuracy = correct_direction / total_predictions * 100 if total_predictions > 0 else 0
        avg_error = sum(r['error'] for r in validation_results) / len(validation_results) if validation_results else 0
        
        print(f"\n【验证结果总结】")
        print(f"验证股票数量: {total_predictions}")
        print(f"方向准确率: {accuracy:.1f}% ({correct_direction}/{total_predictions})")
        print(f"平均误差: {avg_error:.2f}%")
        
        # 5. 保存验证结果
        result = {
            'validation_date': evening_date,
            'validation_time': datetime.now().isoformat(),
            'validation_type': 'evening_vs_morning',
            'total_predictions': total_predictions,
            'correct_direction': correct_direction,
            'direction_accuracy': accuracy,
            'average_error': avg_error,
            'validation_results': validation_results,
            'performance_grade': '优秀' if accuracy >= 80 else '良好' if accuracy >= 60 else '需要改进'
        }
        
        # 保存到文件
        self._save_validation_result(result, evening_date)
        
        return result
    
    def validate_morning_against_previous_evening(self, morning_date: str) -> Dict:
        """
        次日开盘验证前日收盘前预测
        验证逻辑：前日收盘预测 vs 次日开盘表现
        """
        
        print(f"🚀 开始次日开盘验证前日收盘预测 ({morning_date})")
        print("=" * 60)
        
        # 1. 找到前一天的收盘预测
        previous_date = (datetime.strptime(morning_date, '%Y-%m-%d') - timedelta(days=1)).strftime('%Y-%m-%d')
        evening_predictions = self._find_evening_predictions(previous_date)
        
        if not evening_predictions:
            print(f"⚠️  未找到 {previous_date} 的收盘预测数据")
            return {}
        
        print(f"✅ 找到 {len(evening_predictions)} 条前日收盘预测")
        
        # 2. 获取次日开盘实际数据
        opening_data = self._get_actual_opening_data(morning_date)
        
        if not opening_data:
            print(f"⚠️  未获取到 {morning_date} 的开盘实际数据")
            return {}
        
        # 3. 进行验证
        validation_results = []
        total_predictions = len(evening_predictions)
        correct_direction = 0
        
        for prediction in evening_predictions:
            symbol = prediction.get('stock', {}).get('symbol')
            name = prediction.get('stock', {}).get('name')
            predicted_signal = prediction.get('signal', '')
            predicted_change = prediction.get('change_percent', 0)
            
            if symbol in opening_data:
                actual_opening_change = opening_data[symbol]['opening_change']
                
                # 验证方向
                validation_result = self._validate_prediction(
                    predicted_signal, predicted_change, actual_opening_change
                )
                
                validation_result['symbol'] = symbol
                validation_result['stock_name'] = name
                validation_result['predicted_signal'] = predicted_signal
                validation_result['predicted_change'] = predicted_change
                validation_result['actual_change'] = actual_opening_change
                
                validation_results.append(validation_result)
                
                if validation_result['direction_correct']:
                    correct_direction += 1
                
                print(f"\n📊 {name} ({symbol})")
                print(f"   前日收盘预测: {predicted_signal} ({predicted_change:+.2f}%)")
                print(f"   次日开盘实际: {actual_opening_change:+.2f}%")
                print(f"   方向验证: {'✅ 正确' if validation_result['direction_correct'] else '❌ 错误'}")
                print(f"   误差: {validation_result['error']:.2f}%")
        
        # 4. 生成验证报告
        accuracy = correct_direction / total_predictions * 100 if total_predictions > 0 else 0
        avg_error = sum(r['error'] for r in validation_results) / len(validation_results) if validation_results else 0
        
        print(f"\n【验证结果总结】")
        print(f"验证股票数量: {total_predictions}")
        print(f"方向准确率: {accuracy:.1f}% ({correct_direction}/{total_predictions})")
        print(f"平均误差: {avg_error:.2f}%")
        
        # 5. 保存验证结果
        result = {
            'validation_date': morning_date,
            'prediction_date': previous_date,
            'validation_time': datetime.now().isoformat(),
            'validation_type': 'morning_vs_previous_evening',
            'total_predictions': total_predictions,
            'correct_direction': correct_direction,
            'direction_accuracy': accuracy,
            'average_error': avg_error,
            'validation_results': validation_results,
            'performance_grade': '优秀' if accuracy >= 80 else '良好' if accuracy >= 60 else '需要改进'
        }
        
        # 保存到文件
        self._save_validation_result(result, morning_date)
        
        return result
    
    def _find_morning_predictions(self, date_str: str) -> List[Dict]:
        """查找指定日期的早盘预测"""
        
        morning_files = list(self.prediction_dir.glob(f"predictions_morning_{date_str.replace('-', '')}_*.json"))
        
        if not morning_files:
            return []
        
        # 获取最新的早盘预测文件
        latest_file = max(morning_files, key=lambda x: x.stat().st_mtime)
        
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data.get('predictions', [])
        except Exception as e:
            print(f"读取早盘预测文件失败: {e}")
            return []
    
    def _find_evening_predictions(self, date_str: str) -> List[Dict]:
        """查找指定日期的收盘预测"""
        
        evening_files = list(self.prediction_dir.glob(f"predictions_evening_{date_str.replace('-', '')}_*.json"))
        
        if not evening_files:
            return []
        
        # 获取最新的收盘预测文件
        latest_file = max(evening_files, key=lambda x: x.stat().st_mtime)
        
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data.get('predictions', [])
        except Exception as e:
            print(f"读取收盘预测文件失败: {e}")
            return []
    
    def _get_actual_closing_data(self, date_str: str) -> Dict[str, Dict]:
        """获取当日收盘实际数据"""
        
        # 模拟实际收盘数据（基于真实市场逻辑）
        # 在实际应用中，这里应该调用真实的股票数据API
        
        mock_data = {
            '600519': {'actual_change': -0.92},  # 贵州茅台
            '600036': {'actual_change': -0.51},  # 招商银行
            '000858': {'actual_change': -0.95},  # 五粮液
            '600276': {'actual_change': -0.58},  # 恒瑞医药
            '300750': {'actual_change': -1.28},  # 宁德时代
            '002415': {'actual_change': -0.82},  # 海康威视
            '600887': {'actual_change': -0.71},  # 伊利股份
            '000002': {'actual_change': -0.58},  # 万科A
            '000725': {'actual_change': -0.52},  # 京东方A
            '002594': {'actual_change': -1.38},  # 比亚迪
        }
        
        return mock_data
    
    def _get_actual_opening_data(self, date_str: str) -> Dict[str, Dict]:
        """获取次日开盘实际数据"""
        
        # 模拟次日开盘数据（通常与前一交易日收盘有一定连续性）
        mock_data = {
            '600519': {'opening_change': -0.85},  # 贵州茅台
            '600036': {'opening_change': -0.45},  # 招商银行
            '000858': {'opening_change': -0.88},  # 五粮液
            '600276': {'opening_change': -0.52},  # 恒瑞医药
            '300750': {'opening_change': -1.22},  # 宁德时代
            '002415': {'opening_change': -0.75},  # 海康威视
            '600887': {'opening_change': -0.65},  # 伊利股份
            '000002': {'opening_change': -0.51},  # 万科A
            '000725': {'opening_change': -0.48},  # 京东方A
            '002594': {'opening_change': -1.30},  # 比亚迪
        }
        
        return mock_data
    
    def _validate_prediction(self, predicted_signal: str, predicted_change: float, actual_change: float) -> Dict:
        """验证单个预测"""
        
        # 确定预测方向
        if "强烈买入" in predicted_signal or predicted_signal == "买入":
            predicted_direction = 1
        elif "强烈卖出" in predicted_signal or predicted_signal == "卖出":
            predicted_direction = -1
        else:
            predicted_direction = 0  # 持有/中性
        
        # 确定实际方向
        if actual_change > 0.8:  # 使用修正后的中性区间
            actual_direction = 1
        elif actual_change < -0.8:
            actual_direction = -1
        else:
            actual_direction = 0
        
        # 计算误差
        error = abs(predicted_change - actual_change)
        
        # 方向是否正确
        direction_correct = (predicted_direction == actual_direction)
        
        # 生成验证说明
        notes = []
        if direction_correct:
            notes.append("✅ 方向预测正确")
            if predicted_direction == 1 and actual_change > 1:
                notes.append("📈 强势上涨，预测成功")
            elif predicted_direction == -1 and actual_change < -1:
                notes.append("📉 强势下跌，预测成功")
            elif predicted_direction == 0 and -0.8 < actual_change < 0.8:
                notes.append("➡️ 震荡整理，预测准确")
        else:
            notes.append("❌ 方向预测错误")
            if predicted_direction == 1 and actual_change < -0.8:
                notes.append("⚠️  预测上涨但实际大幅下跌")
            elif predicted_direction == -1 and actual_change > 0.8:
                notes.append("⚠️  预测下跌但实际大幅上涨")
            elif predicted_direction == 0 and (actual_change > 1 or actual_change < -1):
                notes.append("⚠️  预测震荡但出现大幅波动")
        
        return {
            'direction_correct': direction_correct,
            'error': error,
            'notes': notes
        }
    
    def _save_validation_result(self, result: Dict, date_str: str):
        """保存验证结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"corrected_validation_{result['validation_type']}_{date_str}_{timestamp}.json"
        filepath = self.validation_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 验证结果已保存: {filename}")
    
    def run_daily_validation_cycle(self, date_str: str) -> Dict:
        """运行完整的日验证循环"""
        
        print(f"🔄 启动完整的日验证循环 ({date_str})")
        print("=" * 70)
        
        results = {}
        
        # 1. 收盘验证早盘预测
        print("\n1️⃣ 收盘验证早盘预测")
        print("-" * 40)
        evening_result = self.validate_evening_against_morning(date_str)
        results['evening_validation'] = evening_result
        
        # 2. 次日开盘验证前日收盘预测（如果有次日数据）
        next_date = (datetime.strptime(date_str, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d')
        print(f"\n2️⃣ 次日开盘验证前日收盘预测 ({next_date})")
        print("-" * 40)
        morning_result = self.validate_morning_against_previous_evening(next_date)
        results['morning_validation'] = morning_result
        
        # 3. 生成综合报告
        print(f"\n📊 综合验证报告")
        print("=" * 40)
        
        evening_accuracy = evening_result.get('direction_accuracy', 0) if evening_result else 0
        morning_accuracy = morning_result.get('direction_accuracy', 0) if morning_result else 0
        
        print(f"收盘验证准确率: {evening_accuracy:.1f}%")
        print(f"次日开盘验证准确率: {morning_accuracy:.1f}%")
        
        overall_performance = (evening_accuracy + morning_accuracy) / 2 if evening_accuracy and morning_accuracy else max(evening_accuracy, morning_accuracy)
        print(f"整体表现: {overall_performance:.1f}%")
        
        results['summary'] = {
            'evening_accuracy': evening_accuracy,
            'morning_accuracy': morning_accuracy,
            'overall_performance': overall_performance,
            'assessment': '优秀' if overall_performance >= 80 else '良好' if overall_performance >= 60 else '需要改进'
        }
        
        return results


def main():
    """测试正确的验证闭环"""
    
    print("🎯 测试正确的预测验证闭环系统")
    print("=" * 70)
    
    validator = PredictionValidationCycle()
    
    # 测试指定日期的验证
    test_date = "2026-03-27"
    
    # 运行完整的日验证循环
    results = validator.run_daily_validation_cycle(test_date)
    
    print(f"\n✅ 验证循环完成！")
    print(f"📅 验证日期: {test_date}")
    print(f"📊 整体评估: {results['summary']['assessment']}")


if __name__ == "__main__":
    main()
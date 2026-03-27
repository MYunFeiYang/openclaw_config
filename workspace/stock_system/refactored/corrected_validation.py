#!/usr/bin/env python3
"""
正确的预测验证闭环逻辑
开盘预测 → 盘中观察 → 收盘验证(对比开盘预测) → 次日开盘验证
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional


class CorrectedValidationSystem:
    """修正后的验证系统"""
    
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
    
    def find_matching_prediction(self, validation_time: datetime, analysis_type: str, symbol: str) -> Optional[Dict]:
        """找到对应的开盘预测"""
        
        # 根据验证类型确定应该查找哪个时间段的预测
        if analysis_type == "evening":
            # 收盘验证应该查找当天的早盘预测
            target_date = validation_time.date()
            target_time = "morning"
        elif analysis_type == "morning":
            # 次日开盘验证应该查找前一天的收盘前预测
            target_date = (validation_time - timedelta(days=1)).date()
            target_time = "afternoon"  # 前一天的午盘预测
        else:
            return None
        
        # 查找对应的预测文件
        prediction_files = list(self.prediction_dir.glob(f"predictions_{target_time}_*.json"))
        
        for pred_file in prediction_files:
            try:
                with open(pred_file, 'r', encoding='utf-8') as f:
                    pred_data = json.load(f)
                
                # 检查文件日期是否匹配
                pred_timestamp = datetime.fromisoformat(pred_data['timestamp'].replace('Z', '+00:00'))
                if pred_timestamp.date() == target_date:
                    
                    # 在预测数据中找到对应的股票
                    for prediction in pred_data.get('predictions', []):
                        if prediction.get('stock', {}).get('symbol') == symbol:
                            return {
                                'prediction_file': str(pred_file),
                                'prediction_time': pred_data['timestamp'],
                                'prediction_data': prediction,
                                'predicted_signal': prediction.get('signal', ''),
                                'predicted_score': prediction.get('final_score', 0),
                                'confidence': prediction.get('confidence', 0)
                            }
            except Exception as e:
                print(f"处理预测文件 {pred_file} 时出错: {e}")
                continue
        
        return None
    
    def validate_against_actual(self, actual_change: float, prediction: Dict, neutral_band: float = 0.8) -> Dict:
        """验证预测与实际表现的匹配度"""
        
        predicted_signal = prediction.get('predicted_signal', '')
        predicted_score = prediction.get('predicted_score', 5.0)
        
        # 确定实际方向
        if actual_change > neutral_band:
            actual_direction = 1  # 上涨
        elif actual_change < -neutral_band:
            actual_direction = -1  # 下跌
        else:
            actual_direction = 0  # 震荡/中性
        
        # 确定预测方向
        if "强烈买入" in predicted_signal or predicted_signal == "买入":
            predicted_direction = 1
        elif "强烈卖出" in predicted_signal or predicted_signal == "卖出":
            predicted_direction = -1
        else:
            predicted_direction = 0  # 持有/中性
        
        # 判断方向是否匹配
        direction_match = (predicted_direction == actual_direction)
        
        # 计算评分准确性（基于预测分数和实际表现的偏差）
        score_accuracy = self._calculate_score_accuracy(predicted_score, actual_change)
        
        return {
            'predicted_signal': predicted_signal,
            'predicted_direction': predicted_direction,
            'predicted_score': predicted_score,
            'actual_change': actual_change,
            'actual_direction': actual_direction,
            'direction_match': direction_match,
            'score_accuracy': score_accuracy,
            'accuracy_score': 100 if direction_match else 0,  # 简化版：方向匹配即100分
            'validation_notes': self._generate_validation_notes(predicted_signal, actual_change, direction_match)
        }
    
    def _calculate_score_accuracy(self, predicted_score: float, actual_change: float) -> float:
        """计算评分准确性"""
        
        # 将实际涨跌幅映射到0-10分
        if actual_change > 2:
            actual_score = 9.0
        elif actual_change > 1:
            actual_score = 8.0
        elif actual_change > 0.5:
            actual_score = 7.0
        elif actual_change > 0:
            actual_score = 6.0
        elif actual_change > -0.5:
            actual_score = 5.0
        elif actual_change > -1:
            actual_score = 4.0
        elif actual_change > -2:
            actual_score = 3.0
        else:
            actual_score = 2.0
        
        # 计算分数差异（越小越好）
        score_diff = abs(predicted_score - actual_score)
        
        # 转换为准确率（0-100%）
        accuracy = max(0, 100 - (score_diff * 10))
        
        return round(accuracy, 1)
    
    def _generate_validation_notes(self, predicted_signal: str, actual_change: float, direction_match: bool) -> List[str]:
        """生成验证说明"""
        
        notes = []
        
        if direction_match:
            notes.append("✅ 方向预测正确")
            if "买入" in predicted_signal and actual_change > 1:
                notes.append("📈 强势上涨，预测成功")
            elif "卖出" in predicted_signal and actual_change < -1:
                notes.append("📉 强势下跌，预测成功")
            elif "持有" in predicted_signal and -0.5 < actual_change < 0.5:
                notes.append("➡️ 震荡整理，预测准确")
        else:
            notes.append("❌ 方向预测错误")
            if "买入" in predicted_signal and actual_change < -0.5:
                notes.append("⚠️  预测上涨但实际下跌")
            elif "卖出" in predicted_signal and actual_change > 0.5:
                notes.append("⚠️  预测下跌但实际上涨")
            elif "持有" in predicted_signal and (actual_change > 1 or actual_change < -1):
                notes.append("⚠️  预测震荡但出现大幅波动")
        
        return notes
    
    def generate_validation_report(self, validation_results: List[Dict], analysis_type: str) -> str:
        """生成验证报告"""
        
        if not validation_results:
            return "暂无验证数据"
        
        total_stocks = len(validation_results)
        direction_matches = sum(1 for r in validation_results if r['direction_match'])
        direction_accuracy = direction_matches / total_stocks * 100 if total_stocks > 0 else 0
        
        avg_score_accuracy = sum(r['score_accuracy'] for r in validation_results) / total_stocks if total_stocks > 0 else 0
        
        # 分类统计
        buy_predictions = [r for r in validation_results if "买入" in r['predicted_signal']]
        sell_predictions = [r for r in validation_results if "卖出" in r['predicted_signal']]
        hold_predictions = [r for r in validation_results if "持有" in r['predicted_signal']]
        
        buy_accuracy = sum(1 for r in buy_predictions if r['direction_match']) / len(buy_predictions) * 100 if buy_predictions else 0
        sell_accuracy = sum(1 for r in sell_predictions if r['direction_match']) / len(sell_predictions) * 100 if sell_predictions else 0
        hold_accuracy = sum(1 for r in hold_predictions if r['direction_match']) / len(hold_predictions) * 100 if hold_predictions else 0
        
        report_lines = []
        report_lines.append("【股票预测验证报告】")
        report_lines.append("=" * 60)
        report_lines.append(f"验证时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append(f"验证类型: {analysis_type}")
        report_lines.append(f"验证股票数量: {total_stocks}")
        report_lines.append("=" * 60)
        
        # 总体准确性
        report_lines.append(f"\n【总体表现】")
        report_lines.append(f"方向准确率: {direction_accuracy:.1f}% ({direction_matches}/{total_stocks})")
        report_lines.append(f"评分准确率: {avg_score_accuracy:.1f}%")
        
        # 分类表现
        report_lines.append(f"\n【分类表现】")
        if buy_predictions:
            report_lines.append(f"买入预测: {buy_accuracy:.1f}% ({len([r for r in buy_predictions if r['direction_match']])}/{len(buy_predictions)})")
        if sell_predictions:
            report_lines.append(f"卖出预测: {sell_accuracy:.1f}% ({len([r for r in sell_predictions if r['direction_match']])}/{len(sell_predictions)})")
        if hold_predictions:
            report_lines.append(f"持有预测: {hold_accuracy:.1f}% ({len([r for r in hold_predictions if r['direction_match']])}/{len(hold_predictions)})")
        
        # 详细验证结果
        report_lines.append(f"\n【详细验证结果】")
        for i, result in enumerate(validation_results, 1):
            stock_name = result.get('stock_name', '未知股票')
            report_lines.append(f"\n{i}. {stock_name}")
            report_lines.append(f"   预测: {result['predicted_signal']} (评分: {result['predicted_score']:.1f})")
            report_lines.append(f"   实际: {result['actual_change']:+.2f}% ({'上涨' if result['actual_direction'] > 0 else '下跌' if result['actual_direction'] < 0 else '震荡'})")
            report_lines.append(f"   结果: {'✅ 正确' if result['direction_match'] else '❌ 错误'} (评分准确率: {result['score_accuracy']:.1f}%)")
            
            if result['validation_notes']:
                report_lines.append(f"   说明: {'; '.join(result['validation_notes'])}")
        
        # 改进建议
        if direction_accuracy < 60:
            report_lines.append(f"\n【改进建议】")
            report_lines.append("⚠️  整体准确率偏低，建议:")
            report_lines.append("   • 重新评估预测模型的权重配置")
            report_lines.append("   • 增加更多技术指标和市场情绪指标")
            report_lines.append("   • 考虑引入机器学习算法优化预测")
            
            if buy_accuracy < 50:
                report_lines.append("   • 买入预测准确率较低，建议提高买入信号阈值")
            if sell_accuracy < 50:
                report_lines.append("   • 卖出预测准确率较低，建议重新评估卖出逻辑")
            if hold_accuracy < 50:
                report_lines.append("   • 持有预测准确率较低，建议优化震荡区间判断")
        else:
            report_lines.append(f"\n【表现评价】")
            report_lines.append("🎉 整体表现良好，继续保持当前策略")
            if direction_accuracy > 80:
                report_lines.append("🏆 优秀表现！可以考虑增加预测股票数量")
        
        report_lines.append("\n" + "=" * 60)
        report_lines.append("📊 本报告基于实际市场表现自动生成")
        
        return "\n".join(report_lines)
    
    def save_validation_results(self, validation_results: List[Dict], analysis_type: str) -> str:
        """保存验证结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"corrected_validation_{analysis_type}_{timestamp}.json"
        filepath = self.validation_dir / filename
        
        # 生成报告
        report = self.generate_validation_report(validation_results, analysis_type)
        
        # 保存数据
        data = {
            'timestamp': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'validation_count': len(validation_results),
            'validation_results': validation_results,
            'summary_report': report
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # 同时保存报告文本
        report_filename = f"validation_report_{analysis_type}_{timestamp}.txt"
        report_filepath = self.validation_dir / report_filename
        with open(report_filepath, 'w', encoding='utf-8') as f:
            f.write(report)
        
        return str(filepath)


def main():
    """测试修正后的验证系统"""
    
    print("🚀 测试修正后的预测验证系统")
    print("=" * 60)
    
    validator = CorrectedValidationSystem()
    
    # 模拟验证数据
    test_data = [
        {
            'symbol': '600519',
            'name': '贵州茅台',
            'actual_change': -0.89,
            'analysis_type': 'evening'
        },
        {
            'symbol': '600036', 
            'name': '招商银行',
            'actual_change': -0.48,
            'analysis_type': 'evening'
        },
        {
            'symbol': '300750',
            'name': '宁德时代', 
            'actual_change': -1.24,
            'analysis_type': 'evening'
        }
    ]
    
    validation_results = []
    
    for data in test_data:
        # 查找对应的预测
        prediction = validator.find_matching_prediction(
            datetime.now(), 
            data['analysis_type'], 
            data['symbol']
        )
        
        if prediction:
            # 进行验证
            validation_result = validator.validate_against_actual(
                data['actual_change'], 
                prediction,
                neutral_band=0.8
            )
            
            # 添加股票信息
            validation_result['symbol'] = data['symbol']
            validation_result['stock_name'] = data['name']
            validation_result['analysis_type'] = data['analysis_type']
            
            validation_results.append(validation_result)
            
            print(f"\n📊 {data['name']} ({data['symbol']})")
            print(f"   实际变化: {data['actual_change']:+.2f}%")
            print(f"   预测信号: {validation_result['predicted_signal']}")
            print(f"   方向匹配: {'✅ 正确' if validation_result['direction_match'] else '❌ 错误'}")
            print(f"   评分准确: {validation_result['score_accuracy']:.1f}%")
        else:
            print(f"\n⚠️  未找到 {data['name']} 的对应预测")
    
    if validation_results:
        # 生成报告
        report = validator.generate_validation_report(validation_results, 'evening')
        print(f"\n{report}")
        
        # 保存结果
        filepath = validator.save_validation_results(validation_results, 'evening')
        print(f"\n💾 验证结果已保存: {filepath}")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
预测→总结→优化 闭环迭代系统
实现自动化的预测准确率提升循环
"""

import sys
import json
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, List, Tuple, Optional

# 导入现有组件
sys.path.append('refactored')
from optimized_predictor import OptimizedPredictor
from enhanced_analyzer import EnhancedStockAnalyzer

class IterativeOptimizationSystem:
    """迭代优化系统 - 实现预测→总结→优化的完整闭环"""
    
    def __init__(self, base_dir: str = None):
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).parent
        self.data_dir = self.base_dir / "data"
        self.reports_dir = self.base_dir / "reports"
        self.optimization_dir = self.base_dir / "optimization"
        self.logs_dir = self.base_dir / "logs"
        
        # 创建必要目录
        for dir_path in [self.optimization_dir, self.logs_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # 初始化组件
        self.predictor = OptimizedPredictor()
        self.analyzer = EnhancedStockAnalyzer(str(self.base_dir))
        
        # 优化历史记录
        self.optimization_history = deque(maxlen=100)
        self.accuracy_history = deque(maxlen=30)
        self.parameter_history = deque(maxlen=50)
        
        # 当前最优参数
        self.best_parameters = self.load_best_parameters()
        
    def run_prediction_summary_optimization_cycle(self, analysis_type: str = "evening"):
        """运行完整的预测→总结→优化循环"""
        
        print(f"🔄 启动预测→总结→优化循环 ({analysis_type})")
        print("=" * 60)
        print(f"循环时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # 步骤1: 预测
            print("\n📊 步骤1: 执行预测...")
            prediction_results = self.execute_prediction(analysis_type)
            
            if not prediction_results:
                print("❌ 预测步骤失败")
                return False
            
            # 步骤2: 总结（验证预测准确性）
            print("\n📋 步骤2: 验证预测准确性...")
            validation_results = self.validate_predictions(prediction_results, analysis_type)
            
            if not validation_results:
                print("❌ 验证步骤失败")
                return False
            
            # 步骤3: 优化
            print("\n🎯 步骤3: 参数优化...")
            optimization_results = self.optimize_parameters(validation_results)
            
            if not optimization_results:
                print("❌ 优化步骤失败")
                return False
            
            # 步骤4: 应用优化结果
            print("\n🔧 步骤4: 应用优化结果...")
            self.apply_optimization(optimization_results)
            
            # 保存循环结果
            self.save_cycle_results(prediction_results, validation_results, optimization_results)
            
            print("\n✅ 预测→总结→优化循环完成")
            return True
            
        except Exception as e:
            print(f"❌ 循环执行失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def execute_prediction(self, analysis_type: str) -> Optional[List[Dict]]:
        """执行预测步骤"""
        
        # 获取股票列表
        stock_list = self.get_stock_list_for_analysis()
        
        if not stock_list:
            print("❌ 没有可用的股票数据")
            return None
        
        # 使用当前最优参数进行分析
        results = self.analyzer.analyze_batch(stock_list, analysis_type)
        
        if results:
            print(f"✅ 预测完成: {len(results)} 只股票")
            
            # 分析信号分布
            signals = defaultdict(int)
            for result in results:
                signal = result.get("signal", "未知")
                signals[signal] += 1
            
            print("📊 信号分布:")
            for signal, count in signals.items():
                print(f"  {signal}: {count}只")
            
            return results
        else:
            print("❌ 预测失败")
            return None
    
    def validate_predictions(self, predictions: List[Dict], analysis_type: str) -> Optional[Dict]:
        """验证预测准确性"""
        
        if not predictions:
            return None
        
        # 获取实际表现数据（这里使用当日收盘价作为验证）
        validation_results = []
        total_predictions = len(predictions)
        correct_predictions = 0
        
        for prediction in predictions:
            symbol = prediction["stock"]["symbol"]
            name = prediction["stock"]["name"]
            predicted_signal = prediction["signal"]
            predicted_score = prediction["final_score"]
            confidence = prediction["confidence"]
            
            # 获取实际表现（这里使用已有的change_percent作为当日实际表现）
            actual_change = prediction.get("change_percent", 0)
            
            # 判断预测是否正确
            expected_direction = self.get_expected_direction(predicted_signal)
            actual_direction = self.get_actual_direction(actual_change)
            is_correct = self.is_prediction_correct(expected_direction, actual_direction)
            
            if is_correct:
                correct_predictions += 1
            
            validation_result = {
                "symbol": symbol,
                "name": name,
                "predicted_signal": predicted_signal,
                "predicted_score": predicted_score,
                "confidence": confidence,
                "actual_change": actual_change,
                "expected_direction": expected_direction,
                "actual_direction": actual_direction,
                "is_correct": is_correct,
                "error_magnitude": abs(expected_direction - actual_direction) if expected_direction != 0 else 0
            }
            
            validation_results.append(validation_result)
        
        # 计算整体准确率
        accuracy = correct_predictions / total_predictions if total_predictions > 0 else 0
        
        # 分析错误类型
        error_analysis = self.analyze_errors(validation_results)
        
        validation_summary = {
            "timestamp": datetime.now().isoformat(),
            "analysis_type": analysis_type,
            "total_predictions": total_predictions,
            "correct_predictions": correct_predictions,
            "accuracy": accuracy,
            "validation_results": validation_results,
            "error_analysis": error_analysis
        }
        
        print(f"✅ 验证完成: 准确率 {accuracy:.1%} ({correct_predictions}/{total_predictions})")
        
        # 保存准确率历史
        self.accuracy_history.append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "accuracy": accuracy,
            "total": total_predictions,
            "correct": correct_predictions
        })
        
        return validation_summary
    
    def optimize_parameters(self, validation_results: Dict) -> Optional[Dict]:
        """基于验证结果优化参数"""
        
        if not validation_results:
            return None
        
        accuracy = validation_results["accuracy"]
        error_analysis = validation_results["error_analysis"]
        
        print(f"\n📈 当前准确率: {accuracy:.1%}")
        
        # 分析错误模式
        error_patterns = self.identify_error_patterns(validation_results["validation_results"])
        
        # 生成优化建议
        optimization_suggestions = self.generate_optimization_suggestions(error_patterns, error_analysis)
        
        # 计算新的参数
        new_parameters = self.calculate_new_parameters(optimization_suggestions)
        
        # 评估优化效果
        expected_improvement = self.estimate_improvement_potential(validation_results, new_parameters)
        
        optimization_result = {
            "timestamp": datetime.now().isoformat(),
            "original_accuracy": accuracy,
            "error_patterns": error_patterns,
            "optimization_suggestions": optimization_suggestions,
            "new_parameters": new_parameters,
            "expected_improvement": expected_improvement,
            "confidence_level": self.calculate_optimization_confidence(validation_results)
        }
        
        print(f"🎯 优化建议生成完成")
        print(f"📊 预期改进: +{expected_improvement:.1%}")
        
        return optimization_result
    
    def apply_optimization(self, optimization_results: Dict):
        """应用优化结果"""
        
        if not optimization_results:
            return
        
        new_params = optimization_results["new_parameters"]
        confidence = optimization_results["confidence_level"]
        expected_improvement = optimization_results["expected_improvement"]
        
        # 只有在置信度足够高且预期改进显著时才应用
        if confidence >= 0.7 and expected_improvement >= 0.02:  # 70%置信度，至少2%改进
            
            print(f"\n🔧 应用优化参数 (置信度: {confidence:.1%})")
            
            # 更新预测器参数
            self.update_predictor_parameters(new_params)
            
            # 保存参数历史
            self.parameter_history.append({
                "timestamp": datetime.now().isoformat(),
                "parameters": new_params,
                "confidence": confidence,
                "expected_improvement": expected_improvement
            })
            
            # 更新最优参数
            self.update_best_parameters(new_params)
            
            print("✅ 优化参数已应用")
            
        else:
            print(f"\n⏭️ 跳过优化 (置信度: {confidence:.1%}, 预期改进: {expected_improvement:.1%})")
            print("等待更多数据积累...")
    
    # 辅助方法
    def get_expected_direction(self, signal: str) -> int:
        """获取预测方向"""
        if "买入" in signal:
            return 1
        elif "卖出" in signal:
            return -1
        else:  # 持有
            return 0
    
    def get_actual_direction(self, change_percent: float) -> int:
        """获取实际方向"""
        if change_percent > 0.05:  # 上涨超过0.05%
            return 1
        elif change_percent < -0.05:  # 下跌超过0.05%
            return -1
        else:  # 中性
            return 0
    
    def is_prediction_correct(self, expected: int, actual: int) -> bool:
        """判断预测是否正确"""
        if expected == 0:  # 持有信号
            return actual == 0
        return expected == actual
    
    def analyze_errors(self, validation_results: List[Dict]) -> Dict:
        """分析错误模式"""
        
        false_positives = 0  # 预测上涨，实际下跌
        false_negatives = 0  # 预测下跌，实际上涨
        neutral_errors = 0   # 持有信号错误
        
        for result in validation_results:
            if not result["is_correct"]:
                predicted = result["expected_direction"]
                actual = result["actual_direction"]
                
                if predicted == 1 and actual == -1:
                    false_positives += 1
                elif predicted == -1 and actual == 1:
                    false_negatives += 1
                elif predicted == 0:
                    neutral_errors += 1
        
        total_errors = false_positives + false_negatives + neutral_errors
        
        return {
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "neutral_errors": neutral_errors,
            "total_errors": total_errors,
            "fp_rate": false_positives / total_errors if total_errors > 0 else 0,
            "fn_rate": false_negatives / total_errors if total_errors > 0 else 0
        }
    
    def identify_error_patterns(self, validation_results: List[Dict]) -> Dict:
        """识别错误模式"""
        
        patterns = {
            "by_sector": defaultdict(list),
            "by_score_range": defaultdict(list),
            "by_confidence": defaultdict(list),
            "by_market_condition": defaultdict(list)
        }
        
        for result in validation_results:
            if not result["is_correct"]:
                sector = result.get("sector", "未知")
                score = result["predicted_score"]
                confidence = result["confidence"]
                
                patterns["by_sector"][sector].append(result)
                
                # 按评分区间分类
                if score >= 8:
                    patterns["by_score_range"]["high"].append(result)
                elif score >= 6:
                    patterns["by_score_range"]["medium"].append(result)
                else:
                    patterns["by_score_range"]["low"].append(result)
                
                # 按信心度分类
                if confidence >= 80:
                    patterns["by_confidence"]["high"].append(result)
                elif confidence >= 60:
                    patterns["by_confidence"]["medium"].append(result)
                else:
                    patterns["by_confidence"]["low"].append(result)
        
        return dict(patterns)
    
    def generate_optimization_suggestions(self, error_patterns: Dict, error_analysis: Dict) -> List[Dict]:
        """生成优化建议"""
        
        suggestions = []
        
        # 1. 基于错误类型的建议
        if error_analysis["fp_rate"] > 0.6:  # 过多假阳性
            suggestions.append({
                "type": "threshold_adjustment",
                "target": "buy_threshold",
                "action": "increase",
                "magnitude": 0.2,
                "reason": "减少假阳性错误"
            })
        
        if error_analysis["fn_rate"] > 0.6:  # 过多假阴性
            suggestions.append({
                "type": "threshold_adjustment", 
                "target": "sell_threshold",
                "action": "decrease",
                "magnitude": 0.2,
                "reason": "减少假阴性错误"
            })
        
        # 2. 基于行业表现的建议
        sector_errors = error_patterns.get("by_sector", {})
        for sector, errors in sector_errors.items():
            if len(errors) > 2:  # 某个行业错误较多
                error_rate = len(errors) / sum(1 for r in validation_results if r.get("sector") == sector)
                if error_rate > 0.7:  # 该行业准确率低于30%
                    suggestions.append({
                        "type": "sector_weight_adjustment",
                        "target": sector,
                        "action": "reduce_weight",
                        "magnitude": 0.3,
                        "reason": f"{sector}行业预测准确率过低"
                    })
        
        # 3. 基于评分区间的建议
        score_errors = error_patterns.get("by_score_range", {})
        if len(score_errors.get("high", [])) > len(score_errors.get("medium", [])):
            suggestions.append({
                "type": "score_calibration",
                "target": "high_score_threshold",
                "action": "increase",
                "magnitude": 0.5,
                "reason": "高评分区间错误率偏高"
            })
        
        return suggestions
    
    def calculate_new_parameters(self, suggestions: List[Dict]) -> Dict:
        """计算新参数"""
        
        # 基础参数（当前最优参数）
        new_params = self.best_parameters.copy()
        
        # 应用建议调整
        for suggestion in suggestions:
            if suggestion["type"] == "threshold_adjustment":
                if suggestion["target"] == "buy_threshold":
                    new_params["signal_thresholds"]["buy"] += suggestion["magnitude"]
                elif suggestion["target"] == "sell_threshold":
                    new_params["signal_thresholds"]["sell"] -= suggestion["magnitude"]
            
            elif suggestion["type"] == "sector_weight_adjustment":
                sector = suggestion["target"]
                if suggestion["action"] == "reduce_weight":
                    new_params["sector_weights"][sector] *= (1 - suggestion["magnitude"])
            
            elif suggestion["type"] == "score_calibration":
                if suggestion["target"] == "high_score_threshold":
                    new_params["score_weights"]["technical"] += suggestion["magnitude"] * 0.1
        
        # 确保参数在合理范围内
        self.normalize_parameters(new_params)
        
        return new_params
    
    def estimate_improvement_potential(self, validation_results: Dict, new_parameters: Dict) -> float:
        """估算改进潜力"""
        
        current_accuracy = validation_results["accuracy"]
        
        # 基于历史数据估算
        if len(self.optimization_history) > 5:
            # 查找相似参数的历史表现
            similar_cases = []
            for hist in self.optimization_history[-10:]:
                param_similarity = self.calculate_parameter_similarity(new_parameters, hist["parameters"])
                if param_similarity > 0.8:  # 参数相似度>80%
                    similar_cases.append(hist)
            
            if similar_cases:
                avg_improvement = sum(case.get("actual_improvement", 0) for case in similar_cases) / len(similar_cases)
                return min(avg_improvement, 0.15)  # 最多预期15%改进
        
        # 默认估算
        error_rate = 1 - current_accuracy
        return min(error_rate * 0.3, 0.1)  # 保守估算，最多10%改进
    
    def calculate_optimization_confidence(self, validation_results: Dict) -> float:
        """计算优化置信度"""
        
        accuracy = validation_results["accuracy"]
        total_samples = validation_results["total_predictions"]
        
        # 基于样本数量的置信度
        sample_confidence = min(total_samples / 20, 1.0)  # 至少20个样本才有高置信度
        
        # 基于准确率的置信度（准确率越低，优化空间越大，但置信度要适当降低）
        accuracy_confidence = max(0.5, 1.0 - accuracy * 0.5)
        
        # 综合置信度
        return sample_confidence * accuracy_confidence
    
    # 参数管理方法
    def load_best_parameters(self) -> Dict:
        """加载最优参数"""
        
        param_file = self.optimization_dir / "best_parameters.json"
        
        if param_file.exists():
            try:
                with open(param_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ 加载最优参数失败: {e}")
        
        # 返回默认参数
        return self.get_default_parameters()
    
    def get_default_parameters(self) -> Dict:
        """获取默认参数"""
        
        return {
            "weights": {
                "technical": 0.35,
                "fundamental": 0.25,
                "market_sentiment": 0.20,
                "sector_rotation": 0.15,
                "risk_management": 0.05
            },
            "signal_thresholds": {
                "strong_buy": 8.5,
                "buy": 7.0,
                "hold_upper": 6.0,
                "hold_lower": 4.0,
                "sell": 3.0,
                "strong_sell": 2.0
            },
            "sector_weights": {
                "白酒": 1.0,
                "新能源": 1.0,
                "银行": 1.0,
                "医药": 1.0,
                "科技": 1.0,
                "消费": 1.0,
                "地产": 1.0,
                "面板": 1.0
            }
        }
    
    def update_best_parameters(self, new_parameters: Dict):
        """更新最优参数"""
        
        self.best_parameters = new_parameters
        
        # 保存到文件
        param_file = self.optimization_dir / "best_parameters.json"
        try:
            with open(param_file, 'w', encoding='utf-8') as f:
                json.dump(new_parameters, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ 保存最优参数失败: {e}")
    
    def update_predictor_parameters(self, new_parameters: Dict):
        """更新预测器参数"""
        
        # 更新预测器权重
        if "weights" in new_parameters:
            self.predictor.weights.update(new_parameters["weights"])
        
        # 更新信号阈值
        if "signal_thresholds" in new_parameters:
            self.predictor.signal_thresholds.update(new_parameters["signal_thresholds"])
        
        # 更新行业权重
        if "sector_weights" in new_parameters:
            # 这里可以添加行业权重更新逻辑
            pass
    
    def normalize_parameters(self, parameters: Dict):
        """参数归一化"""
        
        # 确保权重总和为1
        if "weights" in parameters:
            weights = parameters["weights"]
            total = sum(weights.values())
            if total > 0:
                for key in weights:
                    weights[key] = weights[key] / total
        
        # 确保阈值在合理范围内
        if "signal_thresholds" in parameters:
            thresholds = parameters["signal_thresholds"]
            thresholds["strong_buy"] = max(8.0, min(10.0, thresholds["strong_buy"]))
            thresholds["buy"] = max(6.0, min(9.0, thresholds["buy"]))
            thresholds["sell"] = max(1.0, min(4.0, thresholds["sell"]))
            thresholds["strong_sell"] = max(0.0, min(3.0, thresholds["strong_sell"]))
    
    def calculate_parameter_similarity(self, params1: Dict, params2: Dict) -> float:
        """计算参数相似度"""
        
        similarity = 0.0
        count = 0
        
        # 比较权重
        if "weights" in params1 and "weights" in params2:
            weights1 = params1["weights"]
            weights2 = params2["weights"]
            
            for key in set(weights1.keys()) | set(weights2.keys()):
                if key in weights1 and key in weights2:
                    similarity += 1 - abs(weights1[key] - weights2[key])
                    count += 1
        
        return similarity / count if count > 0 else 0.0
    
    # 数据获取方法
    def get_stock_list_for_analysis(self) -> List[Dict]:
        """获取分析用的股票列表"""
        
        # 默认股票列表（可以根据需要扩展）
        return [
            {
                "symbol": "000858", "name": "五粮液", "sector": "白酒",
                "current_price": 100.9, "change_percent": 0.67,
                "rsi": 52, "macd": 0.1, "ma_position": 1.01, "volume_ratio": 1.1,
                "pe_ratio": 25, "pb_ratio": 3.5, "roe": 0.18, "growth_rate": 0.12,
                "market_heat": 5, "retail_sentiment": "中性", "volatility": 0.025,
                "beta": 1.1, "debt_ratio": 0.3, "dividend_yield": 2.0
            },
            {
                "symbol": "600519", "name": "贵州茅台", "sector": "白酒",
                "current_price": 1445.0, "change_percent": -0.54,
                "rsi": 45, "macd": -0.2, "ma_position": 0.97, "volume_ratio": 0.8,
                "pe_ratio": 30, "pb_ratio": 8.0, "roe": 0.25, "growth_rate": 0.15,
                "market_heat": 4, "retail_sentiment": "谨慎", "volatility": 0.028,
                "beta": 0.9, "debt_ratio": 0.2, "dividend_yield": 1.5
            },
            {
                "symbol": "300750", "name": "宁德时代", "sector": "新能源",
                "current_price": 405.0, "change_percent": 0.75,
                "rsi": 48, "macd": -0.1, "ma_position": 0.98, "volume_ratio": 0.9,
                "pe_ratio": 35, "pb_ratio": 4.2, "roe": 0.15, "growth_rate": 0.25,
                "market_heat": 6, "retail_sentiment": "乐观", "volatility": 0.030,
                "beta": 1.2, "debt_ratio": 0.4, "dividend_yield": 1.0
            },
            {
                "symbol": "600036", "name": "招商银行", "sector": "银行",
                "current_price": 39.77, "change_percent": -0.38,
                "rsi": 42, "macd": -0.15, "ma_position": 0.96, "volume_ratio": 0.7,
                "pe_ratio": 8, "pb_ratio": 1.2, "roe": 0.12, "growth_rate": 0.08,
                "market_heat": 3, "retail_sentiment": "谨慎", "volatility": 0.022,
                "beta": 0.8, "debt_ratio": 0.9, "dividend_yield": 4.5
            },
            {
                "symbol": "600276", "name": "恒瑞医药", "sector": "医药",
                "current_price": 55.14, "change_percent": -1.57,
                "rsi": 40, "macd": -0.25, "ma_position": 0.94, "volume_ratio": 1.2,
                "pe_ratio": 40, "pb_ratio": 5.5, "roe": 0.20, "growth_rate": 0.18,
                "market_heat": 5, "retail_sentiment": "中性", "volatility": 0.035,
                "beta": 1.0, "debt_ratio": 0.25, "dividend_yield": 1.8
            }
        ]
    
    # 结果保存方法
    def save_cycle_results(self, prediction_results: List[Dict], validation_results: Dict, optimization_results: Dict):
        """保存循环结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 保存完整循环结果
        cycle_result = {
            "timestamp": datetime.now().isoformat(),
            "prediction_results": prediction_results,
            "validation_results": validation_results,
            "optimization_results": optimization_results,
            "model_version": "iterative_v1.0"
        }
        
        result_file = self.optimization_dir / f"cycle_result_{timestamp}.json"
        try:
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(cycle_result, f, ensure_ascii=False, indent=2)
            print(f"✅ 循环结果已保存: {result_file}")
        except Exception as e:
            print(f"⚠️ 保存循环结果失败: {e}")
        
        # 保存优化历史
        self.optimization_history.append({
            "timestamp": timestamp,
            "accuracy": validation_results["accuracy"],
            "optimization_applied": optimization_results["confidence_level"] >= 0.7
        })
    
    def generate_summary_report(self) -> str:
        """生成总结报告"""
        
        if len(self.accuracy_history) == 0:
            return "暂无历史数据"
        
        recent_accuracies = list(self.accuracy_history)[-10:]
        avg_accuracy = sum(a["accuracy"] for a in recent_accuracies) / len(recent_accuracies)
        
        recent_optimizations = list(self.optimization_history)[-10:]
        optimization_count = sum(1 for opt in recent_optimizations if opt.get("optimization_applied", False))
        
        report = f"""
📊 迭代优化系统总结报告
=====================================
报告时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📈 准确率趋势:
• 最近平均准确率: {avg_accuracy:.1%}
• 历史最高准确率: {max(a['accuracy'] for a in self.accuracy_history):.1%}
• 历史最低准确率: {min(a['accuracy'] for a in self.accuracy_history):.1%}
• 优化次数: {optimization_count}/{len(recent_optimizations)}

🎯 当前最优参数:
• 技术面权重: {self.best_parameters['weights']['technical']:.2f}
• 基本面权重: {self.best_parameters['weights']['fundamental']:.2f}
• 情绪权重: {self.best_parameters['weights']['market_sentiment']:.2f}
• 行业权重: {self.best_parameters['weights']['sector_rotation']:.2f}

🔄 系统状态: 运行正常
"""
        
        return report

# 主函数
def main():
    """主函数"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="迭代优化股票预测系统")
    parser.add_argument("type", nargs="?", default="evening",
                       choices=["morning", "afternoon", "evening", "weekly"],
                       help="分析类型")
    parser.add_argument("--summary", action="store_true", help="显示总结报告")
    parser.add_argument("--history", type=int, metavar="DAYS", help="显示历史数据")
    parser.add_argument("--test", action="store_true", help="测试模式")
    
    args = parser.parse_args()
    
    # 创建系统实例
    system = IterativeOptimizationSystem()
    
    if args.summary:
        print(system.generate_summary_report())
    elif args.history:
        # 显示历史数据
        print(f"📈 显示最近{args.history}天历史数据")
    elif args.test:
        print("🧪 测试模式启动")
        # 运行测试
        system.run_prediction_summary_optimization_cycle(args.type)
    else:
        # 运行完整循环
        print("🚀 启动预测→总结→优化完整循环")
        success = system.run_prediction_summary_optimization_cycle(args.type)
        
        if success:
            print("\n✅ 完整循环执行成功")
            print(system.generate_summary_report())
        else:
            print("\n❌ 完整循环执行失败")
            return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
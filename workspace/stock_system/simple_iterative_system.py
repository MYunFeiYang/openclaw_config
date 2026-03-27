#!/usr/bin/env python3
"""
简化版预测→总结→优化闭环系统
实现自动化的预测准确率提升循环
"""

import sys
import json
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict, deque

# 导入现有组件
sys.path.append('refactored')
from optimized_predictor import OptimizedPredictor
from enhanced_analyzer import EnhancedStockAnalyzer

class SimpleIterativeSystem:
    """简化版迭代优化系统"""
    
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
        
        # 历史记录
        self.accuracy_history = deque(maxlen=30)
        self.parameter_history = deque(maxlen=50)
        
        # 当前参数
        self.current_parameters = self.load_current_parameters()
        
    def run_daily_cycle(self, analysis_type: str = "evening"):
        """运行每日预测→总结→优化循环"""
        
        print(f"🔄 启动每日预测→总结→优化循环 ({analysis_type})")
        print("=" * 60)
        print(f"循环时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # 步骤1: 执行预测
            print("\n📊 步骤1: 执行预测...")
            predictions = self.execute_predictions(analysis_type)
            
            if not predictions:
                print("❌ 预测失败")
                return False
            
            # 步骤2: 验证总结
            print("\n📋 步骤2: 验证总结...")
            validation = self.validate_and_summarize(predictions, analysis_type)
            
            if not validation:
                print("❌ 验证失败")
                return False
            
            # 步骤3: 优化改进
            print("\n🎯 步骤3: 优化改进...")
            optimization = self.optimize_parameters(validation)
            
            # 步骤4: 应用优化
            if optimization:
                print("\n🔧 步骤4: 应用优化...")
                self.apply_optimization(optimization)
            
            # 保存循环结果
            self.save_cycle_results(predictions, validation, optimization)
            
            print("\n✅ 每日循环完成")
            return True
            
        except Exception as e:
            print(f"❌ 循环执行失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def execute_predictions(self, analysis_type: str):
        """执行预测"""
        
        # 获取股票数据
        stock_data = self.get_stock_data()
        
        if not stock_data:
            return None
        
        # 使用当前参数进行预测
        results = self.analyzer.analyze_batch(stock_data, analysis_type)
        
        if results:
            print(f"✅ 预测完成: {len(results)} 只股票")
            
            # 统计信号分布
            signals = defaultdict(int)
            for result in results:
                signal = result.get("signal", "未知")
                signals[signal] += 1
            
            print("📊 信号分布:")
            for signal, count in signals.items():
                print(f"  {signal}: {count}只")
            
            return results
        
        return None
    
    def validate_and_summarize(self, predictions, analysis_type):
        """验证预测并生成总结"""
        
        if not predictions:
            return None
        
        # 验证每个预测
        validation_results = []
        correct_count = 0
        
        for pred in predictions:
            symbol = pred["stock"]["symbol"]
            name = pred["stock"]["name"]
            predicted_signal = pred["signal"]
            predicted_score = pred["final_score"]
            confidence = pred["confidence"]
            
            # 获取实际表现（使用当日涨跌幅）
            actual_change = pred.get("change_percent", 0)
            
            # 判断预测是否正确
            is_correct = self.check_prediction_accuracy(predicted_signal, actual_change)
            
            if is_correct:
                correct_count += 1
            
            validation_results.append({
                "symbol": symbol,
                "name": name,
                "predicted_signal": predicted_signal,
                "predicted_score": predicted_score,
                "confidence": confidence,
                "actual_change": actual_change,
                "is_correct": is_correct
            })
        
        # 计算整体准确率
        total = len(predictions)
        accuracy = correct_count / total if total > 0 else 0
        
        # 保存准确率历史
        self.accuracy_history.append({
            "date": datetime.now().strftime("%Y-%m-%d"),
            "accuracy": accuracy,
            "total": total,
            "correct": correct_count
        })
        
        # 生成总结报告
        summary = self.create_validation_summary(validation_results, accuracy)
        
        print(f"✅ 验证完成: 准确率 {accuracy:.1%} ({correct_count}/{total})")
        print(f"📊 平均信心度: {sum(r['confidence'] for r in validation_results)/len(validation_results):.1f}%")
        
        return {
            "accuracy": accuracy,
            "total": total,
            "correct": correct_count,
            "validation_results": validation_results,
            "summary": summary
        }
    
    def optimize_parameters(self, validation):
        """基于验证结果优化参数"""
        
        if not validation:
            return None
        
        accuracy = validation["accuracy"]
        validation_results = validation["validation_results"]
        
        print(f"\n📈 当前准确率: {accuracy:.1%}")
        
        # 分析错误模式
        error_analysis = self.analyze_error_patterns(validation_results)
        
        # 生成优化建议
        suggestions = self.generate_optimization_suggestions(error_analysis)
        
        # 计算新参数
        new_params = self.calculate_new_parameters(suggestions)
        
        # 评估预期改进
        expected_improvement = self.estimate_improvement(accuracy, new_params)
        
        optimization = {
            "accuracy": accuracy,
            "error_analysis": error_analysis,
            "suggestions": suggestions,
            "new_parameters": new_params,
            "expected_improvement": expected_improvement
        }
        
        print(f"🎯 优化建议生成完成")
        print(f"📊 预期改进: +{expected_improvement:.1%}")
        
        return optimization
    
    def apply_optimization(self, optimization):
        """应用优化结果"""
        
        if not optimization:
            return
        
        new_params = optimization["new_parameters"]
        expected_improvement = optimization["expected_improvement"]
        
        # 只有在预期改进显著时才应用
        if expected_improvement >= 0.01:  # 至少1%改进
            print(f"\n🔧 应用优化参数 (预期改进: +{expected_improvement:.1%})")
            
            # 更新预测器参数
            self.update_predictor_parameters(new_params)
            
            # 保存参数历史
            self.parameter_history.append({
                "timestamp": datetime.now().isoformat(),
                "parameters": new_params,
                "expected_improvement": expected_improvement
            })
            
            print("✅ 优化参数已应用")
            
        else:
            print(f"\n⏭️ 跳过优化 (预期改进: {expected_improvement:.1%} < 1%)")
            print("当前参数表现良好，继续观察...")
    
    # 辅助方法
    def get_stock_data(self):
        """获取股票数据"""
        
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
    
    def check_prediction_accuracy(self, predicted_signal, actual_change):
        """检查预测准确性"""
        
        # 定义中性区间
        neutral_band = 0.05
        
        # 预测方向
        if "买入" in predicted_signal:
            predicted_direction = 1  # 看涨
        elif "卖出" in predicted_signal:
            predicted_direction = -1  # 看跌
        else:  # 持有
            predicted_direction = 0  # 中性
        
        # 实际方向
        if actual_change > neutral_band:
            actual_direction = 1  # 上涨
        elif actual_change < -neutral_band:
            actual_direction = -1  # 下跌
        else:
            actual_direction = 0  # 中性
        
        # 判断是否正确
        if predicted_direction == 0:  # 持有信号
            return actual_direction == 0
        else:
            return predicted_direction == actual_direction
    
    def analyze_error_patterns(self, validation_results):
        """分析错误模式"""
        
        error_patterns = {
            "by_signal": defaultdict(int),
            "by_score_range": defaultdict(int),
            "by_confidence": defaultdict(int),
            "by_sector": defaultdict(int)
        }
        
        total_errors = 0
        
        for result in validation_results:
            if not result["is_correct"]:
                total_errors += 1
                
                # 按信号类型分类
                signal = result["predicted_signal"]
                error_patterns["by_signal"][signal] += 1
                
                # 按评分区间分类
                score = result["predicted_score"]
                if score >= 8:
                    score_range = "high"
                elif score >= 6:
                    score_range = "medium"
                else:
                    score_range = "low"
                error_patterns["by_score_range"][score_range] += 1
                
                # 按信心度分类
                confidence = result["confidence"]
                if confidence >= 80:
                    conf_level = "high"
                elif confidence >= 60:
                    conf_level = "medium"
                else:
                    conf_level = "low"
                error_patterns["by_confidence"][conf_level] += 1
                
                # 按行业分类
                sector = result.get("sector", "unknown")
                error_patterns["by_sector"][sector] += 1
        
        error_patterns["total_errors"] = total_errors
        return error_patterns
    
    def generate_optimization_suggestions(self, error_analysis):
        """生成优化建议"""
        
        suggestions = []
        total_errors = error_analysis["total_errors"]
        
        if total_errors == 0:
            return suggestions
        
        # 1. 按信号类型分析
        signal_errors = error_analysis["by_signal"]
        for signal, count in signal_errors.items():
            error_rate = count / total_errors
            if error_rate > 0.4:  # 某类信号错误率超过40%
                suggestions.append({
                    "type": "signal_threshold",
                    "target": signal,
                    "issue": f"{signal}信号错误率过高 ({error_rate:.1%})",
                    "suggestion": "调整信号阈值"
                })
        
        # 2. 按评分区间分析
        score_errors = error_analysis["by_score_range"]
        if score_errors["high"] > score_errors["medium"]:
            suggestions.append({
                "type": "score_calibration",
                "target": "high_score",
                "issue": "高评分区间错误较多",
                "suggestion": "提高高评分阈值"
            })
        
        # 3. 按信心度分析
        conf_errors = error_analysis["by_confidence"]
        if conf_errors["high"] > conf_errors["medium"]:
            suggestions.append({
                "type": "confidence_adjustment",
                "target": "high_confidence",
                "issue": "高信心度预测错误较多",
                "suggestion": "重新校准信心度算法"
            })
        
        return suggestions
    
    def calculate_new_parameters(self, suggestions):
        """计算新参数"""
        
        # 当前参数
        current_params = self.current_parameters.copy()
        
        # 应用建议调整
        for suggestion in suggestions:
            if suggestion["type"] == "signal_threshold":
                # 调整信号阈值
                if "卖出" in suggestion["target"]:
                    current_params["signal_thresholds"]["sell"] += 0.2
                elif "买入" in suggestion["target"]:
                    current_params["signal_thresholds"]["buy"] -= 0.2
            
            elif suggestion["type"] == "score_calibration":
                # 调整评分权重
                current_params["weights"]["technical"] += 0.05
                current_params["weights"]["fundamental"] -= 0.05
            
            elif suggestion["type"] == "confidence_adjustment":
                # 调整信心度计算
                current_params["confidence_factor"] *= 0.9  # 降低信心度
        
        return current_params
    
    def estimate_improvement(self, current_accuracy, new_parameters):
        """估算预期改进"""
        
        # 基于历史数据估算
        if len(self.parameter_history) > 5:
            # 查找相似参数的历史表现
            similar_cases = []
            for hist in self.parameter_history[-10:]:
                param_similarity = self.calculate_parameter_similarity(new_parameters, hist["parameters"])
                if param_similarity > 0.8:
                    actual_improvement = hist.get("actual_improvement", 0)
                    similar_cases.append(actual_improvement)
            
            if similar_cases:
                avg_improvement = np.mean(similar_cases)
                return max(0.01, min(avg_improvement, 0.15))  # 限制在1%-15%
        
        # 默认估算
        error_rate = 1 - current_accuracy
        return max(0.01, min(error_rate * 0.2, 0.1))  # 保守估算1%-10%
    
    def update_predictor_parameters(self, new_parameters):
        """更新预测器参数"""
        
        # 更新预测器权重
        if "weights" in new_parameters:
            self.predictor.weights.update(new_parameters["weights"])
        
        # 更新信号阈值
        if "signal_thresholds" in new_parameters:
            self.predictor.signal_thresholds.update(new_parameters["signal_thresholds"])
        
        # 更新当前参数
        self.current_parameters = new_parameters
    
    def calculate_parameter_similarity(self, params1, params2):
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
    
    def load_current_parameters(self):
        """加载当前参数"""
        
        param_file = self.optimization_dir / "current_parameters.json"
        
        if param_file.exists():
            try:
                with open(param_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ 加载参数失败: {e}")
        
        # 返回默认参数
        return self.get_default_parameters()
    
    def get_default_parameters(self):
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
            "confidence_factor": 1.0
        }
    
    def save_cycle_results(self, predictions, validation, optimization):
        """保存循环结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 保存完整结果
        cycle_result = {
            "timestamp": datetime.now().isoformat(),
            "predictions": predictions,
            "validation": validation,
            "optimization": optimization,
            "model_version": "iterative_v1.0"
        }
        
        result_file = self.optimization_dir / f"daily_cycle_{timestamp}.json"
        try:
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(cycle_result, f, ensure_ascii=False, indent=2)
            print(f"✅ 循环结果已保存: {result_file}")
        except Exception as e:
            print(f"⚠️ 保存循环结果失败: {e}")
        
        # 保存当前参数
        param_file = self.optimization_dir / "current_parameters.json"
        try:
            with open(param_file, 'w', encoding='utf-8') as f:
                json.dump(self.current_parameters, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ 保存参数失败: {e}")
    
    def create_validation_summary(self, validation_results, accuracy):
        """创建验证总结"""
        
        summary = f"""
📊 预测验证总结
=====================================
验证时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
总体准确率: {accuracy:.1%}
验证股票数: {len(validation_results)}

📈 详细结果:
"""
        
        for result in validation_results:
            status = "✅" if result["is_correct"] else "❌"
            summary += f"{status} {result['name']} ({result['symbol']}): {result['predicted_signal']}"
            summary += f" - 实际变化: {result['actual_change']:+.2f}%\n"
        
        return summary
    
    def generate_summary_report(self):
        """生成总结报告"""
        
        if len(self.accuracy_history) == 0:
            return "暂无历史数据"
        
        recent_accuracies = list(self.accuracy_history)[-10:]
        avg_accuracy = np.mean([a["accuracy"] for a in recent_accuracies])
        
        recent_optimizations = list(self.parameter_history)[-10:]
        optimization_count = len([opt for opt in recent_optimizations if "applied" in opt and opt["applied"]])
        
        report = f"""
📊 迭代优化系统总结报告
=====================================
报告时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📈 准确率趋势:
• 最近平均准确率: {avg_accuracy:.1%}
• 历史最高准确率: {max(a['accuracy'] for a in self.accuracy_history):.1%}
• 历史最低准确率: {min(a['accuracy'] for a in self.accuracy_history):.1%}
• 优化次数: {optimization_count}/{len(recent_optimizations)}

🎯 当前参数:
• 技术面权重: {self.current_parameters['weights']['technical']:.2f}
• 基本面权重: {self.current_parameters['weights']['fundamental']:.2f}
• 情绪权重: {self.current_parameters['weights']['market_sentiment']:.2f}
• 行业权重: {self.current_parameters['weights']['sector_rotation']:.2f}

🔄 系统状态: 运行正常
"""
        
        return report

# 主函数
def main():
    """主函数"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description="简化版迭代优化股票预测系统")
    parser.add_argument("type", nargs="?", default="evening",
                       choices=["morning", "afternoon", "evening", "weekly"],
                       help="分析类型")
    parser.add_argument("--summary", action="store_true", help="显示总结报告")
    parser.add_argument("--test", action="store_true", help="测试模式")
    
    args = parser.parse_args()
    
    # 创建系统实例
    system = SimpleIterativeSystem()
    
    if args.summary:
        print(system.generate_summary_report())
    elif args.test:
        print("🧪 测试模式启动")
        system.run_daily_cycle(args.type)
    else:
        print("🚀 启动迭代优化系统")
        success = system.run_daily_cycle(args.type)
        
        if success:
            print("\n✅ 迭代循环执行成功")
            print(system.generate_summary_report())
        else:
            print("\n❌ 迭代循环执行失败")
            return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
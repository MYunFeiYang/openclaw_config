#!/usr/bin/env python3
"""
股票预测循环改进系统
开盘前预测 → 开盘后验证 → 总结分析 → 模型优化 → 持续循环
"""

import json
import os
import sqlite3
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

_SYMBOL_SECTOR: Dict[str, str] = {
    "600519": "白酒",
    "300750": "新能源",
    "600036": "银行",
    "000858": "白酒",
    "600276": "医药",
    "002594": "新能源",
    "002415": "科技",
    "600887": "消费",
    "000002": "地产",
    "000725": "面板",
}


def _ensure_refactored_import_path() -> None:
    r = Path(__file__).resolve().parent / "refactored"
    s = str(r)
    if s not in sys.path:
        sys.path.insert(0, s)

@dataclass
class PredictionRecord:
    """预测记录"""
    prediction_id: str
    stock_symbol: str
    stock_name: str
    prediction_time: datetime
    prediction_type: str  # 'morning', 'closing', 'weekly'
    predicted_signal: str  # '买入', '卖出', '持有'
    predicted_score: float
    confidence: int
    predicted_change_percent: float
    actual_change_percent: Optional[float] = None
    accuracy_result: Optional[str] = None  # '正确', '错误', '部分正确'
    accuracy_score: Optional[float] = None  # 0-100
    validation_time: Optional[datetime] = None
    market_condition: Optional[str] = None
    model_version: str = "1.0"

@dataclass
class ModelPerformance:
    """模型性能指标"""
    model_version: str
    total_predictions: int
    correct_predictions: int
    direction_accuracy: float  # 方向准确率
    magnitude_accuracy: float  # 幅度准确率
    avg_confidence: float
    confidence_calibration: float  # 信心校准度
    avg_score: float
    last_updated: datetime

def _default_predictions_db_path() -> str:
    root = os.environ.get("STOCK_SYSTEM_ROOT")
    if root:
        return str(Path(root) / "predictions.db")
    return str(Path(__file__).resolve().parent / "predictions.db")


class PredictionDatabase:
    """预测数据库管理"""
    
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or _default_predictions_db_path()
        self.init_database()
    
    def init_database(self):
        """初始化数据库"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 预测记录表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                prediction_id TEXT PRIMARY KEY,
                stock_symbol TEXT NOT NULL,
                stock_name TEXT NOT NULL,
                prediction_time TEXT NOT NULL,
                prediction_type TEXT NOT NULL,
                predicted_signal TEXT NOT NULL,
                predicted_score REAL NOT NULL,
                confidence INTEGER NOT NULL,
                predicted_change_percent REAL NOT NULL,
                actual_change_percent REAL,
                accuracy_result TEXT,
                accuracy_score REAL,
                validation_time TEXT,
                market_condition TEXT,
                model_version TEXT NOT NULL
            )
        ''')
        
        # 模型性能表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_performance (
                model_version TEXT PRIMARY KEY,
                total_predictions INTEGER NOT NULL,
                correct_predictions INTEGER NOT NULL,
                direction_accuracy REAL NOT NULL,
                magnitude_accuracy REAL NOT NULL,
                avg_confidence REAL NOT NULL,
                confidence_calibration REAL NOT NULL,
                avg_score REAL NOT NULL,
                last_updated TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def save_prediction(self, prediction: PredictionRecord):
        """保存预测记录"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO predictions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            prediction.prediction_id,
            prediction.stock_symbol,
            prediction.stock_name,
            prediction.prediction_time.isoformat(),
            prediction.prediction_type,
            prediction.predicted_signal,
            prediction.predicted_score,
            prediction.confidence,
            prediction.predicted_change_percent,
            prediction.actual_change_percent,
            prediction.accuracy_result,
            prediction.accuracy_score,
            prediction.validation_time.isoformat() if prediction.validation_time else None,
            prediction.market_condition,
            prediction.model_version
        ))
        
        conn.commit()
        conn.close()
    
    def update_validation(self, prediction_id: str, actual_change: float, 
                         accuracy_result: str, accuracy_score: float):
        """更新验证结果"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE predictions 
            SET actual_change_percent = ?, accuracy_result = ?, accuracy_score = ?, validation_time = ?
            WHERE prediction_id = ?
        ''', (actual_change, accuracy_result, accuracy_score, 
              datetime.now().isoformat(), prediction_id))
        
        conn.commit()
        conn.close()
    
    def get_model_performance(self, model_version: str) -> Optional[ModelPerformance]:
        """获取模型性能数据"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM model_performance WHERE model_version = ?
        ''', (model_version,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return ModelPerformance(
                model_version=row[0],
                total_predictions=row[1],
                correct_predictions=row[2],
                direction_accuracy=row[3],
                magnitude_accuracy=row[4],
                avg_confidence=row[5],
                confidence_calibration=row[6],
                avg_score=row[7],
                last_updated=datetime.fromisoformat(row[8])
            )
        return None
    
    def save_model_performance(self, performance: ModelPerformance):
        """保存模型性能数据"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO model_performance VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            performance.model_version,
            performance.total_predictions,
            performance.correct_predictions,
            performance.direction_accuracy,
            performance.magnitude_accuracy,
            performance.avg_confidence,
            performance.confidence_calibration,
            performance.avg_score,
            performance.last_updated.isoformat()
        ))
        
        conn.commit()
        conn.close()

class PredictionValidator:
    """预测验证器"""
    
    def __init__(self, db: PredictionDatabase):
        self.db = db
    
    def validate_prediction(self, prediction: PredictionRecord, 
                          actual_price_change: float) -> Tuple[str, float]:
        """验证单个预测的准确性"""
        
        predicted_change = prediction.predicted_change_percent
        
        # 方向准确性 (0-100分)
        direction_correct = (predicted_change > 0 and actual_price_change > 0) or \
                           (predicted_change < 0 and actual_price_change < 0) or \
                           (abs(predicted_change) < 0.5 and abs(actual_price_change) < 0.5)
        
        direction_score = 100 if direction_correct else 0
        
        # 幅度准确性 (0-100分) - 基于相对误差
        if abs(predicted_change) < 0.5:  # 预测为持平
            magnitude_error = abs(actual_price_change)
        else:
            magnitude_error = abs(predicted_change - actual_price_change) / (abs(predicted_change) + 0.01)
        
        magnitude_score = max(0, 100 - magnitude_error * 100)
        
        # 综合评分 (方向权重60%，幅度权重40%)
        overall_score = direction_score * 0.6 + magnitude_score * 0.4
        
        # 结果分类
        if overall_score >= 80:
            result = "正确"
        elif overall_score >= 60:
            result = "部分正确"
        else:
            result = "错误"
        
        return result, overall_score
    
    def batch_validate_recent_predictions(self, hours_back: int = 24):
        """批量验证最近的预测"""
        
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        # 获取需要验证的预测
        cutoff_time = (datetime.now() - timedelta(hours=hours_back)).isoformat()
        
        cursor.execute('''
            SELECT prediction_id, stock_symbol, predicted_change_percent 
            FROM predictions 
            WHERE validation_time IS NULL AND prediction_time < ?
        ''', (cutoff_time,))
        
        predictions_to_validate = cursor.fetchall()
        conn.close()
        
        validated_count = 0
        for pred_id, symbol, predicted_change in predictions_to_validate:
            actual_change = self.get_actual_price_change(symbol)
            
            result, score = self.validate_prediction(
                PredictionRecord(
                    prediction_id=pred_id,
                    stock_symbol=symbol,
                    stock_name="",
                    prediction_time=datetime.now(),
                    prediction_type="",
                    predicted_signal="",
                    predicted_score=0,
                    confidence=0,
                    predicted_change_percent=predicted_change
                ),
                actual_change
            )
            
            self.db.update_validation(pred_id, actual_change, result, score)
            validated_count += 1
        
        return validated_count
    
    def get_actual_price_change(self, symbol: str) -> float:
        """与主 pipeline 一致：经 OpenClaw Agent 取该代码涨跌幅（百分比点数）。"""
        _ensure_refactored_import_path()
        from data_providers import get_default_provider
        from predict_then_summarize import StockConfig

        s = str(symbol).strip()
        stock = StockConfig(name=s, symbol=s, sector="消费", weight=0.5)
        try:
            return float(get_default_provider().fetch(stock).change_percent)
        except Exception:
            return 0.0

class ModelOptimizer:
    """模型优化器"""
    
    def __init__(self, db: PredictionDatabase):
        self.db = db
    
    def analyze_model_performance(self, model_version: str) -> Dict:
        """分析模型性能"""
        
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        # 获取验证过的预测数据
        cursor.execute('''
            SELECT predicted_signal, confidence, predicted_change_percent, 
                   actual_change_percent, accuracy_result, accuracy_score
            FROM predictions 
            WHERE model_version = ? AND accuracy_result IS NOT NULL
        ''', (model_version,))
        
        validated_predictions = cursor.fetchall()
        conn.close()
        
        if not validated_predictions:
            return {"error": "No validated predictions found"}
        
        # 计算各项指标
        total = len(validated_predictions)
        correct = sum(1 for row in validated_predictions if row[4] == "正确")
        partial_correct = sum(1 for row in validated_predictions if row[4] == "部分正确")
        
        direction_accuracy = (correct + partial_correct * 0.5) / total * 100
        
        # 幅度准确性
        magnitude_scores = [row[5] for row in validated_predictions if row[5] is not None]
        magnitude_accuracy = sum(magnitude_scores) / len(magnitude_scores) if magnitude_scores else 0
        
        # 信心校准
        confidence_scores = [row[1] for row in validated_predictions]
        avg_confidence = sum(confidence_scores) / len(confidence_scores)
        confidence_calibration = 100 - abs(avg_confidence - direction_accuracy)
        
        # 平均评分
        predicted_scores = [row[2] for row in validated_predictions]
        avg_score = sum(predicted_scores) / len(predicted_scores)
        
        performance = ModelPerformance(
            model_version=model_version,
            total_predictions=total,
            correct_predictions=correct,
            direction_accuracy=direction_accuracy,
            magnitude_accuracy=magnitude_accuracy,
            avg_confidence=avg_confidence,
            confidence_calibration=confidence_calibration,
            avg_score=avg_score,
            last_updated=datetime.now()
        )
        
        self.db.save_model_performance(performance)
        
        return {
            "model_version": model_version,
            "total_predictions": total,
            "correct_predictions": correct,
            "direction_accuracy": direction_accuracy,
            "magnitude_accuracy": magnitude_accuracy,
            "avg_confidence": avg_confidence,
            "confidence_calibration": confidence_calibration,
            "avg_score": avg_score,
            "improvement_suggestions": self.generate_improvement_suggestions(performance)
        }
    
    def generate_improvement_suggestions(self, performance: Optional[ModelPerformance]) -> List[str]:
        """生成改进建议"""
        
        if performance is None:
            return ["暂无性能数据，请先运行预测验证"]
        
        suggestions = []
        
        if performance.direction_accuracy < 70:
            suggestions.append("方向准确率偏低，建议优化技术指标权重和信号生成逻辑")
        
        if performance.magnitude_accuracy < 60:
            suggestions.append("幅度准确率不足，需要改进价格变动预测模型")
        
        if performance.confidence_calibration < 70:
            suggestions.append("信心校准度较差，建议调整信心度计算算法")
        
        if performance.avg_confidence > 80:
            suggestions.append("平均信心度过高，可能导致过度自信，建议降低信心度")
        
        if performance.avg_score < 6.0:
            suggestions.append("平均评分偏低，建议重新评估评分标准和权重分配")
        
        if not suggestions:
            suggestions.append("模型表现良好，建议持续监控并保持当前配置")
        
        return suggestions
    
    def suggest_parameter_adjustments(self, model_version: str) -> Dict:
        """建议参数调整"""
        
        performance = self.db.get_model_performance(model_version)
        if not performance:
            return {}
        
        adjustments = {}
        
        # 根据性能指标建议参数调整
        if performance.direction_accuracy < 65:
            adjustments["technical_weight"] = "增加技术面权重 (+10%)"
            adjustments["signal_threshold"] = "调整信号阈值，提高筛选标准"
        
        if performance.magnitude_accuracy < 55:
            adjustments["volatility_factor"] = "增加波动率因子"
            adjustments["price_momentum_weight"] = "加强价格动量权重"
        
        if performance.confidence_calibration < 65:
            adjustments["confidence_formula"] = "重新校准信心度公式"
            adjustments["uncertainty_handling"] = "增加不确定性处理机制"
        
        return adjustments

class PredictionCycleSystem:
    """预测循环改进系统主类"""
    
    def __init__(self):
        self.db = PredictionDatabase()
        self.validator = PredictionValidator(self.db)
        self.optimizer = ModelOptimizer(self.db)
        self.current_model_version = "2.0"
    
    def make_prediction(
        self,
        stock_symbol: str,
        stock_name: str,
        prediction_type: str,
        sector: Optional[str] = None,
        weight: float = 0.5,
    ) -> PredictionRecord:
        """生成预测（与 refactored PredictionEngine + 真实行情一致）"""
        _ensure_refactored_import_path()
        from data_providers import get_default_provider
        from predict_then_summarize import PredictionEngine, StockConfig

        sec = sector or _SYMBOL_SECTOR.get(stock_symbol.strip(), "消费")
        stock = StockConfig(
            name=stock_name, symbol=stock_symbol, sector=sec, weight=weight
        )
        engine = PredictionEngine(get_default_provider())
        r = engine.predict_stock(stock)
        prediction = PredictionRecord(
            prediction_id=f"{stock_symbol}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            stock_symbol=stock_symbol,
            stock_name=stock_name,
            prediction_time=r.prediction_time,
            prediction_type=prediction_type,
            predicted_signal=r.signal,
            predicted_score=r.final_score,
            confidence=r.confidence,
            predicted_change_percent=float(r.change_percent),
            model_version=self.current_model_version,
        )
        self.db.save_prediction(prediction)
        return prediction
    
    def validate_recent_predictions(self, hours_back: int = 24) -> int:
        """验证最近的预测"""
        return self.validator.batch_validate_recent_predictions(hours_back)
    
    def analyze_and_optimize(self) -> Dict:
        """分析性能并优化"""
        
        # 分析当前模型性能
        performance_analysis = self.optimizer.analyze_model_performance(self.current_model_version)
        
        # 获取当前性能数据
        current_performance = self.db.get_model_performance(self.current_model_version)
        
        # 生成改进建议
        suggestions = self.optimizer.generate_improvement_suggestions(current_performance)
        
        # 建议参数调整
        parameter_adjustments = self.optimizer.suggest_parameter_adjustments(self.current_model_version)
        
        return {
            "performance_analysis": performance_analysis,
            "current_performance": current_performance,
            "improvement_suggestions": suggestions,
            "parameter_adjustments": parameter_adjustments,
            "next_model_version": f"{float(self.current_model_version) + 0.1:.1f}"
        }
    
    def generate_improvement_report(self) -> str:
        """生成改进报告"""
        
        analysis = self.analyze_and_optimize()
        
        report_lines = []
        report_lines.append("【股票预测系统循环改进报告】")
        report_lines.append("=" * 60)
        report_lines.append(f"报告时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append(f"当前模型版本: {self.current_model_version}")
        report_lines.append("=" * 60)
        
        # 性能分析
        perf = analysis["performance_analysis"]
        current_perf = analysis.get("current_performance")
        
        if current_perf:
            report_lines.append("\n📊 模型性能分析:")
            report_lines.append(f"• 总预测数: {current_perf.total_predictions}")
            report_lines.append(f"• 方向准确率: {current_perf.direction_accuracy:.1f}%")
            report_lines.append(f"• 幅度准确率: {current_perf.magnitude_accuracy:.1f}%")
            report_lines.append(f"• 信心校准度: {current_perf.confidence_calibration:.1f}%")
            report_lines.append(f"• 平均评分: {current_perf.avg_score:.1f}/10")
        else:
            report_lines.append("\n📊 暂无性能数据，请先运行预测验证")
        
        # 改进建议
        report_lines.append("\n🔧 改进建议:")
        for i, suggestion in enumerate(analysis["improvement_suggestions"], 1):
            report_lines.append(f"{i}. {suggestion}")
        
        # 参数调整建议
        if analysis["parameter_adjustments"]:
            report_lines.append("\n⚙️ 参数调整建议:")
            for param, adjustment in analysis["parameter_adjustments"].items():
                report_lines.append(f"• {param}: {adjustment}")
        
        # 下一步行动
        report_lines.append(f"\n🎯 下一步行动:")
        report_lines.append(f"• 模型版本升级至: {analysis['next_model_version']}")
        report_lines.append("• 实施上述改进建议")
        report_lines.append("• 持续监控性能指标")
        report_lines.append("• 定期评估和调整")
        
        if current_perf:
            report_lines.append(f"\n🏆 目标: 将准确率从 {current_perf.direction_accuracy:.1f}% 提升至 75%+")
        
        return "\n".join(report_lines)

def main():
    """主函数演示"""
    
    system = PredictionCycleSystem()
    
    print("【股票预测循环改进系统】")
    print("=" * 60)
    
    # 1. 生成一些预测
    print("\n1️⃣ 生成预测...")
    predictions = [
        system.make_prediction("600519", "贵州茅台", "morning"),
        system.make_prediction("300750", "宁德时代", "morning"),
        system.make_prediction("600036", "招商银行", "morning")
    ]
    
    for pred in predictions:
        print(f"预测 {pred.stock_name}: {pred.predicted_signal} (信心度: {pred.confidence}%)")
    
    # 2. 验证预测（快照涨跌幅）
    print("\n2️⃣ 验证预测...")
    validated_count = system.validate_recent_predictions()
    print(f"验证了 {validated_count} 个预测")
    
    # 3. 分析优化
    print("\n3️⃣ 分析优化...")
    analysis = system.analyze_and_optimize()
    
    # 4. 生成改进报告
    print("\n4️⃣ 生成改进报告...")
    report = system.generate_improvement_report()
    print(report)
    
    # 保存报告
    _base = Path(os.environ.get("STOCK_SYSTEM_ROOT", Path(__file__).resolve().parent))
    report_file = str(_base / f"improvement_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n✅ 报告已保存: {report_file}")
    print("\n🔄 循环改进系统运行完成，等待下一次循环...")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
无依赖的准确率优化器 - 纯Python实现，不依赖外部机器学习库
"""

import json
import math
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class OptimizedPrediction:
    """优化后的预测结果"""
    symbol: str
    name: str
    predicted_direction: int  # -1:下跌, 0:震荡, 1:上涨
    confidence: float
    original_score: float
    optimized_score: float
    model_weights: Dict[str, float]
    key_factors: List[str]
    risk_level: str  # low, medium, high


class SimpleAccuracyOptimizer:
    """简化版准确率优化器 - 纯Python实现"""
    
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or self._default_base_dir())
        self.data_dir = self.base_dir / "data"
        self.models_dir = self.data_dir / "models"
        self.models_dir.mkdir(exist_ok=True)
        
        # 动态权重系统
        self.dynamic_weights = {
            'technical': 0.35,    # 技术面权重
            'fundamental': 0.25,  # 基本面权重
            'sentiment': 0.20,    # 情绪面权重
            'sector': 0.15,       # 行业面权重
            'market': 0.05        # 市场面权重
        }
        
        # 历史准确率追踪
        self.accuracy_history = []
        self.symbol_accuracy = {}  # 按股票统计准确率
        self.weight_adjustment_history = []
        
        # 模型参数（简化版）
        self.model_params = {
            'feature_weights': self._initialize_feature_weights(),
            'bias_terms': self._initialize_bias_terms(),
            'learning_rate': 0.01
        }
    
    def _default_base_dir(self) -> str:
        return os.environ.get(
            "STOCK_SYSTEM_ROOT",
            str(Path(__file__).resolve().parent.parent),
        )
    
    def _initialize_feature_weights(self) -> Dict[str, float]:
        """初始化特征权重"""
        return {
            # 技术面特征
            'rsi': 0.15,
            'macd': 0.12,
            'bollinger': 0.10,
            'volume': 0.08,
            'momentum': 0.08,
            'trend': 0.07,
            
            # 基本面特征
            'pe_ratio': 0.08,
            'pb_ratio': 0.06,
            'roe': 0.07,
            'growth': 0.06,
            'debt': 0.05,
            
            # 情绪面特征
            'market_heat': 0.05,
            'institution': 0.04,
            'retail_sentiment': 0.03,
            'news_sentiment': 0.03,
            
            # 行业面特征
            'sector_prosperity': 0.04,
            'policy_support': 0.03,
            'capital_flow': 0.02
        }
    
    def _initialize_bias_terms(self) -> Dict[str, float]:
        """初始化偏置项"""
        return {
            'up_trend': 0.2,
            'down_trend': -0.2,
            'high_volatility': -0.1,
            'low_volatility': 0.1,
            'strong_fundamental': 0.15,
            'weak_fundamental': -0.15
        }
    
    def extract_features(self, stock_data: Dict) -> Dict[str, float]:
        """提取特征"""
        features = {}
        
        # 技术面特征
        technical = stock_data.get('technical', {})
        features['rsi'] = (technical.get('rsi', 50) - 50) / 50  # 标准化到[-1, 1]
        features['macd'] = 1.0 if technical.get('macd_signal', 'neutral') == 'golden_cross' else -1.0 if technical.get('macd_signal', 'neutral') == 'death_cross' else 0.0
        features['bollinger'] = max(-1.0, min(1.0, technical.get('bollinger_position', 0) / 2.0))
        features['volume'] = (technical.get('volume_ratio', 1.0) - 1.0) / 2.0
        features['momentum'] = max(-1.0, min(1.0, technical.get('momentum_5d', 0) / 0.05))
        features['trend'] = 1.0 if technical.get('trend_strength', 'weak') == 'strong' else -1.0 if technical.get('trend_strength', 'weak') == 'weak' else 0.0
        
        # 基本面特征
        fundamental = stock_data.get('fundamental', {})
        pe_ratio = fundamental.get('pe_ratio', 20)
        pb_ratio = fundamental.get('pb_ratio', 2)
        roe = fundamental.get('roe', 10)
        growth_rate = fundamental.get('growth_rate', 10)
        debt_ratio = fundamental.get('debt_ratio', 0.5)
        
        features['pe_ratio'] = max(-1.0, min(1.0, (30 - pe_ratio) / 20.0))  # PE越低越好
        features['pb_ratio'] = max(-1.0, min(1.0, (5 - pb_ratio) / 3.0))    # PB越低越好
        features['roe'] = max(-1.0, min(1.0, (roe - 10) / 10.0))          # ROE越高越好
        features['growth'] = max(-1.0, min(1.0, growth_rate / 20.0))        # 增长率越高越好
        features['debt'] = max(-1.0, min(1.0, (0.3 - debt_ratio) / 0.3))    # 负债率越低越好
        
        # 情绪面特征
        sentiment = stock_data.get('sentiment', {})
        features['market_heat'] = (sentiment.get('market_heat', 50) - 50) / 50
        features['institution'] = (sentiment.get('institution_attention', 50) - 50) / 50
        features['retail_sentiment'] = sentiment.get('retail_sentiment_score', 0)
        features['news_sentiment'] = sentiment.get('news_sentiment_score', 0)
        
        # 行业面特征
        sector = stock_data.get('sector', {})
        features['sector_prosperity'] = (sector.get('prosperity', 50) - 50) / 50
        features['policy_support'] = (sector.get('policy_support', 50) - 50) / 50
        features['capital_flow'] = (sector.get('capital_flow', 50) - 50) / 50
        
        return features
    
    def calculate_ml_score(self, features: Dict[str, float]) -> Tuple[float, float]:
        """计算机器学习分数"""
        
        # 基础分数计算（加权求和）
        base_score = 0.0
        for feature_name, feature_value in features.items():
            if feature_name in self.model_params['feature_weights']:
                weight = self.model_params['feature_weights'][feature_name]
                base_score += weight * feature_value
        
        # 添加偏置项
        bias_score = 0.0
        for bias_name, bias_value in self.model_params['bias_terms'].items():
            if self._should_apply_bias(bias_name, features):
                bias_score += bias_value
        
        # 综合分数
        ml_score = base_score + bias_score
        
        # 转换为0-10分制
        ml_score = (ml_score + 1.0) * 5.0  # [-1, 1] -> [0, 10]
        ml_score = max(0.0, min(10.0, ml_score))
        
        # 置信度计算（基于特征一致性）
        feature_consistency = self._calculate_feature_consistency(features)
        confidence = 0.5 + (feature_consistency * 0.4)  # 50%-90%
        
        return ml_score, confidence
    
    def _should_apply_bias(self, bias_name: str, features: Dict[str, float]) -> bool:
        """判断是否应用偏置项"""
        
        if bias_name == 'up_trend':
            return features.get('trend', 0) > 0.5 and features.get('momentum', 0) > 0.3
        elif bias_name == 'down_trend':
            return features.get('trend', 0) < -0.5 and features.get('momentum', 0) < -0.3
        elif bias_name == 'high_volatility':
            return abs(features.get('bollinger', 0)) > 0.8
        elif bias_name == 'low_volatility':
            return abs(features.get('bollinger', 0)) < 0.3
        elif bias_name == 'strong_fundamental':
            return (features.get('roe', 0) > 0.5 and features.get('growth', 0) > 0.3 and 
                   features.get('debt', 0) > -0.3)
        elif bias_name == 'weak_fundamental':
            return (features.get('roe', 0) < -0.3 or features.get('growth', 0) < -0.5 or 
                   features.get('debt', 0) < -0.5)
        
        return False
    
    def _calculate_feature_consistency(self, features: Dict[str, float]) -> float:
        """计算特征一致性（用于置信度）"""
        
        # 技术面一致性
        tech_features = [features.get('rsi', 0), features.get('macd', 0), 
                          features.get('bollinger', 0), features.get('trend', 0)]
        tech_consistency = self._calculate_direction_consistency(tech_features)
        
        # 基本面一致性
        fund_features = [features.get('roe', 0), features.get('growth', 0), 
                        features.get('pe_ratio', 0), features.get('pb_ratio', 0)]
        fund_consistency = self._calculate_direction_consistency(fund_features)
        
        # 情绪面一致性
        sentiment_features = [features.get('market_heat', 0), features.get('institution', 0),
                             features.get('retail_sentiment', 0), features.get('news_sentiment', 0)]
        sentiment_consistency = self._calculate_direction_consistency(sentiment_features)
        
        # 综合一致性
        overall_consistency = (tech_consistency * 0.4 + fund_consistency * 0.3 + 
                              sentiment_consistency * 0.3)
        
        return max(0.0, min(1.0, overall_consistency))
    
    def _calculate_direction_consistency(self, features: List[float]) -> float:
        """计算方向一致性"""
        
        if not features:
            return 0.0
        
        positive_count = sum(1 for f in features if f > 0.1)
        negative_count = sum(1 for f in features if f < -0.1)
        total_count = len(features)
        
        # 计算一致性（多数方向的一致性）
        max_direction = max(positive_count, negative_count)
        consistency = max_direction / total_count
        
        return consistency
    
    def optimize_prediction(self, stock_data: Dict, market_condition: str = "normal") -> OptimizedPrediction:
        """优化预测 - 核心方法"""
        
        # 提取特征
        features = self.extract_features(stock_data)
        
        # 计算ML分数
        ml_score, ml_confidence = self.calculate_ml_score(features)
        
        # 根据市场条件调整权重
        adjusted_weights = self._adjust_weights_for_market(market_condition)
        
        # 计算优化后的综合评分
        optimized_score = self._calculate_optimized_score(
            stock_data, ml_score, ml_confidence, adjusted_weights
        )
        
        # 确定预测方向
        predicted_direction = self._determine_direction(optimized_score, ml_confidence)
        
        # 确定风险等级
        risk_level = self._assess_risk_level(stock_data, predicted_direction, ml_confidence)
        
        # 识别关键因素
        key_factors = self._identify_key_factors(features, ml_score, ml_confidence)
        
        return OptimizedPrediction(
            symbol=stock_data.get('symbol', ''),
            name=stock_data.get('name', ''),
            predicted_direction=predicted_direction,
            confidence=ml_confidence,
            original_score=stock_data.get('final_score', 5.0),
            optimized_score=optimized_score,
            model_weights=adjusted_weights,
            key_factors=key_factors,
            risk_level=risk_level
        )
    
    def _adjust_weights_for_market(self, market_condition: str) -> Dict[str, float]:
        """根据市场条件调整权重"""
        
        adjusted_weights = self.dynamic_weights.copy()
        
        if market_condition == "trending":
            # 趋势市场：技术面更重要
            adjusted_weights['technical'] = 0.45
            adjusted_weights['fundamental'] = 0.20
            adjusted_weights['sentiment'] = 0.15
            
        elif market_condition == "volatile":
            # 震荡市场：基本面更重要
            adjusted_weights['technical'] = 0.25
            adjusted_weights['fundamental'] = 0.35
            adjusted_weights['sentiment'] = 0.25
            
        elif market_condition == "bull":
            # 牛市：情绪和行业更重要
            adjusted_weights['sentiment'] = 0.30
            adjusted_weights['sector'] = 0.20
            adjusted_weights['technical'] = 0.30
            
        elif market_condition == "bear":
            # 熊市：基本面和风险控制更重要
            adjusted_weights['fundamental'] = 0.40
            adjusted_weights['market'] = 0.10
            adjusted_weights['sentiment'] = 0.15
        
        return adjusted_weights
    
    def _calculate_optimized_score(self, stock_data: Dict, ml_score: float, 
                                 ml_confidence: float, weights: Dict[str, float]) -> float:
        """计算优化后的综合评分"""
        
        # 基础评分（原始评分）
        base_score = stock_data.get('final_score', 5.0)
        
        # ML模型分数
        ml_contribution = (ml_score - 5.0) * ml_confidence * 0.6  # ML贡献度
        
        # 历史准确率奖励
        accuracy_bonus = self._get_accuracy_bonus(stock_data.get('symbol', ''))
        
        # 市场条件调整
        market_adjustment = self._get_market_adjustment(stock_data)
        
        # 计算最终优化分数
        optimized_score = (
            base_score * 0.4 +  # 原始评分权重降低
            ml_contribution * 0.4 +  # ML贡献
            accuracy_bonus * 0.1 +  # 准确率奖励
            market_adjustment * 0.1  # 市场调整
        )
        
        # 限制在0-10范围内
        return max(0.0, min(10.0, optimized_score + 5.0))  # 调整到0-10范围
    
    def _get_accuracy_bonus(self, symbol: str) -> float:
        """基于历史准确率的奖励"""
        
        if symbol not in self.symbol_accuracy:
            return 0.0
        
        accuracy = self.symbol_accuracy[symbol]
        
        if accuracy > 0.85:
            return 1.0  # 高准确率奖励
        elif accuracy > 0.75:
            return 0.5
        elif accuracy > 0.65:
            return 0.2
        elif accuracy < 0.45:
            return -0.5  # 低准确率惩罚
        else:
            return 0.0
    
    def _get_market_adjustment(self, stock_data: Dict) -> float:
        """获取市场条件调整"""
        
        market_data = stock_data.get('market', {})
        market_trend = market_data.get('market_trend', 0)
        sector_rotation = market_data.get('sector_rotation', 50)
        
        # 市场趋势调整
        trend_adjustment = market_trend * 2.0
        
        # 行业轮动调整
        rotation_adjustment = (sector_rotation - 50) / 50 * 0.5
        
        return trend_adjustment + rotation_adjustment
    
    def _determine_direction(self, optimized_score: float, confidence: float) -> int:
        """确定预测方向"""
        
        # 基于优化分数和置信度
        if optimized_score >= 7.5 and confidence >= 0.7:
            return 1  # 强烈上涨
        elif optimized_score >= 6.5 and confidence >= 0.6:
            return 1  # 上涨
        elif optimized_score <= 2.5 and confidence >= 0.7:
            return -1  # 强烈下跌
        elif optimized_score <= 3.5 and confidence >= 0.6:
            return -1  # 下跌
        else:
            return 0  # 震荡/中性
    
    def _assess_risk_level(self, stock_data: Dict, direction: int, confidence: float) -> str:
        """评估风险等级"""
        
        risk_score = 0
        
        # 波动率风险
        technical = stock_data.get('technical', {})
        volatility = technical.get('volatility_10d', 0)
        if volatility > 0.05:
            risk_score += 3
        elif volatility > 0.03:
            risk_score += 2
        elif volatility > 0.02:
            risk_score += 1
        
        # 置信度风险
        if confidence < 0.6:
            risk_score += 2
        elif confidence < 0.7:
            risk_score += 1
        
        # 方向风险（逆势预测风险更高）
        market_trend = stock_data.get('market', {}).get('market_trend', 0)
        if direction != 0 and direction != (1 if market_trend > 0 else -1):
            risk_score += 1
        
        # 基本面风险
        fundamental = stock_data.get('fundamental', {})
        if fundamental.get('debt_ratio', 0.5) > 0.7:
            risk_score += 1
        if fundamental.get('roe', 10) < 5:
            risk_score += 1
        
        # 确定风险等级
        if risk_score >= 6:
            return "high"
        elif risk_score >= 3:
            return "medium"
        else:
            return "low"
    
    def _identify_key_factors(self, features: Dict[str, float], ml_score: float, confidence: float) -> List[str]:
        """识别影响预测的关键因素"""
        
        key_factors = []
        
        # 基于特征重要性排序
        feature_importance = []
        for feature_name, feature_value in features.items():
            if feature_name in self.model_params['feature_weights']:
                weight = self.model_params['feature_weights'][feature_name]
                impact = abs(feature_value * weight)  # 影响力 = |特征值 × 权重|
                feature_importance.append((feature_name, impact, feature_value))
        
        # 按影响力排序，取前3个
        feature_importance.sort(key=lambda x: x[1], reverse=True)
        
        for name, impact, value in feature_importance[:3]:
            if impact > 0.05:  # 影响力阈值
                direction = "正向" if value > 0 else "负向"
                key_factors.append(f"{name}({direction})")
        
        # 添加特殊信号
        if abs(features.get('rsi', 0)) > 0.7:
            key_factors.append(f"RSI{'超买' if features['rsi'] > 0 else '超卖'}")
        
        if features.get('macd', 0) != 0:
            key_factors.append(f"MACD{'金叉' if features['macd'] > 0 else '死叉'}")
        
        if confidence > 0.8:
            key_factors.append("高置信度")
        elif confidence < 0.6:
            key_factors.append("低置信度")
        
        return key_factors[:3]  # 限制为3个关键因素
    
    def update_with_actual(self, symbol: str, predicted_direction: int, actual_change: float):
        """用实际结果更新模型"""
        
        # 确定实际方向
        if actual_change > 0.8:
            actual_direction = 1
        elif actual_change < -0.8:
            actual_direction = -1
        else:
            actual_direction = 0
        
        # 记录准确率
        is_correct = (predicted_direction == actual_direction)
        
        accuracy_record = {
            'symbol': symbol,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'predicted_direction': predicted_direction,
            'actual_direction': actual_direction,
            'actual_change': actual_change,
            'correct': is_correct,
            'timestamp': datetime.now().isoformat()
        }
        
        self.accuracy_history.append(accuracy_record)
        
        # 更新股票特定准确率
        if symbol not in self.symbol_accuracy:
            self.symbol_accuracy[symbol] = []
        
        self.symbol_accuracy[symbol].append(is_correct)
        
        # 保持最近20条记录
        if len(self.symbol_accuracy[symbol]) > 20:
            self.symbol_accuracy[symbol] = self.symbol_accuracy[symbol][-20:]
        
        # 定期调整权重（每10次预测后）
        if len(self.accuracy_history) % 10 == 0:
            self._adjust_weights_based_on_performance()
    
    def _adjust_weights_based_on_performance(self):
        """基于表现调整权重"""
        
        if len(self.accuracy_history) < 20:
            return
        
        # 计算最近20次的整体准确率
        recent_records = self.accuracy_history[-20:]
        accuracy = sum(1 for r in recent_records if r['correct']) / len(recent_records)
        
        # 如果准确率低于目标，调整权重
        if accuracy < 0.8:  # 目标80%准确率
            print(f"📊 当前准确率 {accuracy:.1%}，调整权重以提升表现")
            
            # 简单的权重调整策略
            adjustment_factor = 0.05
            
            if accuracy < 0.7:
                # 严重低于目标，大幅调整
                self.dynamic_weights['technical'] += adjustment_factor * 2
                self.dynamic_weights['fundamental'] += adjustment_factor
            elif accuracy < 0.75:
                # 中等偏离，适度调整
                self.dynamic_weights['technical'] += adjustment_factor
            
            # 归一化权重
            total_weight = sum(self.dynamic_weights.values())
            for key in self.dynamic_weights:
                self.dynamic_weights[key] /= total_weight
            
            # 记录调整历史
            adjustment_record = {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'accuracy_before': accuracy,
                'new_weights': self.dynamic_weights.copy(),
                'timestamp': datetime.now().isoformat()
            }
            
            self.weight_adjustment_history.append(adjustment_record)
            
            print(f"🔧 权重已调整: {self.dynamic_weights}")
    
    def get_performance_summary(self) -> Dict:
        """获取性能总结"""
        
        if not self.accuracy_history:
            return {
                'total_predictions': 0,
                'overall_accuracy': 0,
                'recent_accuracy': 0,
                'symbol_specific_accuracy': {},
                'improvement_trend': 'no_data'
            }
        
        total_predictions = len(self.accuracy_history)
        correct_predictions = sum(1 for r in self.accuracy_history if r['correct'])
        overall_accuracy = correct_predictions / total_predictions
        
        # 最近10次的准确率
        recent_records = self.accuracy_history[-10:] if total_predictions >= 10 else self.accuracy_history
        recent_accuracy = sum(1 for r in recent_records if r['correct']) / len(recent_records)
        
        # 按股票统计准确率
        symbol_accuracy = {}
        for symbol, records in self.symbol_accuracy.items():
            if records:
                symbol_accuracy[symbol] = sum(records) / len(records)
        
        # 趋势分析
        if total_predictions >= 20:
            early_half = self.accuracy_history[:total_predictions//2]
            recent_half = self.accuracy_history[total_predictions//2:]
            
            early_accuracy = sum(1 for r in early_half if r['correct']) / len(early_half)
            recent_half_accuracy = sum(1 for r in recent_half if r['correct']) / len(recent_half)
            
            if recent_half_accuracy > early_accuracy * 1.05:
                trend = 'improving'
            elif recent_half_accuracy < early_accuracy * 0.95:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'insufficient_data'
        
        return {
            'total_predictions': total_predictions,
            'overall_accuracy': overall_accuracy,
            'recent_accuracy': recent_accuracy,
            'symbol_specific_accuracy': symbol_accuracy,
            'improvement_trend': trend,
            'current_weights': self.dynamic_weights,
            'weight_adjustments': len(self.weight_adjustment_history)
        }
    
    def save_model(self, filename: str = None):
        """保存模型"""
        
        if filename is None:
            filename = f"simple_optimizer_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        filepath = self.models_dir / filename
        
        model_data = {
            'dynamic_weights': self.dynamic_weights,
            'model_params': self.model_params,
            'accuracy_history': self.accuracy_history[-100:],  # 只保存最近100条
            'symbol_accuracy': {k: v[-20:] for k, v in self.symbol_accuracy.items()},  # 最近20条
            'weight_adjustment_history': self.weight_adjustment_history[-50:],  # 最近50条
            'created_at': datetime.now().isoformat(),
            'version': '1.0'
        }
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(model_data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ 模型已保存: {filepath}")
            return str(filepath)
            
        except Exception as e:
            print(f"❌ 保存模型失败: {e}")
            return None
    
    def load_model(self, filepath: str) -> bool:
        """加载模型"""
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                model_data = json.load(f)
            
            self.dynamic_weights = model_data.get('dynamic_weights', self.dynamic_weights)
            self.model_params = model_data.get('model_params', self.model_params)
            self.accuracy_history = model_data.get('accuracy_history', [])
            self.symbol_accuracy = model_data.get('symbol_accuracy', {})
            self.weight_adjustment_history = model_data.get('weight_adjustment_history', [])
            
            print(f"✅ 模型已加载: {filepath}")
            return True
            
        except Exception as e:
            print(f"❌ 加载模型失败: {e}")
            return False


def main():
    """测试简化版准确率优化器"""
    
    print("🚀 测试简化版准确率优化器")
    print("=" * 60)
    
    optimizer = SimpleAccuracyOptimizer()
    
    # 模拟股票数据
    test_stock = {
        'symbol': '600519',
        'name': '贵州茅台',
        'technical': {
            'rsi': 35,
            'macd_signal': 'golden_cross',
            'bollinger_position': -1.5,
            'volume_ratio': 1.2,
            'momentum_5d': 0.02,
            'trend_strength': 'medium'
        },
        'fundamental': {
            'pe_ratio': 25,
            'pb_ratio': 3.5,
            'roe': 15,
            'growth_rate': 12,
            'debt_ratio': 0.3
        },
        'sentiment': {
            'market_heat': 65,
            'institution_attention': 70,
            'retail_sentiment_score': 0.3,
            'news_sentiment_score': 0.2
        },
        'sector': {
            'prosperity': 75,
            'policy_support': 80,
            'capital_flow': 60
        },
        'market': {
            'market_trend': 0.01,
            'sector_rotation': 65
        },
        'final_score': 6.5
    }
    
    # 测试预测
    print("📊 测试预测功能...")
    optimized = optimizer.optimize_prediction(test_stock, "normal")
    
    print(f"\n📈 优化预测结果:")
    print(f"   股票: {optimized.name} ({optimized.symbol})")
    print(f"   预测方向: {'上涨' if optimized.predicted_direction == 1 else '下跌' if optimized.predicted_direction == -1 else '震荡'}")
    print(f"   置信度: {optimized.confidence:.1%}")
    print(f"   原始评分: {optimized.original_score:.1f}")
    print(f"   优化评分: {optimized.optimized_score:.1f}")
    print(f"   风险等级: {optimized.risk_level}")
    print(f"   关键因素: {', '.join(optimized.key_factors)}")
    
    # 模拟更新实际结果
    print(f"\n🔄 模拟更新实际结果...")
    optimizer.update_with_actual(optimized.symbol, optimized.predicted_direction, 1.2)
    
    # 性能总结
    performance = optimizer.get_performance_summary()
    print(f"\n📊 性能总结:")
    print(f"   总预测次数: {performance['total_predictions']}")
    print(f"   整体准确率: {performance['overall_accuracy']:.1%}")
    print(f"   最近准确率: {performance['recent_accuracy']:.1%}")
    print(f"   改进趋势: {performance['improvement_trend']}")
    print(f"   权重调整次数: {performance['weight_adjustments']}")
    
    # 保存模型
    model_path = optimizer.save_model()
    if model_path:
        print(f"\n💾 模型已保存: {model_path}")
    
    print(f"\n✅ 测试完成！")


if __name__ == "__main__":
    import os
    main()
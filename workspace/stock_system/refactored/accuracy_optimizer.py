#!/usr/bin/env python3
"""
准确率优化核心模块 - 以提升方向准确率为第一优先级
"""

import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path


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


class AccuracyOptimizer:
    """准确率优化器 - 核心目标：方向准确率 >90%"""
    
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or self._default_base_dir())
        self.model_dir = self.base_dir / "models"
        self.data_dir = self.base_dir / "data"
        self.model_dir.mkdir(exist_ok=True)
        
        # 核心模型
        self.rf_model = None
        self.gb_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # 动态权重系统
        self.dynamic_weights = {
            'technical': 0.35,    # 技术面权重
            'fundamental': 0.25,  # 基本面权重
            'sentiment': 0.20,    # 情绪面权重
            'sector': 0.15,       # 行业面权重
            'market': 0.05        # 市场面权重
        }
        
        # 准确率追踪
        self.accuracy_history = []
        self.weight_adjustment_history = []
    
    def _default_base_dir(self) -> str:
        return os.environ.get(
            "STOCK_SYSTEM_ROOT",
            str(Path(__file__).resolve().parent.parent),
        )
    
    def prepare_features(self, stock_data: Dict) -> np.ndarray:
        """准备机器学习特征"""
        
        features = []
        
        # 技术面特征 (8个)
        technical = stock_data.get('technical', {})
        features.extend([
            technical.get('rsi', 50) / 100,           # RSI标准化
            technical.get('macd_signal', 0) + 1,     # MACD信号
            technical.get('bollinger_position', 0),  # 布林带位置
            technical.get('volume_ratio', 1),        # 成交量比率
            technical.get('momentum_5d', 0),         # 5日动量
            technical.get('price_vs_ma20', 0),       # 价格vs20日均线
            technical.get('volatility_10d', 0),      # 10日波动率
            1 if technical.get('trend_strength', 'weak') == 'strong' else 0  # 趋势强度
        ])
        
        # 基本面特征 (6个)
        fundamental = stock_data.get('fundamental', {})
        features.extend([
            fundamental.get('pe_ratio', 20) / 100,        # 市盈率
            fundamental.get('pb_ratio', 2) / 10,        # 市净率
            fundamental.get('roe', 10) / 100,            # 净资产收益率
            fundamental.get('growth_rate', 10) / 100,     # 增长率
            fundamental.get('debt_ratio', 0.5),           # 负债率
            1 if fundamental.get('profit_trend', 'stable') == 'up' else 0  # 盈利趋势
        ])
        
        # 情绪面特征 (4个)
        sentiment = stock_data.get('sentiment', {})
        features.extend([
            sentiment.get('market_heat', 50) / 100,      # 市场热度
            sentiment.get('institution_attention', 50) / 100,  # 机构关注度
            sentiment.get('retail_sentiment_score', 0),  # 散户情绪分数
            sentiment.get('news_sentiment_score', 0)    # 新闻情绪分数
        ])
        
        # 行业面特征 (3个)
        sector = stock_data.get('sector', {})
        features.extend([
            sector.get('prosperity', 50) / 100,         # 行业景气度
            sector.get('policy_support', 50) / 100,    # 政策支持度
            sector.get('capital_flow', 50) / 100         # 资金流向
        ])
        
        # 市场面特征 (2个)
        market = stock_data.get('market', {})
        features.extend([
            market.get('market_trend', 50) / 100,      # 大盘趋势
            market.get('sector_rotation', 50) / 100    # 行业轮动
        ])
        
        return np.array(features).reshape(1, -1)
    
    def train_models(self, training_data: List[Dict]) -> bool:
        """训练机器学习模型"""
        
        try:
            print("🚀 开始训练准确率优化模型...")
            
            # 准备训练数据
            X_train = []
            y_train = []
            
            for data in training_data:
                features = self.prepare_features(data['features'])
                X_train.append(features.flatten())
                
                # 标签：基于实际涨跌方向
                actual_change = data.get('actual_change', 0)
                if actual_change > 0.8:
                    y_train.append(1)  # 上涨
                elif actual_change < -0.8:
                    y_train.append(-1)  # 下跌
                else:
                    y_train.append(0)  # 震荡
            
            X_train = np.array(X_train)
            y_train = np.array(y_train)
            
            # 标准化特征
            X_train_scaled = self.scaler.fit_transform(X_train)
            
            # 训练随机森林模型
            print("📊 训练随机森林模型...")
            self.rf_model = RandomForestClassifier(
                n_estimators=200,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            self.rf_model.fit(X_train_scaled, y_train)
            
            # 训练梯度提升模型
            print("📈 训练梯度提升模型...")
            self.gb_model = GradientBoostingClassifier(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=8,
                random_state=42
            )
            self.gb_model.fit(X_train_scaled, y_train)
            
            # 交叉验证评估
            rf_scores = cross_val_score(self.rf_model, X_train_scaled, y_train, cv=5)
            gb_scores = cross_val_score(self.gb_model, X_train_scaled, y_train, cv=5)
            
            print(f"✅ 模型训练完成！")
            print(f"   随机森林准确率: {rf_scores.mean():.3f} (+/- {rf_scores.std() * 2:.3f})")
            print(f"   梯度提升准确率: {gb_scores.mean():.3f} (+/- {gb_scores.std() * 2:.3f})")
            
            # 保存模型
            self.save_models()
            self.is_trained = True
            
            return True
            
        except Exception as e:
            print(f"❌ 模型训练失败: {e}")
            return False
    
    def predict_with_ml(self, stock_data: Dict) -> Tuple[int, float, Dict]:
        """使用机器学习模型预测"""
        
        if not self.is_trained:
            print("⚠️  模型未训练，使用传统方法")
            return self._traditional_prediction(stock_data)
        
        try:
            # 准备特征
            features = self.prepare_features(stock_data)
            features_scaled = self.scaler.transform(features)
            
            # 获取两个模型的预测
            rf_pred = self.rf_model.predict(features_scaled)[0]
            gb_pred = self.gb_model.predict(features_scaled)[0]
            
            rf_proba = self.rf_model.predict_proba(features_scaled)[0]
            gb_proba = self.gb_model.predict_proba(features_scaled)[0]
            
            # 集成预测（加权平均）
            rf_weight = 0.6  # 随机森林权重更高
            gb_weight = 0.4
            
            # 方向预测
            ensemble_pred = int(rf_weight * rf_pred + gb_weight * gb_pred)
            
            # 置信度计算
            rf_confidence = max(rf_proba) if rf_pred == ensemble_pred else min(rf_proba)
            gb_confidence = max(gb_proba) if gb_pred == ensemble_pred else min(gb_proba)
            
            ensemble_confidence = rf_weight * rf_confidence + gb_weight * gb_confidence
            
            # 模型详细信息
            model_details = {
                'rf_prediction': int(rf_pred),
                'rf_confidence': float(rf_confidence),
                'gb_prediction': int(gb_pred),
                'gb_confidence': float(gb_confidence),
                'ensemble_prediction': int(ensemble_pred),
                'ensemble_confidence': float(ensemble_confidence),
                'feature_importance': self._get_feature_importance()
            }
            
            return ensemble_pred, ensemble_confidence, model_details
            
        except Exception as e:
            print(f"⚠️  ML预测失败，回退到传统方法: {e}")
            return self._traditional_prediction(stock_data)
    
    def _traditional_prediction(self, stock_data: Dict) -> Tuple[int, float, Dict]:
        """传统预测方法（回退方案）"""
        
        # 基于综合评分的简单预测
        final_score = stock_data.get('final_score', 5.0)
        
        if final_score >= 7.5:
            direction = 1
            confidence = 0.7
        elif final_score >= 6.5:
            direction = 1
            confidence = 0.6
        elif final_score >= 5.5:
            direction = 0
            confidence = 0.5
        elif final_score >= 4.5:
            direction = -1
            confidence = 0.6
        else:
            direction = -1
            confidence = 0.7
        
        model_details = {
            'method': 'traditional',
            'original_score': final_score,
            'confidence': confidence
        }
        
        return direction, confidence, model_details
    
    def _get_feature_importance(self) -> Dict[str, float]:
        """获取特征重要性"""
        
        if not self.is_trained:
            return {}
        
        feature_names = [
            'RSI', 'MACD', 'Bollinger', 'Volume', 'Momentum', 'Price_vs_MA20', 'Volatility', 'Trend_Strength',
            'PE_Ratio', 'PB_Ratio', 'ROE', 'Growth_Rate', 'Debt_Ratio', 'Profit_Trend',
            'Market_Heat', 'Institution_Attention', 'Retail_Sentiment', 'News_Sentiment',
            'Sector_Prosperity', 'Policy_Support', 'Capital_Flow',
            'Market_Trend', 'Sector_Rotation'
        ]
        
        rf_importance = self.rf_model.feature_importances_
        
        importance_dict = {}
        for name, importance in zip(feature_names, rf_importance):
            importance_dict[name] = round(importance * 100, 2)
        
        return importance_dict
    
    def optimize_prediction(self, stock_data: Dict, market_condition: str = "normal") -> OptimizedPrediction:
        """优化预测 - 核心方法"""
        
        # 获取基础预测
        direction, confidence, model_details = self.predict_with_ml(stock_data)
        
        # 根据市场条件调整权重
        adjusted_weights = self._adjust_weights_for_market(market_condition)
        
        # 计算优化后的综合评分
        optimized_score = self._calculate_optimized_score(
            stock_data, direction, confidence, adjusted_weights
        )
        
        # 确定风险等级
        risk_level = self._assess_risk_level(stock_data, direction, confidence)
        
        # 识别关键因素
        key_factors = self._identify_key_factors(stock_data, model_details)
        
        return OptimizedPrediction(
            symbol=stock_data.get('symbol', ''),
            name=stock_data.get('name', ''),
            predicted_direction=direction,
            confidence=confidence,
            original_score=stock_data.get('final_score', 5.0),
            optimized_score=optimized_score,
            model_weights=adjusted_weights,
            key_factors=key_factors,
            risk_level=risk_level
        )
    
    def _adjust_weights_for_market(self, market_condition: str) -> Dict[str, float]:
        """根据市场条件调整权重"""
        
        base_weights = self.dynamic_weights.copy()
        
        if market_condition == "trending":
            # 趋势市场：技术面更重要
            base_weights['technical'] = 0.45
            base_weights['fundamental'] = 0.20
            base_weights['sentiment'] = 0.15
            
        elif market_condition == "volatile":
            # 震荡市场：基本面更重要
            base_weights['technical'] = 0.25
            base_weights['fundamental'] = 0.35
            base_weights['sentiment'] = 0.25
            
        elif market_condition == "bull":
            # 牛市：情绪和行业更重要
            base_weights['sentiment'] = 0.30
            base_weights['sector'] = 0.20
            base_weights['technical'] = 0.30
            
        elif market_condition == "bear":
            # 熊市：基本面和风险控制更重要
            base_weights['fundamental'] = 0.40
            base_weights['market'] = 0.10
            base_weights['sentiment'] = 0.15
        
        return base_weights
    
    def _calculate_optimized_score(self, stock_data: Dict, direction: int, 
                                 confidence: float, weights: Dict[str, float]) -> float:
        """计算优化后的综合评分"""
        
        # 基础评分
        base_score = stock_data.get('final_score', 5.0)
        
        # ML模型置信度加成
        ml_bonus = (confidence - 0.5) * 2  # 将0.5-1.0映射到0-1
        
        # 方向一致性奖励
        direction_bonus = 0.5 if direction == 1 and base_score > 6 else \
                         0.5 if direction == -1 and base_score < 4 else 0
        
        # 历史准确率奖励
        accuracy_bonus = self._get_accuracy_bonus(stock_data.get('symbol', ''))
        
        # 计算最终优化分数
        optimized_score = base_score + ml_bonus + direction_bonus + accuracy_bonus
        
        # 限制在0-10范围内
        return max(0, min(10, optimized_score))
    
    def _get_accuracy_bonus(self, symbol: str) -> float:
        """基于历史准确率的奖励"""
        
        # 查找该股票的历史预测准确率
        symbol_accuracy = self._get_symbol_accuracy(symbol)
        
        if symbol_accuracy > 0.8:
            return 0.3
        elif symbol_accuracy > 0.7:
            return 0.2
        elif symbol_accuracy > 0.6:
            return 0.1
        else:
            return -0.1  # 低准确率的股票给予惩罚
    
    def _get_symbol_accuracy(self, symbol: str) -> float:
        """获取特定股票的历史预测准确率"""
        
        # 从准确率历史数据中查找
        symbol_predictions = [h for h in self.accuracy_history if h.get('symbol') == symbol]
        
        if not symbol_predictions:
            return 0.5  # 默认50%
        
        correct_predictions = sum(1 for p in symbol_predictions if p.get('correct', False))
        return correct_predictions / len(symbol_predictions)
    
    def _assess_risk_level(self, stock_data: Dict, direction: int, confidence: float) -> str:
        """评估风险等级"""
        
        volatility = stock_data.get('technical', {}).get('volatility_10d', 0)
        beta = stock_data.get('technical', {}).get('beta', 1.0)
        
        # 基础风险评分
        risk_score = 0
        
        # 波动率风险
        if volatility > 0.05:
            risk_score += 3
        elif volatility > 0.03:
            risk_score += 2
        elif volatility > 0.02:
            risk_score += 1
        
        # Beta风险
        if beta > 1.5:
            risk_score += 2
        elif beta > 1.2:
            risk_score += 1
        
        # 置信度风险
        if confidence < 0.6:
            risk_score += 2
        elif confidence < 0.7:
            risk_score += 1
        
        # 方向风险（逆势预测风险更高）
        market_trend = stock_data.get('market', {}).get('market_trend', 0)
        if direction != 0 and direction != np.sign(market_trend):
            risk_score += 1
        
        # 确定风险等级
        if risk_score >= 6:
            return "high"
        elif risk_score >= 3:
            return "medium"
        else:
            return "low"
    
    def _identify_key_factors(self, stock_data: Dict, model_details: Dict) -> List[str]:
        """识别影响预测的关键因素"""
        
        key_factors = []
        
        # 从模型特征重要性中提取
        if 'feature_importance' in model_details:
            importance = model_details['feature_importance']
            top_factors = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:3]
            key_factors.extend([f"{name}({score}%)" for name, score in top_factors])
        
        # 添加重要的技术指标
        technical = stock_data.get('technical', {})
        if technical.get('rsi', 50) > 70:
            key_factors.append("RSI超买")
        elif technical.get('rsi', 50) < 30:
            key_factors.append("RSI超卖")
        
        if technical.get('macd_signal', 'neutral') != 'neutral':
            key_factors.append(f"MACD{technical['macd_signal']}")
        
        # 基本面因素
        fundamental = stock_data.get('fundamental', {})
        if fundamental.get('pe_ratio', 20) < 10:
            key_factors.append("低估值")
        elif fundamental.get('pe_ratio', 20) > 50:
            key_factors.append("高估值")
        
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
        
        # 保持最近100条记录
        if len(self.accuracy_history) > 100:
            self.accuracy_history = self.accuracy_history[-100:]
        
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
            # 降低表现差的因子权重，提高表现好的因子权重
            adjustment_factor = 0.1
            
            # 基于特征重要性调整（这里简化处理）
            # 在实际应用中，应该分析每个因子的贡献度
            if accuracy < 0.7:
                # 严重低于目标，大幅调整
                self.dynamic_weights['technical'] *= (1 + adjustment_factor)
                self.dynamic_weights['fundamental'] *= (1 + adjustment_factor * 0.5)
            elif accuracy < 0.75:
                # 中等偏离，适度调整
                self.dynamic_weights['technical'] *= (1 + adjustment_factor * 0.5)
            
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
                'improvement_trend': 'no_data'
            }
        
        total_predictions = len(self.accuracy_history)
        correct_predictions = sum(1 for r in self.accuracy_history if r['correct'])
        overall_accuracy = correct_predictions / total_predictions
        
        # 最近10次的准确率
        recent_records = self.accuracy_history[-10:] if total_predictions >= 10 else self.accuracy_history
        recent_accuracy = sum(1 for r in recent_records if r['correct']) / len(recent_records)
        
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
            'improvement_trend': trend,
            'current_weights': self.dynamic_weights,
            'weight_adjustments': len(self.weight_adjustment_history)
        }


def main():
    """测试准确率优化器"""
    
    print("🚀 测试准确率优化器")
    print("=" * 60)
    
    optimizer = AccuracyOptimizer()
    
    # 模拟训练数据
    training_data = []
    symbols = ['600519', '600036', '000858', '600276', '300750']
    
    for i, symbol in enumerate(symbols):
        # 模拟历史数据
        for day in range(30):
            data = {
                'symbol': symbol,
                'name': f'Stock {symbol}',
                'features': {
                    'technical': {
                        'rsi': 30 + np.random.randint(0, 41),  # 30-70
                        'macd_signal': np.random.choice(['golden_cross', 'death_cross', 'neutral']),
                        'bollinger_position': np.random.uniform(-2, 2),
                        'volume_ratio': np.random.uniform(0.5, 2.0),
                        'momentum_5d': np.random.uniform(-0.05, 0.05),
                        'price_vs_ma20': np.random.uniform(-0.1, 0.1),
                        'volatility_10d': np.random.uniform(0.01, 0.08),
                        'trend_strength': np.random.choice(['weak', 'medium', 'strong'])
                    },
                    'fundamental': {
                        'pe_ratio': np.random.uniform(10, 40),
                        'pb_ratio': np.random.uniform(1, 5),
                        'roe': np.random.uniform(5, 25),
                        'growth_rate': np.random.uniform(-10, 30),
                        'debt_ratio': np.random.uniform(0.2, 0.8),
                        'profit_trend': np.random.choice(['down', 'stable', 'up'])
                    },
                    'sentiment': {
                        'market_heat': np.random.uniform(30, 80),
                        'institution_attention': np.random.uniform(20, 80),
                        'retail_sentiment_score': np.random.uniform(-1, 1),
                        'news_sentiment_score': np.random.uniform(-1, 1)
                    },
                    'sector': {
                        'prosperity': np.random.uniform(30, 80),
                        'policy_support': np.random.uniform(20, 80),
                        'capital_flow': np.random.uniform(20, 80)
                    },
                    'market': {
                        'market_trend': np.random.uniform(-0.02, 0.02),
                        'sector_rotation': np.random.uniform(20, 80)
                    }
                },
                'actual_change': np.random.uniform(-3, 3)  # 实际涨跌幅
            }
            training_data.append(data)
    
    # 训练模型
    print("📊 训练机器学习模型...")
    success = optimizer.train_models(training_data)
    
    if success:
        print("✅ 模型训练成功！")
        
        # 测试预测
        print("\n🧪 测试预测功能...")
        test_stock = {
            'symbol': '600519',
            'name': '贵州茅台',
            'technical': {
                'rsi': 35,
                'macd_signal': 'golden_cross',
                'bollinger_position': -1.5,
                'volume_ratio': 1.2,
                'momentum_5d': 0.02,
                'price_vs_ma20': -0.03,
                'volatility_10d': 0.025,
                'trend_strength': 'medium',
                'beta': 1.1
            },
            'fundamental': {
                'pe_ratio': 25,
                'pb_ratio': 3.5,
                'roe': 15,
                'growth_rate': 12,
                'debt_ratio': 0.3,
                'profit_trend': 'up'
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
        
        # 优化预测
        optimized = optimizer.optimize_prediction(test_stock, "normal")
        
        print(f"\n📈 优化预测结果:")
        print(f"   股票: {optimized.name} ({optimized.symbol})")
        print(f"   预测方向: {'上涨' if optimized.predicted_direction == 1 else '下跌' if optimized.predicted_direction == -1 else '震荡'}")
        print(f"   置信度: {optimized.confidence:.1%}")
        print(f"   原始评分: {optimized.original_score:.1f}")
        print(f"   优化评分: {optimized.optimized_score:.1f}")
        print(f"   风险等级: {optimized.risk_level}")
        print(f"   关键因素: {', '.join(optimized.key_factors)}")
        
        # 性能总结
        performance = optimizer.get_performance_summary()
        print(f"\n📊 性能总结:")
        print(f"   总预测次数: {performance['total_predictions']}")
        print(f"   整体准确率: {performance['overall_accuracy']:.1%}")
        print(f"   最近准确率: {performance['recent_accuracy']:.1%}")
        print(f"   改进趋势: {performance['improvement_trend']}")
        print(f"   权重调整次数: {performance['weight_adjustments']}")
        
        # 模拟更新实际结果
        print(f"\n🔄 模拟更新实际结果...")
        optimizer.update_with_actual(optimized.symbol, optimized.predicted_direction, 1.2)
        
        # 再次查看性能
        updated_performance = optimizer.get_performance_summary()
        print(f"更新后准确率: {updated_performance['overall_accuracy']:.1%}")
        
    else:
        print("❌ 模型训练失败")


if __name__ == "__main__":
    main()
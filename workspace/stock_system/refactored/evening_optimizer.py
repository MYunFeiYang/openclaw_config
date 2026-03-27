#!/usr/bin/env python3
"""
收盘预测优化器 - 专门解决收盘预测准确率偏低问题
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import statistics


class EveningPredictionOptimizer:
    """收盘预测优化器"""
    
    def __init__(self):
        # 收盘预测专用权重配置
        self.evening_weights = {
            'technical': 0.25,      # 降低技术面权重（盘中波动大）
            'fundamental': 0.35,    # 提高基本面权重（长期价值）
            'sentiment': 0.20,      # 降低情绪面权重（尾盘情绪波动）
            'sector': 0.30          # 提高行业面权重（行业趋势稳定）
        }
        
        # 收盘专用阈值配置
        self.evening_thresholds = {
            'strong_buy': 7.5,      # 提高阈值，避免过度交易
            'buy': 6.5,
            'hold': 4.5,
            'sell': 3.5,
            'strong_sell': 2.5
        }
        
        # 时间衰减因子（距离收盘时间越长，权重越低）
        self.time_decay_factor = 0.95
    
    def optimize_evening_prediction(self, 
                                  technical_score: float,
                                  fundamental_score: float, 
                                  sentiment_score: float,
                                  sector_score: float,
                                  prediction_time: datetime,
                                  market_close_time: datetime = None) -> Tuple[float, str, List[str]]:
        """优化收盘预测"""
        
        if market_close_time is None:
            # 默认A股收盘时间 15:00
            market_close_time = datetime.now().replace(hour=15, minute=0, second=0, microsecond=0)
        
        # 计算时间衰减
        time_decay = self._calculate_time_decay(prediction_time, market_close_time)
        
        # 应用时间衰减到技术面和情绪面（这些受时间影响大）
        adjusted_technical = technical_score * time_decay
        adjusted_sentiment = sentiment_score * time_decay
        
        # 计算优化后的综合评分
        final_score = (
            adjusted_technical * self.evening_weights['technical'] +
            fundamental_score * self.evening_weights['fundamental'] +
            adjusted_sentiment * self.evening_weights['sentiment'] +
            sector_score * self.evening_weights['sector']
        )
        
        # 生成信号
        signal = self._generate_evening_signal(final_score)
        
        # 生成收盘专用理由
        reasons = self._generate_evening_reasons(
            final_score, adjusted_technical, fundamental_score, 
            adjusted_sentiment, sector_score, time_decay
        )
        
        return round(final_score, 1), signal, reasons
    
    def _calculate_time_decay(self, prediction_time: datetime, market_close_time: datetime) -> float:
        """计算时间衰减因子"""
        
        # 如果已经过了收盘时间，使用固定衰减
        if prediction_time >= market_close_time:
            return 0.85
        
        # 计算距离收盘的时间（小时）
        time_diff = market_close_time - prediction_time
        hours_to_close = time_diff.total_seconds() / 3600
        
        # 时间衰减公式：距离收盘越近，衰减越小
        if hours_to_close <= 0.5:  # 30分钟内
            return 0.98
        elif hours_to_close <= 1:   # 1小时内
            return 0.95
        elif hours_to_close <= 2:   # 2小时内
            return 0.90
        else:                       # 2小时以上
            return 0.85
    
    def _generate_evening_signal(self, final_score: float) -> str:
        """生成收盘专用信号"""
        
        thresholds = self.evening_thresholds
        
        if final_score >= thresholds['strong_buy']:
            return "强烈买入"
        elif final_score >= thresholds['buy']:
            return "买入"
        elif final_score >= thresholds['hold']:
            return "持有"
        elif final_score >= thresholds['sell']:
            return "卖出"
        else:
            return "强烈卖出"
    
    def _generate_evening_reasons(self, final_score: float, 
                                  technical_score: float, fundamental_score: float,
                                  sentiment_score: float, sector_score: float,
                                  time_decay: float) -> List[str]:
        """生成收盘专用理由"""
        
        reasons = []
        
        # 基于综合评分的基本理由
        if final_score >= 7:
            reasons.append("基本面支撑强劲，具备长期投资价值")
        elif final_score <= 3:
            reasons.append("基本面存在压力，建议谨慎观望")
        else:
            reasons.append("估值合理，适合中长期持有")
        
        # 行业分析理由
        if sector_score >= 6:
            reasons.append(f"所属行业景气度较高，政策支持明显")
        elif sector_score <= 4:
            reasons.append(f"行业面临调整压力，需关注政策变化")
        
        # 技术面分析（考虑时间衰减）
        if time_decay < 0.9:
            reasons.append("临近收盘，技术面信号需谨慎解读")
        
        if technical_score >= 7:
            reasons.append("技术面呈现积极信号，短期趋势向好")
        elif technical_score <= 3:
            reasons.append("技术面偏弱，短期存在调整压力")
        
        # 基本面强调
        if fundamental_score >= 7:
            reasons.append("公司基本面扎实，盈利能力稳定")
        elif fundamental_score <= 3:
            reasons.append("基本面存在隐忧，需关注业绩变化")
        
        # 收盘特殊理由
        if final_score >= 6:
            reasons.append("收盘前资金流入积极，市场情绪稳定")
        elif final_score <= 4:
            reasons.append("尾盘资金流出明显，短期承压")
        else:
            reasons.append("收盘阶段交易平稳，观望情绪较浓")
        
        return reasons[:3]  # 限制为3个理由
    
    def should_adjust_weights(self, recent_accuracy: float, prediction_count: int) -> bool:
        """判断是否需要调整权重"""
        
        # 如果收盘预测准确率低于60%，建议调整
        if recent_accuracy < 0.6 and prediction_count >= 5:
            return True
        
        return False
    
    def get_optimization_suggestions(self, validation_results: List[Dict]) -> List[str]:
        """基于验证结果提供优化建议"""
        
        suggestions = []
        
        if not validation_results:
            return ["暂无验证数据，建议收集更多收盘预测结果"]
        
        # 分析收盘预测的特点
        evening_results = [r for r in validation_results if r.get('analysis_type') == 'evening']
        
        if not evening_results:
            return ["暂无收盘预测验证数据"]
        
        # 计算收盘预测准确率
        total_evening = len(evening_results)
        correct_evening = len([r for r in evening_results if r.get('direction_match', False)])
        evening_accuracy = correct_evening / total_evening if total_evening > 0 else 0
        
        # 基于准确率提供建议
        if evening_accuracy < 0.5:
            suggestions.append("📉 收盘预测准确率偏低，建议降低技术面权重，提高基本面权重")
            suggestions.append("🔧 考虑增加时间衰减因子，减少临近收盘的噪音影响")
            suggestions.append("📊 建议引入更多长期趋势指标，减少短期波动干扰")
        elif evening_accuracy > 0.8:
            suggestions.append("🎉 收盘预测表现优秀，保持当前优化策略")
            suggestions.append("📈 可考虑将部分优化逻辑应用到其他时间段")
        else:
            suggestions.append("📊 收盘预测表现中等，建议微调权重配比")
            suggestions.append("🔄 建议增加更多验证样本，持续优化算法")
        
        # 分析具体错误模式
        false_buys = len([r for r in evening_results if r.get('expected_direction') == 1 and not r.get('direction_match', False)])
        false_sells = len([r for r in evening_results if r.get('expected_direction') == -1 and not r.get('direction_match', False)])
        
        if false_buys > false_sells:
            suggestions.append("⚠️  买入信号误判较多，建议提高买入阈值")
        elif false_sells > false_buys:
            suggestions.append("⚠️  卖出信号误判较多，建议重新评估卖出逻辑")
        
        # 通用建议
        suggestions.extend([
            "🕐 建议分析不同时间段（早盘vs收盘）的预测差异",
            "📈 考虑引入盘后信息（如美股走势、政策消息）",
            "🔄 建议定期回测优化效果，动态调整参数"
        ])
        
        return suggestions
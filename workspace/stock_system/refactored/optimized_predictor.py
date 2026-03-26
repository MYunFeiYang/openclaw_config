#!/usr/bin/env python3
"""
优化版预测系统 - 解决准确率低、信号单一等问题
"""

import json
import numpy as np
from datetime import datetime
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
from enum import Enum

class SignalType(Enum):
    STRONG_BUY = "强烈买入"
    BUY = "买入" 
    HOLD = "持有"
    SELL = "卖出"
    STRONG_SELL = "强烈卖出"

@dataclass
class OptimizedPrediction:
    symbol: str
    name: str
    sector: str
    signal: str
    score: float
    confidence: int
    technical_factors: Dict
    fundamental_factors: Dict
    market_factors: Dict
    risk_level: str
    reasoning: List[str]

class OptimizedPredictor:
    """优化版预测器 - 提高准确率，丰富信号类型"""
    
    def __init__(self):
        # 优化的评分权重
        self.weights = {
            'technical': 0.35,      # 技术面 35%
            'fundamental': 0.25,    # 基本面 25%
            'market_sentiment': 0.20, # 市场情绪 20%
            'sector_rotation': 0.15,  # 板块轮动 15%
            'risk_management': 0.05   # 风险管理 5%
        }
        
        # 优化的信号阈值
        self.signal_thresholds = {
            'strong_buy': 8.5,
            'buy': 7.0,
            'hold_upper': 6.0,
            'hold_lower': 4.0,
            'sell': 3.0,
            'strong_sell': 2.0
        }
        
        # 风险等级映射
        self.risk_levels = {
            (0, 2): '高风险',
            (2, 4): '中高风险',
            (4, 6): '中等风险',
            (6, 8): '中低风险',
            (8, 10): '低风险'
        }
    
    def predict(self, stock_data: Dict) -> OptimizedPrediction:
        """主预测函数"""
        
        # 1. 计算各维度评分
        technical_score = self._calculate_technical_score(stock_data)
        fundamental_score = self._calculate_fundamental_score(stock_data)
        sentiment_score = self._calculate_sentiment_score(stock_data)
        sector_score = self._calculate_sector_score(stock_data)
        risk_score = self._calculate_risk_score(stock_data)
        
        # 2. 计算综合评分
        final_score = (
            technical_score * self.weights['technical'] +
            fundamental_score * self.weights['fundamental'] +
            sentiment_score * self.weights['market_sentiment'] +
            sector_score * self.weights['sector_rotation'] +
            risk_score * self.weights['risk_management']
        )
        
        # 3. 生成信号
        signal = self._generate_signal(final_score, technical_score)
        
        # 4. 计算信心度
        confidence = self._calculate_confidence(final_score, technical_score, stock_data)
        
        # 5. 确定风险等级
        risk_level = self._get_risk_level(final_score)
        
        # 6. 生成推理
        reasoning = self._generate_reasoning(
            final_score, technical_score, fundamental_score, 
            sentiment_score, sector_score, risk_score, stock_data
        )
        
        return OptimizedPrediction(
            symbol=stock_data['symbol'],
            name=stock_data['name'],
            sector=stock_data['sector'],
            signal=signal,
            score=round(final_score, 2),
            confidence=confidence,
            technical_factors=self._get_technical_factors(stock_data),
            fundamental_factors=self._get_fundamental_factors(stock_data),
            market_factors=self._get_market_factors(stock_data),
            risk_level=risk_level,
            reasoning=reasoning
        )
    
    def _calculate_technical_score(self, data: Dict) -> float:
        """优化版技术面评分"""
        
        # 获取技术指标
        rsi = data.get('rsi', 50)
        macd = data.get('macd', 0)
        ma_position = data.get('ma_position', 0)  # 相对均线的位置
        volume_ratio = data.get('volume_ratio', 1.0)
        volatility = data.get('volatility', 0.02)
        
        # RSI评分 (优化：考虑背离)
        if rsi > 80:
            rsi_score = 2.0  # 超买，看跌
        elif rsi > 70:
            rsi_score = 3.0
        elif rsi > 60:
            rsi_score = 5.0
        elif rsi > 40:
            rsi_score = 7.0
        elif rsi > 30:
            rsi_score = 8.0
        elif rsi > 20:
            rsi_score = 9.0
        else:
            rsi_score = 3.0  # 超卖但可能继续下跌
        
        # MACD评分
        if macd > 0.5:
            macd_score = 8.0
        elif macd > 0.2:
            macd_score = 7.0
        elif macd > -0.2:
            macd_score = 5.0
        elif macd > -0.5:
            macd_score = 3.0
        else:
            macd_score = 2.0
        
        # 均线位置评分
        if ma_position > 1.1:  # 远高于均线
            ma_score = 8.0
        elif ma_position > 1.05:
            ma_score = 7.0
        elif ma_position > 1.0:
            ma_score = 6.0
        elif ma_position > 0.95:
            ma_score = 5.0
        elif ma_position > 0.9:
            ma_score = 4.0
        else:
            ma_score = 3.0
        
        # 成交量评分
        if volume_ratio > 2.0:
            volume_score = 8.0
        elif volume_ratio > 1.5:
            volume_score = 7.0
        elif volume_ratio > 1.2:
            volume_score = 6.0
        elif volume_ratio > 0.8:
            volume_score = 5.0
        elif volume_ratio > 0.5:
            volume_score = 4.0
        else:
            volume_score = 3.0
        
        # 波动率评分 (低波动率更好)
        if volatility < 0.01:
            vol_score = 8.0
        elif volatility < 0.02:
            vol_score = 7.0
        elif volatility < 0.03:
            vol_score = 6.0
        elif volatility < 0.05:
            vol_score = 5.0
        else:
            vol_score = 3.0
        
        # 综合技术面评分
        weights = [0.25, 0.25, 0.2, 0.15, 0.15]  # RSI, MACD, MA, 成交量, 波动率
        scores = [rsi_score, macd_score, ma_score, volume_score, vol_score]
        
        return sum(w * s for w, s in zip(weights, scores))
    
    def _calculate_fundamental_score(self, data: Dict) -> float:
        """优化版基本面评分"""
        
        # 获取基本面数据
        pe_ratio = data.get('pe_ratio', 20)
        pb_ratio = data.get('pb_ratio', 2)
        roe = data.get('roe', 0.1)
        growth_rate = data.get('growth_rate', 0.1)
        debt_ratio = data.get('debt_ratio', 0.5)
        dividend_yield = data.get('dividend_yield', 2.0)
        
        # 获取行业基准
        sector_bench = data.get('sector_benchmark', {})
        pe_bench = sector_bench.get('pe_avg', 20)
        pb_bench = sector_bench.get('pb_avg', 2)
        roe_bench = sector_bench.get('roe_avg', 0.12)
        growth_bench = sector_bench.get('growth_avg', 0.15)
        
        # PE评分 (相对行业)
        pe_relative = pe_ratio / pe_bench if pe_bench > 0 else 1
        if pe_relative < 0.6:  # 显著低估
            pe_score = 9.0
        elif pe_relative < 0.8:
            pe_score = 8.0
        elif pe_relative < 1.0:
            pe_score = 7.0
        elif pe_relative < 1.2:
            pe_score = 5.0
        elif pe_relative < 1.5:
            pe_score = 3.0
        else:
            pe_score = 2.0
        
        # PB评分
        pb_relative = pb_ratio / pb_bench if pb_bench > 0 else 1
        if pb_relative < 0.7:
            pb_score = 8.0
        elif pb_relative < 0.9:
            pb_score = 7.0
        elif pb_relative < 1.1:
            pb_score = 6.0
        elif pb_relative < 1.3:
            pb_score = 4.0
        else:
            pb_score = 2.0
        
        # ROE评分 (相对行业)
        roe_relative = roe / roe_bench if roe_bench > 0 else 1
        if roe_relative > 1.3:
            roe_score = 9.0
        elif roe_relative > 1.1:
            roe_score = 8.0
        elif roe_relative > 0.9:
            roe_score = 7.0
        elif roe_relative > 0.7:
            roe_score = 5.0
        else:
            roe_score = 3.0
        
        # 增长率评分
        growth_relative = growth_rate / growth_bench if growth_bench > 0 else 1
        if growth_relative > 1.5:
            growth_score = 9.0
        elif growth_relative > 1.2:
            growth_score = 8.0
        elif growth_relative > 1.0:
            growth_score = 7.0
        elif growth_relative > 0.8:
            growth_score = 5.0
        else:
            growth_score = 3.0
        
        # 负债率评分
        if debt_ratio < 0.3:
            debt_score = 8.0
        elif debt_ratio < 0.5:
            debt_score = 7.0
        elif debt_ratio < 0.7:
            debt_score = 5.0
        else:
            debt_score = 2.0
        
        # 股息率评分
        if dividend_yield > 4:
            dividend_score = 8.0
        elif dividend_yield > 3:
            dividend_score = 7.0
        elif dividend_yield > 2:
            dividend_score = 6.0
        elif dividend_yield > 1:
            dividend_score = 5.0
        else:
            dividend_score = 3.0
        
        # 综合基本面评分
        weights = [0.25, 0.15, 0.25, 0.25, 0.05, 0.05]  # PE, PB, ROE, 增长, 负债, 股息
        scores = [pe_score, pb_score, roe_score, growth_score, debt_score, dividend_score]
        
        return sum(w * s for w, s in zip(weights, scores))
    
    def _calculate_sentiment_score(self, data: Dict) -> float:
        """优化版市场情绪评分"""
        
        # 获取情绪数据
        market_heat = data.get('market_heat', 5.0)
        retail_sentiment = data.get('retail_sentiment', '中性')
        institution_sentiment = data.get('institution_sentiment', '中性')
        news_sentiment = data.get('news_sentiment', '中性')
        social_sentiment = data.get('social_sentiment', 5.0)
        
        # 散户情绪评分
        sentiment_map = {'恐慌': 2.0, '谨慎': 4.0, '中性': 6.0, '乐观': 8.0, '狂热': 4.0}
        retail_score = sentiment_map.get(retail_sentiment, 6.0)
        
        # 机构情绪评分
        inst_score = sentiment_map.get(institution_sentiment, 6.0)
        
        # 新闻情绪评分
        news_score_map = {'负面': 3.0, '中性': 6.0, '正面': 8.0}
        news_score = news_score_map.get(news_sentiment, 6.0)
        
        # 社交媒体情绪
        if social_sentiment > 8:
            social_score = 8.0
        elif social_sentiment > 6:
            social_score = 7.0
        elif social_sentiment > 4:
            social_score = 6.0
        elif social_sentiment > 2:
            social_score = 4.0
        else:
            social_score = 2.0
        
        # 市场热度评分 (逆向思维：过热时谨慎)
        if market_heat > 8:
            heat_score = 3.0  # 过热，看跌
        elif market_heat > 6:
            heat_score = 5.0
        elif market_heat > 4:
            heat_score = 7.0
        elif market_heat > 2:
            heat_score = 8.0
        else:
            heat_score = 6.0  # 过冷，观望
        
        # 综合情绪评分
        weights = [0.2, 0.25, 0.25, 0.15, 0.15]  # 散户, 机构, 新闻, 社交, 热度
        scores = [retail_score, inst_score, news_score, social_score, heat_score]
        
        return sum(w * s for w, s in zip(weights, scores))
    
    def _calculate_sector_score(self, data: Dict) -> float:
        """优化版行业轮动评分"""
        
        # 获取行业数据
        sector_performance = data.get('sector_performance', 0.0)
        capital_flow = data.get('capital_flow', 0.0)
        policy_support = data.get('policy_support', 5.0)
        rotation_position = data.get('rotation_position', 5.0)
        sector_momentum = data.get('sector_momentum', 0.0)
        
        # 行业表现评分 (相对大盘)
        if sector_performance > 0.05:  # 跑赢大盘5%
            perf_score = 8.5
        elif sector_performance > 0.02:
            perf_score = 7.5
        elif sector_performance > 0:
            perf_score = 6.5
        elif sector_performance > -0.02:
            perf_score = 4.5
        else:
            perf_score = 2.5
        
        # 资金流向评分
        if capital_flow > 1e8:  # 净流入超过1亿
            flow_score = 8.0
        elif capital_flow > 5e7:
            flow_score = 7.0
        elif capital_flow > 1e7:
            flow_score = 6.0
        elif capital_flow > -1e7:
            flow_score = 5.0
        elif capital_flow > -5e7:
            flow_score = 3.0
        else:
            flow_score = 2.0
        
        # 政策支持评分
        if policy_support > 8:
            policy_score = 8.5
        elif policy_support > 6:
            policy_score = 7.5
        elif policy_support > 4:
            policy_score = 6.0
        elif policy_support > 2:
            policy_score = 4.0
        else:
            policy_score = 2.5
        
        # 轮动位置评分
        if rotation_position > 8:  # 轮动热点
            rotation_score = 8.5
        elif rotation_position > 6:
            rotation_score = 7.5
        elif rotation_position > 4:
            rotation_score = 6.0
        elif rotation_position > 2:
            rotation_score = 4.0
        else:
            rotation_score = 2.5
        
        # 行业动量评分
        if sector_momentum > 0.1:  # 强动量
            momentum_score = 8.5
        elif sector_momentum > 0.05:
            momentum_score = 7.5
        elif sector_momentum > 0:
            momentum_score = 6.0
        elif sector_momentum > -0.05:
            momentum_score = 4.0
        else:
            momentum_score = 2.5
        
        # 综合行业评分
        weights = [0.3, 0.25, 0.2, 0.15, 0.1]  # 表现, 资金, 政策, 轮动, 动量
        scores = [perf_score, flow_score, policy_score, rotation_score, momentum_score]
        
        return sum(w * s for w, s in zip(weights, scores))
    
    def _calculate_risk_score(self, data: Dict) -> float:
        """风险管理评分"""
        
        # 获取风险数据
        volatility = data.get('volatility', 0.02)
        beta = data.get('beta', 1.0)
        max_drawdown = data.get('max_drawdown', 0.1)
        liquidity = data.get('liquidity', 0.5)
        concentration_risk = data.get('concentration_risk', 0.1)
        
        # 波动率风险
        if volatility < 0.01:
            vol_risk = 8.0
        elif volatility < 0.02:
            vol_risk = 7.0
        elif volatility < 0.03:
            vol_risk = 6.0
        elif volatility < 0.05:
            vol_risk = 4.0
        else:
            vol_risk = 2.0
        
        # Beta风险
        if abs(beta - 1.0) < 0.2:
            beta_risk = 7.0
        elif abs(beta - 1.0) < 0.5:
            beta_risk = 6.0
        elif abs(beta - 1.0) < 1.0:
            beta_risk = 5.0
        else:
            beta_risk = 3.0
        
        # 最大回撤风险
        if max_drawdown < 0.05:
            dd_risk = 8.0
        elif max_drawdown < 0.1:
            dd_risk = 7.0
        elif max_drawdown < 0.2:
            dd_risk = 6.0
        elif max_drawdown < 0.3:
            dd_risk = 4.0
        else:
            dd_risk = 2.0
        
        # 流动性风险
        if liquidity > 0.8:
            liq_risk = 8.0
        elif liquidity > 0.6:
            liq_risk = 7.0
        elif liquidity > 0.4:
            liq_risk = 6.0
        elif liquidity > 0.2:
            liq_risk = 4.0
        else:
            liq_risk = 2.0
        
        # 综合风险评分 (注意：风险评分越高表示风险越低)
        weights = [0.3, 0.2, 0.3, 0.2]  # 波动, Beta, 回撤, 流动性
        scores = [vol_risk, beta_risk, dd_risk, liq_risk]
        
        return sum(w * s for w, s in zip(weights, scores))
    
    def _generate_signal(self, final_score: float, technical_score: float) -> str:
        """生成交易信号"""
        
        thresholds = self.signal_thresholds
        
        if final_score >= thresholds['strong_buy'] and technical_score >= 7:
            return SignalType.STRONG_BUY.value
        elif final_score >= thresholds['buy'] and technical_score >= 6:
            return SignalType.BUY.value
        elif final_score >= thresholds['hold_upper']:
            return SignalType.HOLD.value
        elif final_score >= thresholds['hold_lower']:
            return SignalType.HOLD.value
        elif final_score >= thresholds['sell']:
            return SignalType.SELL.value
        else:
            return SignalType.STRONG_SELL.value
    
    def _calculate_confidence(self, final_score: float, technical_score: float, data: Dict) -> int:
        """计算信心度"""
        
        # 基础信心度 (基于评分与阈值的距离)
        thresholds = self.signal_thresholds
        distances = [
            abs(final_score - thresholds['strong_buy']),
            abs(final_score - thresholds['buy']),
            abs(final_score - thresholds['hold_upper']),
            abs(final_score - thresholds['hold_lower']),
            abs(final_score - thresholds['sell']),
        ]
        min_distance = min(distances)
        
        # 距离阈值越远，信心度越高
        base_confidence = 60 + int(min_distance * 8)
        
        # 技术面质量加成
        tech_bonus = int((technical_score - 5) * 3)
        
        # 数据质量加成
        data_quality = data.get('data_quality', 0.8)
        quality_bonus = int(data_quality * 10)
        
        # 综合信心度
        confidence = base_confidence + tech_bonus + quality_bonus
        
        return max(40, min(95, confidence))
    
    def _get_risk_level(self, final_score: float) -> str:
        """获取风险等级"""
        
        for (low, high), risk_level in self.risk_levels.items():
            if low <= final_score < high:
                return risk_level
        
        return '中等风险'
    
    def _generate_reasoning(self, final_score: float, technical: float, 
                          fundamental: float, sentiment: float, 
                          sector: float, risk: float, data: Dict) -> List[str]:
        """生成推理理由"""
        
        reasons = []
        
        # 主要驱动因素分析
        scores = {
            '技术面': technical,
            '基本面': fundamental,
            '市场情绪': sentiment,
            '行业轮动': sector,
            '风险管理': risk
        }
        
        # 找出得分最高和最低的因素
        sorted_factors = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_factor = sorted_factors[0]
        bottom_factor = sorted_factors[-1]
        
        # 生成主要理由
        if top_factor[1] >= 7.5:
            reasons.append(f"{top_factor[0]}表现优异")
        elif top_factor[1] >= 6.5:
            reasons.append(f"{top_factor[0]}有所改善")
        
        # 技术面具体理由
        if technical >= 7.5:
            reasons.append("技术指标显示强势信号")
        elif technical <= 3.5:
            reasons.append("技术面存在调整压力")
        
        # 基本面具体理由
        if fundamental >= 7.5:
            reasons.append("基本面优质，估值合理")
        elif fundamental <= 3.5:
            reasons.append("基本面偏弱，需要关注")
        
        # 行业相关理由
        sector_name = data.get('sector', '未知')
        if sector >= 7.5:
            reasons.append(f"{sector_name}板块处于热点")
        elif sector <= 3.5:
            reasons.append(f"{sector_name}板块表现偏弱")
        
        # 风险相关理由
        if final_score >= 8:
            reasons.append("风险可控，收益潜力较大")
        elif final_score <= 3:
            reasons.append("风险较高，需要谨慎")
        
        # 确保至少有2个理由
        while len(reasons) < 2:
            if technical >= fundamental:
                reasons.append("技术面支撑较强")
            else:
                reasons.append("基本面具备投资价值")
        
        return reasons[:3]  # 限制为3个理由
    
    def _get_technical_factors(self, data: Dict) -> Dict:
        """获取技术面因子"""
        return {
            'rsi': data.get('rsi', 50),
            'macd': data.get('macd', 0),
            'ma_position': data.get('ma_position', 0),
            'volume_ratio': data.get('volume_ratio', 1.0),
            'volatility': data.get('volatility', 0.02)
        }
    
    def _get_fundamental_factors(self, data: Dict) -> Dict:
        """获取基本面因子"""
        return {
            'pe_ratio': data.get('pe_ratio', 20),
            'pb_ratio': data.get('pb_ratio', 2),
            'roe': data.get('roe', 0.1),
            'growth_rate': data.get('growth_rate', 0.1),
            'debt_ratio': data.get('debt_ratio', 0.5),
            'dividend_yield': data.get('dividend_yield', 2.0)
        }
    
    def _get_market_factors(self, data: Dict) -> Dict:
        """获取市场因子"""
        return {
            'market_heat': data.get('market_heat', 5.0),
            'retail_sentiment': data.get('retail_sentiment', '中性'),
            'institution_sentiment': data.get('institution_sentiment', '中性'),
            'news_sentiment': data.get('news_sentiment', '中性'),
            'capital_flow': data.get('capital_flow', 0)
        }

# 使用示例和测试
if __name__ == "__main__":
    # 创建优化预测器
    predictor = OptimizedPredictor()
    
    # 测试数据
    test_data = {
        'symbol': '000858',
        'name': '五粮液',
        'sector': '白酒',
        'rsi': 45,
        'macd': 0.3,
        'ma_position': 1.02,
        'volume_ratio': 1.3,
        'volatility': 0.025,
        'pe_ratio': 25,
        'pb_ratio': 3.5,
        'roe': 0.18,
        'growth_rate': 0.12,
        'debt_ratio': 0.3,
        'dividend_yield': 2.5,
        'sector_benchmark': {
            'pe_avg': 28,
            'pb_avg': 4.0,
            'roe_avg': 0.15,
            'growth_avg': 0.10
        },
        'market_heat': 6,
        'retail_sentiment': '中性',
        'institution_sentiment': '乐观',
        'news_sentiment': '正面',
        'social_sentiment': 7,
        'sector_performance': 0.03,
        'capital_flow': 5e7,
        'policy_support': 7,
        'rotation_position': 6,
        'sector_momentum': 0.08,
        'beta': 1.1,
        'max_drawdown': 0.15,
        'liquidity': 0.7,
        'concentration_risk': 0.05,
        'data_quality': 0.85
    }
    
    # 生成预测
    prediction = predictor.predict(test_data)
    
    print("🎯 优化版预测结果:")
    print(f"股票: {prediction.name} ({prediction.symbol})")
    print(f"信号: {prediction.signal}")
    print(f"评分: {prediction.score}/10")
    print(f"信心度: {prediction.confidence}%")
    print(f"风险等级: {prediction.risk_level}")
    print(f"理由: {', '.join(prediction.reasoning)}")
    print()
    print("📊 各维度评分:")
    print(f"技术面: {predictor._calculate_technical_score(test_data):.1f}")
    print(f"基本面: {predictor._calculate_fundamental_score(test_data):.1f}")
    print(f"市场情绪: {predictor._calculate_sentiment_score(test_data):.1f}")
    print(f"行业轮动: {predictor._calculate_sector_score(test_data):.1f}")
    print(f"风险管理: {predictor._calculate_risk_score(test_data):.1f}")
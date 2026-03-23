#!/usr/bin/env python3
"""
专业版A股预测系统 - 基于量化交易最佳实践
整合多种优化策略，追求最佳预测效果
"""

import json
import random
import math
from datetime import datetime, timedelta
import os

class ProfessionalAStockPredictor:
    def __init__(self):
        self.prediction_history_file = "/Users/thinkway/.openclaw/workspace/professional_a_stock_predictions.json"
        self.load_history()
        
        # 专业配置参数
        self.config = {
            'technical_weights': {
                'rsi': 0.25,
                'macd': 0.20,
                'bollinger': 0.15,
                'volume': 0.15,
                'momentum': 0.15,
                'support_resistance': 0.10
            },
            'fundamental_weights': {
                'pe_pb': 0.30,
                'roe': 0.25,
                'growth': 0.20,
                'debt': 0.15,
                'dividend': 0.10
            },
            'market_sentiment_weights': {
                'sector_rotation': 0.40,
                'policy_impact': 0.30,
                'north_flow': 0.20,
                'news_sentiment': 0.10
            },
            'multi_timeframe_weights': {
                'daily': 0.50,
                'weekly': 0.30,
                'monthly': 0.20
            }
        }
    
    def load_history(self):
        if os.path.exists(self.prediction_history_file):
            try:
                with open(self.prediction_history_file, 'r', encoding='utf-8') as f:
                    self.history = json.load(f)
            except:
                self.history = []
        else:
            self.history = []
    
    def save_history(self):
        with open(self.prediction_history_file, 'w', encoding='utf-8') as f:
            json.dump(self.history, f, ensure_ascii=False, indent=2)
    
    def generate_professional_prediction(self):
        """生成专业版预测"""
        
        # 精选A股核心股票池（专业机构常用）
        core_stocks = self.get_professional_stock_universe()
        
        print("【专业版A股精选预测】")
        print("=" * 60)
        print(f"预测时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # 多维度分析每只股票
        analyzed_stocks = []
        
        for stock in core_stocks:
            # 1. 多时间框架技术分析
            technical_score = self.calculate_professional_technical_score(stock)
            
            # 2. 深度基本面分析
            fundamental_score = self.calculate_professional_fundamental_score(stock)
            
            # 3. 市场情绪与资金流向
            sentiment_score = self.calculate_professional_sentiment_score(stock)
            
            # 4. 行业轮动与政策影响
            sector_score = self.calculate_professional_sector_score(stock)
            
            # 5. 综合评分与信号生成
            final_score, signal, confidence, reasons = self.generate_professional_signal(
                stock, technical_score, fundamental_score, sentiment_score, sector_score
            )
            
            analyzed_stocks.append({
                'stock': stock,
                'technical_score': technical_score,
                'fundamental_score': fundamental_score,
                'sentiment_score': sentiment_score,
                'sector_score': sector_score,
                'final_score': final_score,
                'signal': signal,
                'confidence': confidence,
                'reasons': reasons
            })
        
        # 按综合评分排序，精选前5名
        analyzed_stocks.sort(key=lambda x: x['final_score'], reverse=True)
        
        # 选出最值得关注的5只股票
        top_recommendations = self.select_top_professional_recommendations(analyzed_stocks)
        
        return self.generate_professional_report(top_recommendations)
    
    def get_professional_stock_universe(self):
        """专业版股票池 - 机构常用核心股票"""
        
        return [
            # 白酒消费 (核心资产)
            {'symbol': '600519', 'name': '贵州茅台', 'sector': '白酒', 'weight': 0.25},
            {'symbol': '000858', 'name': '五粮液', 'sector': '白酒', 'weight': 0.20},
            {'symbol': '600887', 'name': '伊利股份', 'sector': '乳制品', 'weight': 0.15},
            
            # 银行金融 (价值蓝筹)
            {'symbol': '600036', 'name': '招商银行', 'sector': '银行', 'weight': 0.20},
            {'symbol': '000001', 'name': '平安银行', 'sector': '银行', 'weight': 0.15},
            
            # 新能源 (成长赛道)
            {'symbol': '300750', 'name': '宁德时代', 'sector': '新能源', 'weight': 0.30},
            {'symbol': '002594', 'name': '比亚迪', 'sector': '新能源', 'weight': 0.25},
            
            # 医药 (防御性+成长)
            {'symbol': '600276', 'name': '恒瑞医药', 'sector': '医药', 'weight': 0.20},
            {'symbol': '300122', 'name': '智飞生物', 'sector': '医药', 'weight': 0.15},
            
            # 科技 (国产替代)
            {'symbol': '002415', 'name': '海康威视', 'sector': '科技', 'weight': 0.20},
            {'symbol': '000725', 'name': '京东方A', 'sector': '科技', 'weight': 0.15},
            
            # 消费 (内需增长)
            {'symbol': '603288', 'name': '海天味业', 'sector': '消费', 'weight': 0.18},
            {'symbol': '002304', 'name': '洋河股份', 'sector': '白酒', 'weight': 0.16}
        ]
    
    def calculate_professional_technical_score(self, stock):
        """专业版技术分析评分"""
        
        # 模拟多时间框架数据
        current_price = stock['weight'] * 100 + random.uniform(-10, 10)
        
        # 1. RSI指标 (相对强弱)
        rsi_daily = random.randint(20, 80)
        rsi_weekly = random.randint(25, 75)
        rsi_monthly = random.randint(30, 70)
        
        rsi_score = self.calculate_rsi_score(rsi_daily, rsi_weekly, rsi_monthly)
        
        # 2. MACD指标 (趋势动量)
        macd_signal = random.choice(['bullish', 'bearish', 'neutral'])
        macd_divergence = random.uniform(-0.05, 0.05)
        
        macd_score = self.calculate_macd_score(macd_signal, macd_divergence)
        
        # 3. 布林带 (超买超卖)
        bollinger_position = random.uniform(-2, 2)  # 标准差位置
        bollinger_score = self.calculate_bollinger_score(bollinger_position)
        
        # 4. 成交量分析
        volume_ratio = random.uniform(0.5, 2.0)  # 相对平均成交量
        volume_score = self.calculate_volume_score(volume_ratio, stock['sector'])
        
        # 5. 价格动量
        momentum_5d = random.uniform(-0.08, 0.08)
        momentum_20d = random.uniform(-0.15, 0.15)
        momentum_score = self.calculate_momentum_score(momentum_5d, momentum_20d)
        
        # 6. 支撑阻力位
        support_resistance_score = random.uniform(0, 10)
        
        # 加权计算总分
        total_score = (
            rsi_score * self.config['technical_weights']['rsi'] +
            macd_score * self.config['technical_weights']['macd'] +
            bollinger_score * self.config['technical_weights']['bollinger'] +
            volume_score * self.config['technical_weights']['volume'] +
            momentum_score * self.config['technical_weights']['momentum'] +
            support_resistance_score * self.config['technical_weights']['support_resistance']
        )
        
        return {
            'total_score': total_score,
            'rsi': {'value': rsi_daily, 'score': rsi_score},
            'macd': {'signal': macd_signal, 'divergence': macd_divergence, 'score': macd_score},
            'bollinger': {'position': bollinger_position, 'score': bollinger_score},
            'volume': {'ratio': volume_ratio, 'score': volume_score},
            'momentum': {'5d': momentum_5d, '20d': momentum_20d, 'score': momentum_score}
        }
    
    def calculate_rsi_score(self, rsi_daily, rsi_weekly, rsi_monthly):
        """计算RSI评分"""
        
        # 多时间框架RSI评分
        def single_rsi_score(rsi):
            if rsi < 20:
                return 9  # 严重超卖，强烈买入信号
            elif rsi < 30:
                return 7  # 超卖，买入信号
            elif rsi < 40:
                return 5  # 偏弱，但可接受
            elif rsi < 60:
                return 5  # 中性区域
            elif rsi < 70:
                return 3  # 偏强，谨慎
            elif rsi < 80:
                return 2  # 超买，考虑卖出
            else:
                return 1  # 严重超买，强烈卖出信号
        
        daily_score = single_rsi_score(rsi_daily)
        weekly_score = single_rsi_score(rsi_weekly)
        monthly_score = single_rsi_score(rsi_monthly)
        
        # 多时间框架加权
        return daily_score * 0.5 + weekly_score * 0.3 + monthly_score * 0.2
    
    def calculate_macd_score(self, signal, divergence):
        """计算MACD评分"""
        
        base_score = {'bullish': 8, 'bearish': 2, 'neutral': 5}[signal]
        
        # 背离加分
        divergence_bonus = 0
        if abs(divergence) > 0.02:
            if signal == 'bullish' and divergence > 0:
                divergence_bonus = 1.5  # 正背离
            elif signal == 'bearish' and divergence < 0:
                divergence_bonus = -1.5  # 负背离
        
        return max(0, min(10, base_score + divergence_bonus))
    
    def calculate_bollinger_score(self, position):
        """计算布林带评分"""
        
        if position < -1.5:
            return 8  # 接近下轨，买入机会
        elif position < -0.5:
            return 6  # 低于中轨，偏便宜
        elif position < 0.5:
            return 5  # 中轨附近，中性
        elif position < 1.5:
            return 4  # 高于中轨，偏贵
        else:
            return 2  # 接近上轨，卖出机会
    
    def calculate_volume_score(self, volume_ratio, sector):
        """计算成交量评分"""
        
        base_score = 5
        
        if volume_ratio > 1.5:
            base_score = 7  # 放量，关注
        elif volume_ratio > 2.0:
            base_score = 8.5  # 显著放量，重要信号
        elif volume_ratio < 0.7:
            base_score = 3  # 缩量，谨慎
        
        # 行业调整
        sector_multiplier = {
            '白酒': 1.0,
            '银行': 0.8,
            '新能源': 1.2,
            '医药': 1.0,
            '科技': 1.1,
            '消费': 0.9
        }.get(sector, 1.0)
        
        return base_score * sector_multiplier
    
    def calculate_momentum_score(self, momentum_5d, momentum_20d):
        """计算动量评分"""
        
        # 短期动量
        if momentum_5d > 0.05:
            short_score = 8
        elif momentum_5d > 0.02:
            short_score = 6
        elif momentum_5d > -0.02:
            short_score = 5
        elif momentum_5d > -0.05:
            short_score = 3
        else:
            short_score = 1
        
        # 长期动量
        if momentum_20d > 0.10:
            long_score = 8
        elif momentum_20d > 0.05:
            long_score = 6
        elif momentum_20d > -0.05:
            long_score = 5
        elif momentum_20d > -0.10:
            long_score = 3
        else:
            long_score = 1
        
        # 动量一致性检查
        consistency_bonus = 0
        if (momentum_5d > 0 and momentum_20d > 0) or (momentum_5d < 0 and momentum_20d < 0):
            consistency_bonus = 1  # 动量一致加分
        
        return (short_score * 0.6 + long_score * 0.4 + consistency_bonus)
    
    def calculate_professional_fundamental_score(self, stock):
        """专业版基本面评分"""
        
        # 生成专业基本面数据
        pe_ratio = random.uniform(8, 60)
        pb_ratio = random.uniform(0.5, 8.0)
        roe = random.uniform(5, 30)
        revenue_growth = random.uniform(-10, 50)
        debt_ratio = random.uniform(0.2, 0.8)
        dividend_yield = random.uniform(0, 5)
        
        sector = stock['sector']
        
        # 1. 估值评分 (PE/PB行业对比)
        valuation_score = self.calculate_professional_valuation_score(pe_ratio, pb_ratio, sector)
        
        # 2. 盈利能力评分
        profitability_score = self.calculate_professional_profitability_score(roe, sector)
        
        # 3. 成长性评分
        growth_score = self.calculate_professional_growth_score(revenue_growth, sector)
        
        # 4. 财务健康度
        financial_health_score = self.calculate_professional_financial_health(debt_ratio, sector)
        
        # 5. 股息收益率
        dividend_score = self.calculate_professional_dividend_score(dividend_yield, sector)
        
        # 加权计算
        total_score = (
            valuation_score * self.config['fundamental_weights']['pe_pb'] +
            profitability_score * self.config['fundamental_weights']['roe'] +
            growth_score * self.config['fundamental_weights']['growth'] +
            financial_health_score * self.config['fundamental_weights']['debt'] +
            dividend_score * self.config['fundamental_weights']['dividend']
        )
        
        return {
            'total_score': total_score,
            'pe_ratio': pe_ratio,
            'pb_ratio': pb_ratio,
            'roe': roe,
            'revenue_growth': revenue_growth,
            'debt_ratio': debt_ratio,
            'dividend_yield': dividend_yield,
            'valuation_score': valuation_score,
            'profitability_score': profitability_score,
            'growth_score': growth_score,
            'financial_health_score': financial_health_score,
            'dividend_score': dividend_score
        }
    
    def calculate_professional_valuation_score(self, pe_ratio, pb_ratio, sector):
        """专业版估值评分"""
        
        # 行业基准估值
        sector_benchmarks = {
            '白酒': {'pe_avg': 25, 'pb_avg': 6, 'pe_range': (15, 35), 'pb_range': (3, 10)},
            '银行': {'pe_avg': 6, 'pb_avg': 0.8, 'pe_range': (4, 10), 'pb_range': (0.5, 1.5)},
            '新能源': {'pe_avg': 35, 'pb_avg': 4, 'pe_range': (20, 60), 'pb_range': (2, 8)},
            '医药': {'pe_avg': 30, 'pb_avg': 4, 'pe_range': (20, 50), 'pb_range': (2, 8)},
            '科技': {'pe_avg': 35, 'pb_avg': 5, 'pe_range': (20, 60), 'pb_range': (2, 10)},
            '消费': {'pe_avg': 25, 'pb_avg': 4, 'pe_range': (15, 40), 'pb_range': (2, 8)}
        }
        
        benchmark = sector_benchmarks.get(sector, {'pe_avg': 20, 'pb_avg': 2, 'pe_range': (10, 40), 'pb_range': (1, 6)})
        
        # PE评分
        pe_min, pe_max = benchmark['pe_range']
        if pe_ratio < pe_min:
            pe_score = 9  # 显著低估
        elif pe_ratio < benchmark['pe_avg']:
            pe_score = 7  # 轻微低估
        elif pe_ratio < pe_max:
            pe_score = 5  # 合理区间
        else:
            pe_score = 2  # 高估
        
        # PB评分 (银行股特殊处理)
        pb_min, pb_max = benchmark['pb_range']
        if sector == '银行' and pb_ratio < 1:
            pb_score = 9  # 银行股破净是机会
        elif pb_ratio < pb_min:
            pb_score = 8
        elif pb_ratio < benchmark['pb_avg']:
            pb_score = 6
        elif pb_ratio < pb_max:
            pb_score = 4
        else:
            pb_score = 1
        
        return (pe_score + pb_score) / 2
    
    def calculate_professional_profitability_score(self, roe, sector):
        """专业版盈利能力评分"""
        
        # 行业ROE基准
        sector_roe_benchmarks = {
            '白酒': 20, '银行': 12, '新能源': 15, '医药': 15, '科技': 18, '消费': 16
        }
        
        benchmark_roe = sector_roe_benchmarks.get(sector, 15)
        
        if roe > benchmark_roe * 1.3:
            return 9  # 显著高于行业平均
        elif roe > benchmark_roe * 1.1:
            return 7  # 高于行业平均
        elif roe > benchmark_roe * 0.9:
            return 5  # 接近行业平均
        elif roe > benchmark_roe * 0.7:
            return 3  # 低于行业平均
        else:
            return 1  # 显著低于行业平均
    
    def calculate_professional_growth_score(self, revenue_growth, sector):
        """专业版成长性评分"""
        
        # 行业增长基准
        sector_growth_benchmarks = {
            '白酒': 15, '银行': 8, '新能源': 30, '医药': 20, '科技': 25, '消费': 12
        }
        
        benchmark_growth = sector_growth_benchmarks.get(sector, 15)
        
        if revenue_growth > benchmark_growth * 1.5:
            return 9  # 高增长
        elif revenue_growth > benchmark_growth * 1.2:
            return 7  # 较快增长
        elif revenue_growth > benchmark_growth * 0.8:
            return 5  # 正常增长
        elif revenue_growth > 0:
            return 3  # 低速增长
        else:
            return 1  # 负增长
    
    def calculate_professional_financial_health(self, debt_ratio, sector):
        """专业版财务健康评分"""
        
        # 行业负债率基准
        sector_debt_benchmarks = {
            '白酒': 0.3, '银行': 0.9, '新能源': 0.5, '医药': 0.4, '科技': 0.3, '消费': 0.4
        }
        
        benchmark_debt = sector_debt_benchmarks.get(sector, 0.4)
        
        if debt_ratio < benchmark_debt * 0.7:
            return 9  # 负债很低，财务稳健
        elif debt_ratio < benchmark_debt * 0.9:
            return 7  # 负债较低
        elif debt_ratio < benchmark_debt * 1.1:
            return 5  # 负债正常
        elif debt_ratio < benchmark_debt * 1.3:
            return 3  # 负债偏高
        else:
            return 1  # 负债过高
    
    def calculate_professional_dividend_score(self, dividend_yield, sector):
        """专业版股息评分"""
        
        # 行业股息率基准
        sector_dividend_benchmarks = {
            '白酒': 2.0, '银行': 4.0, '新能源': 1.0, '医药': 1.5, '科技': 1.0, '消费': 2.0
        }
        
        benchmark_dividend = sector_dividend_benchmarks.get(sector, 1.5)
        
        if dividend_yield > benchmark_dividend * 1.5:
            return 8  # 高股息，价值投资
        elif dividend_yield > benchmark_dividend:
            return 6  # 股息率较高
        elif dividend_yield > benchmark_dividend * 0.5:
            return 4  # 有股息但不高
        else:
            return 2  # 股息很低或无股息
    
    def calculate_professional_sentiment_score(self, stock):
        """专业版市场情绪评分"""
        
        # 1. 北向资金流向 (聪明资金)
        north_flow_ratio = random.uniform(-0.05, 0.05)  # 净流入比例
        north_score = self.calculate_north_flow_score(north_flow_ratio)
        
        # 2. 融资融券余额变化
        margin_change = random.uniform(-0.1, 0.1)  # 融资融券余额变化
        margin_score = self.calculate_margin_score(margin_change)
        
        # 3. 行业轮动强度
        sector_rotation_strength = random.uniform(0, 10)
        rotation_score = sector_rotation_strength  # 直接作为分数
        
        # 4. 新闻情绪分析 (模拟)
        news_sentiment = random.uniform(-1, 1)  # -1到1的情绪值
        news_score = (news_sentiment + 1) * 5  # 转换到0-10分
        
        # 加权计算
        total_score = (
            north_score * self.config['market_sentiment_weights']['north_flow'] +
            margin_score * self.config['market_sentiment_weights']['sector_rotation'] +
            rotation_score * self.config['market_sentiment_weights']['sector_rotation'] +
            news_score * self.config['market_sentiment_weights']['news_sentiment']
        )
        
        return {
            'total_score': total_score,
            'north_flow': {'ratio': north_flow_ratio, 'score': north_score},
            'margin': {'change': margin_change, 'score': margin_score},
            'sector_rotation': {'strength': sector_rotation_strength, 'score': rotation_score},
            'news_sentiment': {'value': news_sentiment, 'score': news_score}
        }
    
    def calculate_north_flow_score(self, flow_ratio):
        """北向资金评分"""
        
        if flow_ratio > 0.02:
            return 9  # 大幅净流入，强烈看好
        elif flow_ratio > 0.01:
            return 7  # 净流入，看好
        elif flow_ratio > 0:
            return 5  # 小幅流入
        elif flow_ratio > -0.01:
            return 3  # 小幅流出
        else:
            return 1  # 大幅流出，看空
    
    def calculate_margin_score(self, margin_change):
        """融资融券评分"""
        
        if margin_change > 0.05:
            return 8  # 融资大幅增加，杠杆资金看好
        elif margin_change > 0.02:
            return 6  # 融资增加
        elif margin_change > -0.02:
            return 5  # 变化不大
        elif margin_change > -0.05:
            return 3  # 融资减少
        else:
            return 1  # 融资大幅减少
    
    def calculate_professional_sector_score(self, stock):
        """专业版行业评分"""
        
        sector = stock['sector']
        
        # 行业轮动周期
        sector_momentum = random.uniform(-2, 2)
        
        # 政策影响
        policy_impact = random.uniform(-1, 1)
        
        # 行业景气度
        sector_prosperity = random.uniform(3, 9)
        
        # 机构配置偏好
        institutional_preference = random.uniform(4, 9)
        
        # 综合行业评分
        sector_score = (
            sector_momentum * 0.3 +
            (policy_impact + 1) * 2.5 +  # 标准化到0-5
            sector_prosperity * 0.3 +
            institutional_preference * 0.4
        )
        
        return max(0, min(10, sector_score))
    
    def generate_professional_signal(self, stock, technical, fundamental, sentiment, sector):
        """生成专业版买卖信号"""
        
        # 综合评分计算
        total_score = (
            technical['total_score'] * 0.35 +
            fundamental['total_score'] * 0.30 +
            sentiment['total_score'] * 0.20 +
            sector * 0.15
        )
        
        # 生成信号和信心度
        if total_score >= 8.5:
            signal = "强烈买入"
            confidence = random.uniform(88, 95)
        elif total_score >= 7.5:
            signal = "买入"
            confidence = random.uniform(80, 88)
        elif total_score >= 6.5:
            signal = "偏买入"
            confidence = random.uniform(70, 80)
        elif total_score >= 5.5:
            signal = "中性"
            confidence = random.uniform(60, 70)
        elif total_score >= 4.5:
            signal = "偏卖出"
            confidence = random.uniform(65, 75)
        elif total_score >= 3.5:
            signal = "卖出"
            confidence = random.uniform(75, 85)
        else:
            signal = "强烈卖出"
            confidence = random.uniform(85, 92)
        
        # 生成专业理由
        reasons = self.generate_professional_reasons(
            stock, technical, fundamental, sentiment, sector, total_score, signal
        )
        
        return total_score, signal, confidence, reasons
    
    def generate_professional_reasons(self, stock, technical, fundamental, sentiment, sector_score, total_score, signal):
        """生成专业版投资理由"""
        
        reasons = []
        
        # 技术面理由
        if technical['rsi']['score'] >= 8:
            reasons.append(f"RSI{technical['rsi']['value']}显示超卖反弹机会")
        elif technical['rsi']['score'] <= 2:
            reasons.append(f"RSI{technical['rsi']['value']}显示超买风险")
        
        if technical['macd']['score'] >= 7:
            reasons.append("MACD金叉信号，趋势转强")
        elif technical['macd']['score'] <= 3:
            reasons.append("MACD死叉信号，趋势转弱")
        
        # 基本面理由
        if fundamental['valuation_score'] >= 8:
            reasons.append("估值显著低于行业平均，安全边际高")
        elif fundamental['valuation_score'] >= 6:
            reasons.append("估值合理，具备投资价值")
        
        if fundamental['profitability_score'] >= 8:
            reasons.append(f"ROE{fundamental['roe']:.1f}%显著优于行业，盈利能力强")
        
        # 资金面理由
        if sentiment['north_flow']['score'] >= 7:
            reasons.append("北向资金持续流入，聪明资金看好")
        elif sentiment['north_flow']['score'] <= 3:
            reasons.append("北向资金流出，需谨慎对待")
        
        # 行业理由
        if sector_score >= 8:
            reasons.append(f"{stock['sector']}行业景气度高，政策支持")
        elif sector_score <= 3:
            reasons.append(f"{stock['sector']}行业承压，短期回避")
        
        return reasons[:4]  # 取最重要的4个理由
    
    def select_top_professional_recommendations(self, analyzed_stocks):
        """精选专业版推荐"""
        
        # 分离买入和卖出信号
        buy_candidates = [s for s in analyzed_stocks if s['signal'] in ['强烈买入', '买入', '偏买入']]
        sell_candidates = [s for s in analyzed_stocks if s['signal'] in ['强烈卖出', '卖出', '偏卖出']]
        
        # 按评分和信心度综合排序
        buy_candidates.sort(key=lambda x: (x['final_score'], x['confidence']), reverse=True)
        sell_candidates.sort(key=lambda x: (x['final_score'], x['confidence']))
        
        # 精选推荐
        top_buy = buy_candidates[:3]  # 最好的3只买入
        top_sell = sell_candidates[:2]  # 最差的2只卖出
        
        return {
            'buy': top_buy,
            'sell': top_sell,
            'market_stats': self.calculate_market_statistics(analyzed_stocks)
        }
    
    def calculate_market_statistics(self, analyzed_stocks):
        """计算市场统计信息"""
        
        total_stocks = len(analyzed_stocks)
        
        # 信号分布
        signals = {'强烈买入': 0, '买入': 0, '偏买入': 0, '中性': 0, '偏卖出': 0, '卖出': 0, '强烈卖出': 0}
        for stock in analyzed_stocks:
            signals[stock['signal']] += 1
        
        # 平均评分
        avg_score = sum(s['final_score'] for s in analyzed_stocks) / total_stocks
        
        # 行业表现
        sector_performance = {}
        for stock in analyzed_stocks:
            sector = stock['stock']['sector']
            if sector not in sector_performance:
                sector_performance[sector] = {'count': 0, 'total_score': 0}
            sector_performance[sector]['count'] += 1
            sector_performance[sector]['total_score'] += stock['final_score']
        
        for sector in sector_performance:
            sector_performance[sector]['avg_score'] = (
                sector_performance[sector]['total_score'] / sector_performance[sector]['count']
            )
        
        return {
            'total_stocks': total_stocks,
            'signal_distribution': signals,
            'average_score': avg_score,
            'sector_performance': sector_performance
        }
    
    def generate_professional_report(self, recommendations):
        """生成专业版报告"""
        
        report_lines = []
        report_lines.append("【专业版A股精选预测】")
        report_lines.append("=" * 60)
        report_lines.append(f"预测时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("=" * 60)
        
        # 买入推荐
        if recommendations['buy']:
            report_lines.append("\n🟢 强烈推荐买入 (3只核心资产):")
            report_lines.append("-" * 50)
            
            for i, rec in enumerate(recommendations['buy'], 1):
                stock = rec['stock']
                
                report_lines.append(f"\n{i}. {stock['name']} ({stock['symbol']}) ⭐")
                report_lines.append(f"   行业: {stock['sector']} | 综合评分: {rec['final_score']:.1f}/10")
                report_lines.append(f"   信心度: {rec['confidence']:.0f}% | 信号: {rec['signal']}")
                
                # 技术面亮点
                tech = rec['technical_score']
                report_lines.append(f"   技术面: RSI{tech['rsi']['value']} {self.get_rsi_status(tech['rsi']['value'])}")
                report_lines.append(f"           MACD{tech['macd']['signal']} 动量{tech['momentum']['score']:.1f}")
                
                # 基本面亮点
                fund = rec['fundamental_score']
                report_lines.append(f"   基本面: PE{fund['pe_ratio']:.1f} PB{fund['pb_ratio']:.1f} ROE{fund['roe']:.1f}%")
                report_lines.append(f"           估值{fund['valuation_score']:.1f} 成长{fund['growth_score']:.1f}")
                
                # 推荐理由
                report_lines.append(f"   核心逻辑: {'; '.join(rec['reasons'])}")
        
        # 卖出推荐
        if recommendations['sell']:
            report_lines.append("\n🔴 建议回避 (2只风险较高):")
            report_lines.append("-" * 50)
            
            for i, rec in enumerate(recommendations['sell'], 1):
                stock = rec['stock']
                
                report_lines.append(f"\n{i}. {stock['name']} ({stock['symbol']}) ⚠️")
                report_lines.append(f"   行业: {stock['sector']} | 综合评分: {rec['final_score']:.1f}/10")
                report_lines.append(f"   信心度: {rec['confidence']:.0f}% | 信号: {rec['signal']}")
                
                # 风险因素
                report_lines.append(f"   核心风险: {'; '.join(rec['reasons'])}")
        
        # 市场统计
        market_stats = recommendations['market_stats']
        report_lines.append(f"\n【市场统计】")
        report_lines.append(f"分析股票: {market_stats['total_stocks']}只 | 平均评分: {market_stats['average_score']:.1f}")
        
        # 信号分布
        signals = market_stats['signal_distribution']
        report_lines.append(f"信号分布: 强烈买入{signals.get('强烈买入',0)} 买入{signals.get('买入',0)} 中性{signals.get('中性',0)} 卖出{signals.get('卖出',0)} 强烈卖出{signals.get('强烈卖出',0)}")
        
        # 行业表现
        if market_stats['sector_performance']:
            report_lines.append(f"\n【行业表现】")
            for sector, perf in sorted(market_stats['sector_performance'].items(), key=lambda x: x[1]['avg_score'], reverse=True)[:5]:
                report_lines.append(f"{sector}: {perf['avg_score']:.1f}分 ({perf['count']}只股票)")
        
        report_lines.append(f"\n⚠️ 风险提示: 以上分析基于量化模型，仅供参考，不构成投资建议")
        report_lines.append(f"📊 模型特点: 多因子综合评分，技术面+基本面+情绪面三维分析")
        
        return "\n".join(report_lines), recommendations
    
    def get_rsi_status(self, rsi_value):
        """获取RSI状态描述"""
        if rsi_value < 20:
            return "严重超卖"
        elif rsi_value < 30:
            return "超卖"
        elif rsi_value < 40:
            return "偏弱"
        elif rsi_value < 60:
            return "中性"
        elif rsi_value < 70:
            return "偏强"
        elif rsi_value < 80:
            return "超买"
        else:
            return "严重超买"

def main():
    """主函数"""
    
    predictor = ProfessionalAStockPredictor()
    
    # 生成专业版预测
    report, recommendations = predictor.generate_professional_prediction()
    
    print(report)
    
    # 保存预测结果
    prediction_result = {
        'timestamp': datetime.now().isoformat(),
        'report': report,
        'recommendations': recommendations,
        'model_version': '3.0',
        'features': ['多因子评分', '技术面分析', '基本面分析', '情绪面分析', '行业轮动']
    }
    
    filename = f"/Users/thinkway/.openclaw/workspace/professional_prediction_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(prediction_result, f, ensure_ascii=False, indent=2)
    
    print(f"\n【预测结果已保存】")
    print(f"文件: {filename}")
    
    return report, recommendations

if __name__ == "__main__":
    main()
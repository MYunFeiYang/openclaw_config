#!/usr/bin/env python3
"""
A股精选5股预测验证系统
从全A股中精选最值得买和最不值得买的5只股票
"""

import json
import random
from datetime import datetime, timedelta
import os

class AStockTop5PredictionSystem:
    def __init__(self):
        # 模拟A股全市场股票池（实际应用中可接入真实数据源）
        self.all_stocks = self.generate_a_stock_universe()
        self.prediction_history_file = "/Users/thinkway/.openclaw/workspace/a_stock_top5_predictions.json"
        self.load_prediction_history()
    
    def generate_a_stock_universe(self):
        """生成A股全市场模拟数据"""
        sectors = {
            '银行': ['工商银行', '建设银行', '农业银行', '中国银行', '招商银行', '平安银行', '兴业银行', '浦发银行'],
            '白酒': ['贵州茅台', '五粮液', '泸州老窖', '山西汾酒', '洋河股份', '古井贡酒', '今世缘', '水井坊'],
            '医药': ['恒瑞医药', '复星医药', '药明康德', '智飞生物', '长春高新', '迈瑞医疗', '爱尔眼科', '通策医疗'],
            '科技': ['海康威视', '京东方A', '立讯精密', '歌尔股份', '中兴通讯', '紫光股份', '浪潮信息', '中科曙光'],
            '新能源': ['宁德时代', '比亚迪', '隆基绿能', '通威股份', '阳光电源', '亿纬锂能', '恩捷股份', '天赐材料'],
            '消费': ['伊利股份', '蒙牛乳业', '海天味业', '中炬高新', '千禾味业', '恒顺醋业', '涪陵榨菜', '绝味食品'],
            '地产': ['万科A', '保利发展', '招商蛇口', '金地集团', '华侨城A', '绿地控股', '华夏幸福', '荣盛发展'],
            '化工': ['万华化学', '恒力石化', '荣盛石化', '桐昆股份', '华鲁恒升', '鲁西化工', '浙江龙盛', '闰土股份'],
            '汽车': ['上汽集团', '广汽集团', '长安汽车', '长城汽车', '吉利汽车', '江淮汽车', '东风汽车', '一汽解放'],
            '有色': ['紫金矿业', '江西铜业', '云南铜业', '铜陵有色', '中国铝业', '云铝股份', '神火股份', '南山铝业']
        }
        
        stocks = []
        for sector, names in sectors.items():
            for i, name in enumerate(names):
                # 生成股票代码
                if sector == '银行':
                    code = f'600000'[:-len(str(i+1))] + str(i+1)
                elif sector == '白酒':
                    code = f'000000'[:-len(str(i+1))] + str(i+1)
                else:
                    code = f'600{i+1:03d}' if i < 500 else f'300{i-499:03d}'
                
                # 生成基础价格和市值
                if name in ['贵州茅台']:
                    base_price = random.uniform(1500, 1800)
                    market_cap = random.uniform(18000, 22000)  # 亿
                elif name in ['五粮液']:
                    base_price = random.uniform(150, 200)
                    market_cap = random.uniform(6000, 8000)
                elif name in ['宁德时代', '比亚迪']:
                    base_price = random.uniform(200, 400)
                    market_cap = random.uniform(5000, 12000)
                elif sector == '银行':
                    base_price = random.uniform(3, 15)
                    market_cap = random.uniform(2000, 15000)
                elif sector == '科技':
                    base_price = random.uniform(20, 80)
                    market_cap = random.uniform(500, 3000)
                else:
                    base_price = random.uniform(10, 100)
                    market_cap = random.uniform(200, 3000)
                
                stocks.append({
                    'symbol': code,
                    'name': name,
                    'sector': sector,
                    'base_price': base_price,
                    'market_cap': market_cap,
                    'pe_ratio': random.uniform(8, 50),
                    'pb_ratio': random.uniform(0.5, 8.0),
                    'roe': random.uniform(5, 25),
                    'debt_ratio': random.uniform(0.2, 0.8)
                })
        
        return stocks
    
    def load_prediction_history(self):
        """加载历史预测数据"""
        if os.path.exists(self.prediction_history_file):
            try:
                with open(self.prediction_history_file, 'r', encoding='utf-8') as f:
                    self.history = json.load(f)
            except:
                self.history = []
        else:
            self.history = []
    
    def save_prediction_history(self):
        """保存预测历史"""
        with open(self.prediction_history_file, 'w', encoding='utf-8') as f:
            json.dump(self.history, f, ensure_ascii=False, indent=2)
    
    def scan_a_stock_market(self):
        """扫描全A股市场，找出最值得关注的股票"""
        
        print(f"【A股全市场扫描】 ({len(self.all_stocks)}只股票)")
        print("=" * 50)
        print(f"扫描时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)
        
        scored_stocks = []
        
        for stock in self.all_stocks:
            # 模拟当前价格变动
            price_change = random.uniform(-0.05, 0.05)  # -5% 到 +5%
            current_price = stock['base_price'] * (1 + price_change)
            change_percent = price_change * 100
            
            # 计算综合评分
            score = self.calculate_comprehensive_score(stock, current_price, change_percent)
            
            scored_stocks.append({
                'stock': stock,
                'current_price': current_price,
                'change_percent': change_percent,
                'score': score['total_score'],
                'ranking_factors': score['factors'],
                'signal': score['signal'],
                'confidence': score['confidence'],
                'reasons': score['reasons']
            })
        
        # 按评分排序
        scored_stocks.sort(key=lambda x: x['score'], reverse=True)
        
        # 选出最值得买的3只和最不值得买的2只
        top_buy_candidates = [s for s in scored_stocks if s['signal'] in ['强烈买入', '买入']][:5]
        top_sell_candidates = [s for s in scored_stocks if s['signal'] in ['强烈卖出', '卖出']][:3]
        
        # 如果好股票不够，从持有中找
        if len(top_buy_candidates) < 3:
            hold_candidates = [s for s in scored_stocks if s['signal'] == '持有'][:3-len(top_buy_candidates)]
            top_buy_candidates.extend(hold_candidates)
        
        # 精选最终推荐
        final_recommendations = {
            'buy': self.select_top_stocks(top_buy_candidates, 3, 'buy'),
            'sell': self.select_top_stocks(top_sell_candidates, 2, 'sell'),
            'market_summary': self.generate_market_summary(scored_stocks)
        }
        
        return final_recommendations
    
    def calculate_comprehensive_score(self, stock, current_price, change_percent):
        """计算股票综合评分"""
        
        score = 0
        factors = []
        reasons = []
        
        # 1. 估值评分 (30%权重)
        pe_score = self.score_pe_ratio(stock['pe_ratio'], stock['sector'])
        pb_score = self.score_pb_ratio(stock['pb_ratio'], stock['sector'])
        valuation_score = (pe_score + pb_score) / 2
        score += valuation_score * 0.3
        factors.append(f"估值:{valuation_score:.1f}")
        
        # 2. 盈利能力评分 (25%权重)
        profitability_score = self.score_profitability(stock['roe'], stock['sector'])
        score += profitability_score * 0.25
        factors.append(f"盈利:{profitability_score:.1f}")
        
        # 3. 技术面评分 (25%权重)
        technical_score = self.score_technical(change_percent, current_price, stock['base_price'])
        score += technical_score * 0.25
        factors.append(f"技术:{technical_score:.1f}")
        
        # 4. 行业前景评分 (20%权重)
        sector_score = self.score_sector_outlook(stock['sector'])
        score += sector_score * 0.2
        factors.append(f"行业:{sector_score:.1f}")
        
        # 5. 市值因素调整
        market_cap_score = self.score_market_cap(stock['market_cap'])
        score += market_cap_score
        
        # 确定信号和信心度
        signal, confidence = self.determine_signal_and_confidence(score, factors)
        
        # 生成具体理由
        reasons = self.generate_specific_reasons(stock, current_price, change_percent, score, factors)
        
        return {
            'total_score': round(score, 2),
            'factors': factors,
            'signal': signal,
            'confidence': confidence,
            'reasons': reasons
        }
    
    def score_pe_ratio(self, pe_ratio, sector):
        """PE估值评分"""
        sector_avg_pe = {
            '银行': 6, '白酒': 25, '医药': 30, '科技': 35,
            '新能源': 40, '消费': 25, '地产': 8, '化工': 15, '汽车': 20, '有色': 12
        }
        
        avg_pe = sector_avg_pe.get(sector, 20)
        
        if pe_ratio < avg_pe * 0.7:  # 显著低估
            return 10
        elif pe_ratio < avg_pe * 0.85:  # 轻微低估
            return 8
        elif pe_ratio < avg_pe * 1.0:  # 合理偏低
            return 6
        elif pe_ratio < avg_pe * 1.15:  # 合理偏高
            return 4
        elif pe_ratio < avg_pe * 1.3:  # 轻微高估
            return 2
        else:  # 显著高估
            return 0
    
    def score_pb_ratio(self, pb_ratio, sector):
        """PB估值评分"""
        if sector == '银行' and pb_ratio < 1:
            return 10  # 银行股破净是机会
        elif pb_ratio < 1:
            return 8   # 其他行业破净
        elif pb_ratio < 2:
            return 6
        elif pb_ratio < 3:
            return 4
        elif pb_ratio < 5:
            return 2
        else:
            return 0
    
    def score_profitability(self, roe, sector):
        """盈利能力评分"""
        if roe > 20:
            return 10
        elif roe > 15:
            return 8
        elif roe > 12:
            return 6
        elif roe > 8:
            return 4
        elif roe > 5:
            return 2
        else:
            return 0
    
    def score_technical(self, change_percent, current_price, base_price):
        """技术面评分"""
        score = 5  # 基础分
        
        # 近期表现
        if change_percent < -3:
            score += 3  # 超跌反弹机会
        elif change_percent < -1:
            score += 1  # 轻微超卖
        elif change_percent > 5:
            score -= 3  # 涨幅过大，风险增加
        elif change_percent > 2:
            score -= 1  # 涨幅较大，谨慎
        
        # 相对位置（简化RSI概念）
        price_position = (current_price - base_price * 0.9) / (base_price * 1.1 - base_price * 0.9)
        if price_position < 0.3:
            score += 2  # 相对低位
        elif price_position > 0.7:
            score -= 2  # 相对高位
        
        return max(0, min(10, score))
    
    def score_sector_outlook(self, sector):
        """行业前景评分"""
        sector_scores = {
            '白酒': 9,      # 消费升级，品牌溢价
            '医药': 8,      # 人口老龄化，创新药发展
            '新能源': 8,    # 碳中和政策，技术成熟
            '科技': 7,      # 国产替代，AI发展
            '消费': 7,      # 内需增长，品牌升级
            '银行': 6,      # 息差压力，但分红稳定
            '化工': 5,      # 周期性强，环保压力
            '有色': 5,      # 价格波动大，需求不确定
            '汽车': 6,      # 新能源转型，竞争激烈
            '地产': 3       # 政策调控，去杠杆
        }
        return sector_scores.get(sector, 5)
    
    def score_market_cap(self, market_cap):
        """市值评分（流动性考虑）"""
        if market_cap > 5000:  # 大盘股
            return 2  # 流动性好，但成长性有限
        elif market_cap > 1000:  # 中盘股
            return 3  # 平衡性好
        elif market_cap > 200:  # 小盘股
            return 2  # 成长性好，但流动性一般
        else:  # 微盘股
            return 1  # 风险较高
    
    def determine_signal_and_confidence(self, total_score, factors):
        """确定买卖信号和信心度"""
        if total_score >= 8.5:
            signal = "强烈买入"
            confidence = random.uniform(85, 95)
        elif total_score >= 7.0:
            signal = "买入"
            confidence = random.uniform(75, 85)
        elif total_score >= 5.5:
            signal = "持有"
            confidence = random.uniform(60, 75)
        elif total_score >= 4.0:
            signal = "卖出"
            confidence = random.uniform(65, 75)
        else:
            signal = "强烈卖出"
            confidence = random.uniform(75, 85)
        
        return signal, round(confidence, 0)
    
    def generate_specific_reasons(self, stock, current_price, change_percent, score, factors):
        """生成具体的投资理由"""
        reasons = []
        
        # 估值理由
        if stock['pe_ratio'] < 10:
            reasons.append("估值偏低，安全边际高")
        elif stock['pe_ratio'] > 40:
            reasons.append("估值偏高，需要谨慎")
        
        # 盈利能力理由
        if stock['roe'] > 15:
            reasons.append("盈利能力强，ROE优秀")
        elif stock['roe'] < 8:
            reasons.append("盈利能力一般，需关注")
        
        # 技术面理由
        if change_percent < -3:
            reasons.append("短期超跌，存在反弹机会")
        elif change_percent > 3:
            reasons.append("近期涨幅较大，注意回调风险")
        
        # 行业理由
        if stock['sector'] in ['白酒', '医药']:
            reasons.append(f"{stock['sector']}行业景气度较高")
        elif stock['sector'] in ['地产']:
            reasons.append(f"{stock['sector']}行业面临政策调控")
        
        # 市值理由
        if stock['market_cap'] > 5000:
            reasons.append("大盘蓝筹，流动性好")
        elif stock['market_cap'] < 500:
            reasons.append("中小盘股，弹性较大")
        
        return reasons[:3]  # 取前3个最重要的理由
    
    def select_top_stocks(self, candidates, count, signal_type):
        """从候选股票中精选最终推荐"""
        
        if not candidates:
            return []
        
        # 按评分排序，同时考虑多样性（不同行业）
        selected = []
        used_sectors = set()
        
        # 先按评分排序
        candidates_sorted = sorted(candidates, key=lambda x: x['score'], reverse=True)
        
        for candidate in candidates_sorted:
            sector = candidate['stock']['sector']
            
            # 尽量分散行业
            if len(selected) < count and (sector not in used_sectors or len(selected) >= count - 1):
                selected.append({
                    'symbol': candidate['stock']['symbol'],
                    'name': candidate['stock']['name'],
                    'sector': sector,
                    'current_price': round(candidate['current_price'], 2),
                    'change_percent': round(candidate['change_percent'], 2),
                    'signal': candidate['signal'],
                    'confidence': candidate['confidence'],
                    'score': candidate['score'],
                    'reasons': candidate['reasons'],
                    'market_cap': candidate['stock']['market_cap'],
                    'pe_ratio': candidate['stock']['pe_ratio'],
                    'pb_ratio': candidate['stock']['pb_ratio'],
                    'roe': candidate['stock']['roe']
                })
                used_sectors.add(sector)
                
                if len(selected) >= count:
                    break
        
        return selected
    
    def generate_market_summary(self, all_stocks):
        """生成市场概况"""
        
        total_stocks = len(all_stocks)
        
        # 统计信号分布
        signals = {'强烈买入': 0, '买入': 0, '持有': 0, '卖出': 0, '强烈卖出': 0}
        sectors = {}
        
        for stock in all_stocks:
            signals[stock['signal']] += 1
            
            sector = stock['stock']['sector']
            if sector not in sectors:
                sectors[sector] = {'buy': 0, 'sell': 0, 'hold': 0, 'total': 0}
            
            if stock['signal'] in ['强烈买入', '买入']:
                sectors[sector]['buy'] += 1
            elif stock['signal'] in ['强烈卖出', '卖出']:
                sectors[sector]['sell'] += 1
            else:
                sectors[sector]['hold'] += 1
            sectors[sector]['total'] += 1
        
        # 找出最看好的行业
        hot_sectors = []
        cold_sectors = []
        
        for sector, counts in sectors.items():
            if counts['total'] > 5:  # 只统计股票数量足够的行业
                buy_ratio = counts['buy'] / counts['total']
                sell_ratio = counts['sell'] / counts['total']
                
                if buy_ratio > 0.4:
                    hot_sectors.append(sector)
                elif sell_ratio > 0.4:
                    cold_sectors.append(sector)
        
        return {
            'total_stocks': total_stocks,
            'signal_distribution': signals,
            'hot_sectors': hot_sectors,
            'cold_sectors': cold_sectors,
            'avg_score': sum(s['score'] for s in all_stocks) / total_stocks
        }
    
    def generate_morning_prediction(self):
        """生成盘前预测"""
        
        recommendations = self.scan_a_stock_market()
        
        report_lines = []
        report_lines.append("【A股精选5股预测】")
        report_lines.append(datetime.now().strftime('%m月%d日 %H:%M'))
        report_lines.append("")
        
        # 最值得买的3只股票
        if recommendations['buy']:
            report_lines.append("🟢 最值得买入 (3只):")
            for i, stock in enumerate(recommendations['buy'], 1):
                report_lines.append(f"{i}. {stock['name']} ({stock['symbol']})")
                report_lines.append(f"   行业: {stock['sector']}")
                report_lines.append(f"   当前价: ¥{stock['current_price']:.2f}")
                report_lines.append(f"   信号: {stock['signal']} (信心{stock['confidence']}%)")
                report_lines.append(f"   评分: {stock['score']:.1f}分")
                report_lines.append(f"   理由: {', '.join(stock['reasons'][:2])}")
                report_lines.append("")
        
        # 最不值得买的2只股票
        if recommendations['sell']:
            report_lines.append("🔴 最不值得买入 (2只):")
            for i, stock in enumerate(recommendations['sell'], 1):
                report_lines.append(f"{i}. {stock['name']} ({stock['symbol']})")
                report_lines.append(f"   行业: {stock['sector']}")
                report_lines.append(f"   当前价: ¥{stock['current_price']:.2f}")
                report_lines.append(f"   信号: {stock['signal']} (信心{stock['confidence']}%)")
                report_lines.append(f"   评分: {stock['score']:.1f}分")
                report_lines.append(f"   理由: {', '.join(stock['reasons'][:2])}")
                report_lines.append("")
        
        # 市场概况
        market_summary = recommendations['market_summary']
        report_lines.append("【市场概况】")
        report_lines.append(f"扫描股票: {market_summary['total_stocks']}只")
        report_lines.append(f"平均评分: {market_summary['avg_score']:.1f}分")
        
        if market_summary['hot_sectors']:
            report_lines.append(f"热门行业: {', '.join(market_summary['hot_sectors'])}")
        
        if market_summary['cold_sectors']:
            report_lines.append(f"谨慎行业: {', '.join(market_summary['cold_sectors'])}")
        
        report_lines.append("")
        report_lines.append("⚠️ 风险提示: 以上分析仅供参考，不构成投资建议")
        
        # 保存今日推荐
        today_predictions = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'time': 'morning',
            'recommendations': recommendations,
            'generated_at': datetime.now().isoformat()
        }
        
        self.history.append(today_predictions)
        self.save_prediction_history()
        
        return "\n".join(report_lines), recommendations
    
    def generate_evening_validation(self):
        """生成盘后验证"""
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        # 找到今天的推荐
        today_predictions = None
        for prediction in self.history:
            if prediction['date'] == today and prediction['time'] == 'morning':
                today_predictions = prediction
                break
        
        if not today_predictions:
            return "【今日暂无推荐数据】", None
        
        report_lines = []
        report_lines.append("【A股精选5股验证】")
        report_lines.append(datetime.now().strftime('%m月%d日 %H:%M'))
        report_lines.append("")
        
        correct_count = 0
        total_recommendations = 0
        
        # 验证买入推荐
        if today_predictions['recommendations']['buy']:
            report_lines.append("🟢 买入推荐验证:")
            
            for i, predicted_stock in enumerate(today_predictions['recommendations']['buy'], 1):
                # 模拟实际收盘结果
                actual_change = random.uniform(-0.06, 0.06)  # -6% 到 +6%
                actual_price = predicted_stock['current_price'] * (1 + actual_change)
                
                # 判断推荐是否正确
                predicted_signal = predicted_stock['signal']
                actual_trend = '上涨' if actual_change > 0.005 else '下跌' if actual_change < -0.005 else '震荡'
                
                # 推荐逻辑验证
                is_direction_correct = self.validate_direction_prediction(predicted_signal, actual_change)
                magnitude_accuracy = self.calculate_magnitude_accuracy(predicted_stock, actual_change)
                
                if is_direction_correct:
                    correct_count += 1
                
                total_recommendations += 1
                
                # 生成验证结果
                accuracy_icon = "✅" if is_direction_correct else "❌"
                trend_icon = "📈" if actual_change > 0 else "📉" if actual_change < 0 else "➡️"
                
                report_lines.append(f"{i}. {predicted_stock['name']} ({predicted_stock['symbol']})")
                report_lines.append(f"   预测: {predicted_signal}")
                report_lines.append(f"   实际: {trend_icon} {actual_trend} ({actual_change:+.2f}%)")
                report_lines.append(f"   收盘: ¥{actual_price:.2f}")
                report_lines.append(f"   验证: {accuracy_icon} 方向{'正确' if is_direction_correct else '错误'}")
                report_lines.append(f"   幅度准确度: {magnitude_accuracy:.0f}%")
                
                if not is_direction_correct:
                    report_lines.append(f"   偏差分析: {self.analyze_prediction_error(predicted_stock, actual_change)}")
                
                report_lines.append("")
        
        # 验证卖出推荐
        if today_predictions['recommendations']['sell']:
            report_lines.append("🔴 卖出推荐验证:")
            
            for i, predicted_stock in enumerate(today_predictions['recommendations']['sell'], 1):
                # 模拟实际收盘结果
                actual_change = random.uniform(-0.06, 0.06)
                actual_price = predicted_stock['current_price'] * (1 + actual_change)
                
                # 判断推荐是否正确（卖出推荐意味着预测下跌）
                predicted_signal = predicted_stock['signal']
                is_avoidance_correct = self.validate_avoidance_prediction(predicted_signal, actual_change)
                
                if is_avoidance_correct:
                    correct_count += 1
                
                total_recommendations += 1
                
                # 生成验证结果
                accuracy_icon = "✅" if is_avoidance_correct else "❌"
                trend_icon = "📈" if actual_change > 0 else "📉" if actual_change < 0 else "➡️"
                
                report_lines.append(f"{i}. {predicted_stock['name']} ({predicted_stock['symbol']})")
                report_lines.append(f"   预测: {predicted_signal}")
                report_lines.append(f"   实际: {trend_icon} {actual_change:+.2f}%")
                report_lines.append(f"   收盘: ¥{actual_price:.2f}")
                report_lines.append(f"   验证: {accuracy_icon} 回避建议{'正确' if is_avoidance_correct else '错误'}")
                
                if not is_avoidance_correct:
                    report_lines.append(f"   偏差分析: {self.analyze_avoidance_error(predicted_stock, actual_change)}")
                
                report_lines.append("")
        
        # 计算准确率
        accuracy_rate = (correct_count / total_recommendations * 100) if total_recommendations > 0 else 0
        
        report_lines.append("【推荐准确性总结】")
        report_lines.append(f"总推荐数: {total_recommendations}只")
        report_lines.append(f"准确数: {correct_count}只")
        report_lines.append(f"准确率: {accuracy_rate:.1f}%")
        report_lines.append(f"评级: {self.get_accuracy_rating(accuracy_rate)}")
        
        # 历史准确率统计
        historical_accuracy = self.calculate_historical_accuracy()
        if historical_accuracy:
            report_lines.append(f"历史平均: {historical_accuracy:.1f}%")
        
        # 更新今日推荐的实际结果
        self.update_today_results(today_predictions, correct_count, total_recommendations, accuracy_rate)
        
        report_lines.append("")
        report_lines.append("【明日展望】")
        tomorrow_insights = self.generate_tomorrow_insights(today_predictions, accuracy_rate)
        for insight in tomorrow_insights:
            report_lines.append(f"• {insight}")
        
        report_lines.append("")
        report_lines.append("⚠️ 免责声明: 历史表现不代表未来收益，投资需谨慎")
        
        return "\n".join(report_lines), accuracy_rate
    
    def validate_direction_prediction(self, predicted_signal, actual_change):
        """验证方向预测是否正确"""
        if predicted_signal in ['强烈买入', '买入']:
            return actual_change > 0.005  # 预测上涨，实际涨幅>0.5%
        elif predicted_signal in ['强烈卖出', '卖出']:
            return actual_change < -0.005  # 预测下跌，实际跌幅>0.5%
        else:  # 持有
            return -0.005 <= actual_change <= 0.005  # 预测震荡，实际在±0.5%内
    
    def validate_avoidance_prediction(self, predicted_signal, actual_change):
        """验证回避建议是否正确（卖出推荐意味着应该避免买入）"""
        if predicted_signal in ['强烈卖出', '卖出']:
            return actual_change < 0.005  # 建议回避，实际没有明显上涨
        else:
            return True  # 其他信号不验证回避建议
    
    def calculate_magnitude_accuracy(self, predicted_stock, actual_change):
        """计算预测幅度的准确度"""
        # 从预测信号估算预测幅度
        if predicted_stock['signal'] == '强烈买入':
            predicted_magnitude = 0.03  # 预测+3%
        elif predicted_stock['signal'] == '买入':
            predicted_magnitude = 0.02  # 预测+2%
        elif predicted_stock['signal'] == '强烈卖出':
            predicted_magnitude = -0.03  # 预测-3%
        elif predicted_stock['signal'] == '卖出':
            predicted_magnitude = -0.02  # 预测-2%
        else:
            predicted_magnitude = 0.0   # 预测震荡
        
        # 计算幅度准确度
        if predicted_magnitude != 0:
            accuracy = (1 - abs(predicted_magnitude - actual_change) / abs(predicted_magnitude)) * 100
            return max(0, min(100, accuracy))
        else:
            return 50 if -0.01 <= actual_change <= 0.01 else 0
    
    def analyze_prediction_error(self, predicted_stock, actual_change):
        """分析预测错误的原因"""
        error_reasons = []
        
        if abs(actual_change) > 0.04:  # 涨跌幅超过4%
            error_reasons.append("市场波动超预期")
        
        if predicted_stock['stock']['sector'] in ['科技', '新能源']:
            error_reasons.append("高波动行业，受消息面影响大")
        
        if not error_reasons:
            error_reasons.append("市场情绪变化")
        
        return error_reasons[0]
    
    def analyze_avoidance_error(self, predicted_stock, actual_change):
        """分析回避建议错误的原因"""
        if actual_change > 0.03:
            return "利好消息刺激，超出预期"
        elif actual_change > 0.01:
            return "市场情绪偏乐观"
        else:
            return "短期资金推动"
    
    def get_accuracy_rating(self, accuracy_rate):
        """获取准确率评级"""
        if accuracy_rate >= 80:
            return "优秀 🏆"
        elif accuracy_rate >= 70:
            return "良好 👍"
        elif accuracy_rate >= 60:
            return "一般 🤔"
        else:
            return "需改进 📈"
    
    def calculate_historical_accuracy(self):
        """计算历史平均准确率"""
        completed_predictions = []
        
        for prediction in self.history:
            if 'validation_result' in prediction and prediction['validation_result']:
                completed_predictions.append(prediction)
        
        if not completed_predictions:
            return None
        
        total_accuracy = sum(p['validation_result']['accuracy_rate'] for p in completed_predictions)
        return total_accuracy / len(completed_predictions)
    
    def update_today_results(self, today_predictions, correct_count, total_recommendations, accuracy_rate):
        """更新今日推荐的验证结果"""
        today_predictions['validation_result'] = {
            'correct_count': correct_count,
            'total_recommendations': total_recommendations,
            'accuracy_rate': accuracy_rate,
            'validated_at': datetime.now().isoformat()
        }
        
        self.save_prediction_history()
    
    def generate_tomorrow_insights(self, today_predictions, accuracy_rate):
        """基于今日表现生成明日投资洞察"""
        insights = []
        
        # 基于准确率调整策略
        if accuracy_rate < 50:
            insights.append("近期预测准确率偏低，建议更加谨慎")
            insights.append("关注市场突发事件对个股的影响")
        elif accuracy_rate > 75:
            insights.append("预测准确率较高，可适当参考推荐")
        
        # 基于今日表现分析明日机会
        if today_predictions['recommendations']['buy']:
            buy_stocks = today_predictions['recommendations']['buy']
            sectors = [stock['sector'] for stock in buy_stocks]
            sector_counts = {}
            for sector in sectors:
                sector_counts[sector] = sector_counts.get(sector, 0) + 1
            
            # 找出热门行业
            if sector_counts:
                hot_sector
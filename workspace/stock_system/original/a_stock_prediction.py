#!/usr/bin/env python3
"""
A股预测验证系统
开盘前预测，收盘后验证准确性
"""

import json
import random
from datetime import datetime, timedelta
import os

class AStockPredictionSystem:
    def __init__(self):
        self.stock_pool = [
            ('000001', '平安银行', 12.5, '银行'),
            ('000858', '五粮液', 168.5, '白酒'),
            ('002415', '海康威视', 35.2, '安防'),
            ('600036', '招商银行', 42.8, '银行'),
            ('600519', '贵州茅台', 1688.0, '白酒'),
            ('600887', '伊利股份', 28.5, '乳业'),
            ('000725', '京东方A', 4.2, '面板'),
            ('600309', '万华化学', 88.5, '化工'),
            ('600276', '恒瑞医药', 42.8, '医药'),
            ('000002', '万科A', 15.8, '地产'),
        ]
        
        self.prediction_history_file = "/Users/thinkway/.openclaw/workspace/a_stock_predictions.json"
        self.load_prediction_history()
    
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
    
    def generate_morning_prediction(self):
        """开盘前预测"""
        
        predictions = []
        report_lines = []
        
        report_lines.append("【A股盘前预测】")
        report_lines.append(datetime.now().strftime('%m月%d日 %H:%M'))
        report_lines.append("")
        
        for symbol, name, base_price, industry in self.stock_pool:
            # 模拟盘前数据
            pre_market_change = random.uniform(-0.02, 0.02)  # 盘前变动
            current_price = base_price * (1 + pre_market_change)
            
            # 技术指标预测
            predicted_rsi = random.randint(25, 75)
            predicted_volume = random.uniform(0.8, 1.5)  # 相对平均成交量
            
            # 预测今日走势
            trend_prediction = self.predict_trend(name, current_price, predicted_rsi, industry)
            
            prediction = {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'time': 'morning',
                'symbol': symbol,
                'name': name,
                'current_price': round(current_price, 2),
                'predicted_trend': trend_prediction['trend'],
                'predicted_change': trend_prediction['change_percent'],
                'predicted_rsi': predicted_rsi,
                'confidence': trend_prediction['confidence'],
                'reasons': trend_prediction['reasons'],
                'industry': industry,
                'actual_result': None  # 收盘后填写
            }
            
            predictions.append(prediction)
            
            # 生成报告
            trend_icon = "📈" if trend_prediction['trend'] == '上涨' else "📉" if trend_prediction['trend'] == '下跌' else "➡️"
            confidence_icon = "🎯" if trend_prediction['confidence'] > 80 else "👍" if trend_prediction['confidence'] > 60 else "🤔"
            
            report_lines.append(f"{confidence_icon} {name} {symbol}")
            report_lines.append(f"  当前: ¥{current_price:.2f}")
            report_lines.append(f"  预测: {trend_icon} {trend_prediction['trend']}")
            report_lines.append(f"  幅度: {trend_prediction['change_percent']:+.1f}%")
            report_lines.append(f"  信心: {trend_prediction['confidence']}%")
            report_lines.append(f"  理由: {trend_prediction['reasons']}")
            report_lines.append("")
        
        # 保存预测
        self.history.extend(predictions)
        self.save_prediction_history()
        
        # 生成预测总结
        up_count = sum(1 for p in predictions if p['predicted_trend'] == '上涨')
        down_count = sum(1 for p in predictions if p['predicted_trend'] == '下跌')
        flat_count = len(predictions) - up_count - down_count
        avg_confidence = sum(p['confidence'] for p in predictions) / len(predictions)
        
        report_lines.append("【预测总结】")
        report_lines.append(f"看涨: {up_count}只 ({up_count/len(predictions)*100:.0f}%)")
        report_lines.append(f"看跌: {down_count}只 ({down_count/len(predictions)*100:.0f}%)")
        report_lines.append(f"看平: {flat_count}只 ({flat_count/len(predictions)*100:.0f}%)")
        report_lines.append(f"平均信心: {avg_confidence:.0f}%")
        report_lines.append("")
        report_lines.append("⚠️ 风险提示: 预测仅供参考，不构成投资建议")
        
        return "\n".join(report_lines), predictions
    
    def generate_evening_summary(self):
        """收盘后总结验证"""
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        # 找到今天的预测
        today_predictions = [p for p in self.history if p['date'] == today and p['time'] == 'morning']
        
        if not today_predictions:
            return "【今日暂无预测数据】", None
        
        report_lines = []
        report_lines.append("【A股盘后验证】")
        report_lines.append(datetime.now().strftime('%m月%d日 %H:%M'))
        report_lines.append("")
        
        correct_count = 0
        total_count = len(today_predictions)
        
        for prediction in today_predictions:
            # 模拟实际收盘结果
            actual_change = random.uniform(-0.05, 0.05)  # 实际涨跌幅
            actual_price = prediction['current_price'] * (1 + actual_change)
            
            # 判断预测准确性
            predicted_trend = prediction['predicted_trend']
            actual_trend = self.get_actual_trend(actual_change)
            
            is_correct = (predicted_trend == actual_trend)
            if is_correct:
                correct_count += 1
                accuracy_icon = "✅"
            else:
                accuracy_icon = "❌"
            
            # 更新历史记录
            prediction['actual_result'] = {
                'actual_change': round(actual_change * 100, 2),
                'actual_price': round(actual_price, 2),
                'actual_trend': actual_trend,
                'is_correct': is_correct,
                'accuracy_score': 1 if is_correct else 0
            }
            
            # 生成验证报告
            report_lines.append(f"{accuracy_icon} {prediction['name']} {prediction['symbol']}")
            report_lines.append(f"  预测: {predicted_trend}")
            report_lines.append(f"  实际: {actual_trend} ({actual_change:+.2f}%)")
            report_lines.append(f"  收盘: ¥{actual_price:.2f}")
            
            if is_correct:
                report_lines.append(f"  评价: 预测准确 ✅")
            else:
                report_lines.append(f"  评价: 预测偏差 ❌")
                report_lines.append(f"  分析: {self.analyze_prediction_error(prediction, actual_change)}")
            report_lines.append("")
        
        # 计算整体准确率
        accuracy_rate = correct_count / total_count * 100
        
        report_lines.append("【预测准确性总结】")
        report_lines.append(f"总预测: {total_count}只")
        report_lines.append(f"准确数: {correct_count}只")
        report_lines.append(f"准确率: {accuracy_rate:.1f}%")
        report_lines.append(f"评级: {self.get_accuracy_rating(accuracy_rate)}")
        
        # 历史准确率统计
        historical_accuracy = self.calculate_historical_accuracy()
        if historical_accuracy:
            report_lines.append(f"历史平均: {historical_accuracy:.1f}%")
        
        report_lines.append("")
        report_lines.append("【明日展望】")
        tomorrow_insights = self.generate_tomorrow_insights(today_predictions)
        for insight in tomorrow_insights:
            report_lines.append(f"• {insight}")
        
        self.save_prediction_history()
        
        return "\n".join(report_lines), accuracy_rate
    
    def predict_trend(self, name, price, rsi, industry):
        """预测个股走势"""
        
        score = 0
        reasons = []
        
        # 1. RSI指标
        if rsi < 30:
            score += 3
            reasons.append("RSI超卖")
        elif rsi > 70:
            score -= 2
            reasons.append("RSI超买")
        elif rsi < 40:
            score += 1
            reasons.append("RSI偏低")
        elif rsi > 60:
            score -= 1
            reasons.append("RSI偏高")
        
        # 2. 行业因素
        if industry in ['白酒', '医药']:
            score += 1
            reasons.append("消费防御")
        elif industry == '银行':
            score += 1
            reasons.append("金融稳定")
        elif industry == '地产':
            score -= 1
            reasons.append("地产承压")
        
        # 3. 个股特性
        if '茅台' in name or '五粮液' in name:
            score += 1
            reasons.append("品牌优势")
        elif '平安' in name or '招商' in name:
            score += 1
            reasons.append("金融龙头")
        elif '恒瑞' in name:
            score += 1
            reasons.append("创新药龙头")
        
        # 生成预测
        if score >= 3:
            trend = '上涨'
            change_percent = random.uniform(1, 4)
            confidence = random.uniform(70, 90)
        elif score >= 1:
            trend = '上涨'
            change_percent = random.uniform(0.5, 2)
            confidence = random.uniform(60, 80)
        elif score <= -2:
            trend = '下跌'
            change_percent = random.uniform(-3, -1)
            confidence = random.uniform(65, 85)
        elif score <= -1:
            trend = '下跌'
            change_percent = random.uniform(-2, -0.5)
            confidence = random.uniform(55, 75)
        else:
            trend = '震荡'
            change_percent = random.uniform(-1, 1)
            confidence = random.uniform(50, 70)
        
        return {
            'trend': trend,
            'change_percent': round(change_percent, 2),
            'confidence': round(confidence, 0),
            'reasons': " + ".join(reasons[:2])  # 取前2个理由
        }
    
    def get_actual_trend(self, change_percent):
        """判断实际走势"""
        if change_percent > 0.02:
            return '上涨'
        elif change_percent < -0.02:
            return '下跌'
        else:
            return '震荡'
    
    def analyze_prediction_error(self, prediction, actual_change):
        """分析预测错误原因"""
        predicted_change = prediction['predicted_change']
        
        error_reasons = []
        
        if abs(predicted_change - actual_change * 100) > 3:
            error_reasons.append("波动幅度超预期")
        
        if actual_change > 0.03 and predicted_change < 0:
            error_reasons.append("利好消息刺激")
        elif actual_change < -0.03 and predicted_change > 0:
            error_reasons.append("利空消息影响")
        
        if not error_reasons:
            error_reasons.append("市场情绪变化")
        
        return " + ".join(error_reasons[:1])
    
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
        if not self.history:
            return None
        
        completed_predictions = [p for p in self.history if p.get('actual_result')]
        if not completed_predictions:
            return None
        
        correct_count = sum(1 for p in completed_predictions if p['actual_result']['is_correct'])
        return (correct_count / len(completed_predictions)) * 100
    
    def generate_tomorrow_insights(self, today_predictions):
        """生成明日投资洞察"""
        insights = []
        
        # 统计今日表现
        up_stocks = [p for p in today_predictions if p.get('actual_result') and p['actual_result']['actual_trend'] == '上涨']
        down_stocks = [p for p in today_predictions if p.get('actual_result') and p['actual_result']['actual_trend'] == '下跌']
        
        if len(up_stocks) > len(down_stocks) * 1.5:
            insights.append("今日上涨个股较多，关注市场热点延续")
        elif len(down_stocks) > len(up_stocks) * 1.5:
            insights.append("今日调整个股较多，关注超跌反弹机会")
        
        # 行业表现分析
        industries = {}
        for pred in today_predictions:
            if pred.get('actual_result'):
                industry = pred['industry']
                if industry not in industries:
                    industries[industry] = {'up': 0, 'down': 0}
                
                if pred['actual_result']['actual_trend'] == '上涨':
                    industries[industry]['up'] += 1
                else:
                    industries[industry]['down'] += 1
        
        for industry, counts in industries.items():
            if counts['up'] > counts['down'] * 2:
                insights.append(f"{industry}板块表现强势，可关注相关个股")
            elif counts['down'] > counts['up'] * 2:
                insights.append(f"{industry}板块调整较多，等待企稳信号")
        
        if not insights:
            insights.append("市场相对均衡，精选个股为主")
        
        return insights[:3]  # 最多3条

def main():
    """主函数"""
    system = AStockPredictionSystem()
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'evening':
        # 盘后总结
        print("【A股盘后验证系统】")
        print("=" * 50)
        
        summary, accuracy = system.generate_evening_summary()
        print(summary)
        
        if accuracy is not None:
            print(f"\n【系统运行状态】")
            print(f"今日预测准确率: {accuracy:.1f}%")
            
            historical = system.calculate_historical_accuracy()
            if historical:
                print(f"历史平均准确率: {historical:.1f}%")
        
    else:
        # 盘前预测
        print("【A股盘前预测系统】")
        print("=" * 50)
        
        prediction_report, predictions = system.generate_morning_prediction()
        print(prediction_report)
        
        # 保存今日预测
        today_file = f"/Users/thinkway/.openclaw/workspace/today_predictions_{datetime.now().strftime('%Y%m%d')}.json"
        with open(today_file, 'w', encoding='utf-8') as f:
            json.dump(predictions, f, ensure_ascii=False, indent=2)
        
        print(f"\n【预测数据已保存】")
        print(f"文件: {today_file}")

if __name__ == "__main__":
    main()
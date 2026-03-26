#!/usr/bin/env python3
"""
优化版预测系统集成
将新的预测算法集成到现有框架中
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# 导入优化版预测器
sys.path.append('refactored')
from optimized_predictor import OptimizedPredictor, OptimizedPrediction

class EnhancedStockAnalyzer:
    """增强版股票分析器"""
    
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.predictor = OptimizedPredictor()
        self.data_dir = self.base_dir / "data"
        self.reports_dir = self.base_dir / "reports"
        
    def analyze_stock(self, stock_data: dict, analysis_type: str = "evening") -> dict:
        """分析单只股票"""
        
        # 使用优化版预测器
        prediction = self.predictor.predict(stock_data)
        
        # 转换为标准格式
        result = {
            "stock": {
                "name": prediction.name,
                "symbol": prediction.symbol,
                "sector": prediction.sector,
                "weight": 0.5
            },
            "current_price": stock_data.get("current_price", 0),
            "change_percent": stock_data.get("change_percent", 0),
            "technical_score": prediction.technical_factors.get("rsi", 0),
            "fundamental_score": prediction.fundamental_factors.get("pe_ratio", 0),
            "sentiment_score": 5.0,
            "sector_score": 5.0,
            "final_score": prediction.score,
            "signal": prediction.signal,
            "confidence": prediction.confidence,
            "reasons": prediction.reasoning,
            "prediction_time": datetime.now().isoformat(),
            "data_provenance": "optimized_predictor"
        }
        
        return result
    
    def analyze_batch(self, stock_list: list, analysis_type: str = "evening") -> list:
        """批量分析股票"""
        
        results = []
        for stock_data in stock_list:
            try:
                result = self.analyze_stock(stock_data, analysis_type)
                results.append(result)
            except Exception as e:
                print(f"分析 {stock_data.get('name', '未知')} 失败: {e}")
                continue
        
        return results
    
    def save_results(self, results: list, analysis_type: str):
        """保存分析结果"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 保存预测结果
        prediction_file = self.data_dir / f"predictions_{analysis_type}_{timestamp}.json"
        with open(prediction_file, "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "analysis_type": analysis_type,
                "predictions": results,
                "prediction_count": len(results),
                "model_version": "optimized_v1.0"
            }, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 预测结果已保存: {prediction_file}")
        
        # 生成报告
        self.generate_report(results, analysis_type, timestamp)
        
        return prediction_file
    
    def generate_report(self, results: list, analysis_type: str, timestamp: str):
        """生成分析报告"""
        
        report_file = self.reports_dir / f"optimized_report_{analysis_type}_{timestamp}.txt"
        
        # 分类统计
        buy_signals = [r for r in results if "买入" in r["signal"]]
        sell_signals = [r for r in results if "卖出" in r["signal"]]
        hold_signals = [r for r in results if "持有" in r["signal"]]
        
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(f"【优化版A股{analysis_type}分析报告】\n")
            f.write("=" * 60 + "\n")
            f.write(f"报告时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"分析股票数: {len(results)}\n")
            f.write(f"模型版本: 优化版v1.0\n")
            f.write("=" * 60 + "\n\n")
            
            # 信号统计
            f.write("【信号分布】\n")
            f.write(f"买入信号: {len(buy_signals)}只\n")
            f.write(f"卖出信号: {len(sell_signals)}只\n")
            f.write(f"持有信号: {len(hold_signals)}只\n")
            f.write(f"平均信心度: {sum(r['confidence'] for r in results) / len(results):.1f}%\n\n")
            
            # 详细分析
            if buy_signals:
                f.write("【买入推荐】\n")
                for stock in buy_signals[:3]:
                    f.write(f"• {stock['stock']['name']} ({stock['stock']['symbol']})\n")
                    f.write(f"  评分: {stock['final_score']:.1f}/10 | 信心度: {stock['confidence']}%\n")
                    f.write(f"  理由: {', '.join(stock['reasons'])}\n\n")
            
            if sell_signals:
                f.write("【卖出建议】\n")
                for stock in sell_signals[:3]:
                    f.write(f"• {stock['stock']['name']} ({stock['stock']['symbol']})\n")
                    f.write(f"  评分: {stock['final_score']:.1f}/10 | 信心度: {stock['confidence']}%\n")
                    f.write(f"  理由: {', '.join(stock['reasons'])}\n\n")
            
            f.write("⚠️ 风险提示: 以上分析仅供参考，不构成投资建议\n")
        
        print(f"✅ 分析报告已生成: {report_file}")
        return report_file

# 测试函数
def test_enhanced_analyzer():
    """测试增强版分析器"""
    
    print("🧪 测试增强版股票分析器")
    print("-" * 40)
    
    # 测试数据
    test_stocks = [
        {
            "symbol": "000858", "name": "五粮液", "sector": "白酒",
            "current_price": 100.9, "change_percent": 0.67,
            "rsi": 52, "macd": 0.1, "ma_position": 1.01, "volume_ratio": 1.1,
            "pe_ratio": 25, "pb_ratio": 3.5, "roe": 0.18, "growth_rate": 0.12,
            "market_heat": 5, "retail_sentiment": "乐观", "volatility": 0.025,
            "beta": 1.1, "debt_ratio": 0.3, "dividend_yield": 2.0
        },
        {
            "symbol": "600519", "name": "贵州茅台", "sector": "白酒",
            "current_price": 1445.0, "change_percent": -0.54,
            "rsi": 45, "macd": -0.2, "ma_position": 0.97, "volume_ratio": 0.8,
            "pe_ratio": 30, "pb_ratio": 8.0, "roe": 0.25, "growth_rate": 0.15,
            "market_heat": 4, "retail_sentiment": "谨慎", "volatility": 0.028,
            "beta": 0.9, "debt_ratio": 0.2, "dividend_yield": 1.5
        }
    ]
    
    # 创建分析器
    analyzer = EnhancedStockAnalyzer("/Users/thinkway/.openclaw/workspace/stock_system")
    
    # 执行分析
    results = analyzer.analyze_batch(test_stocks, "evening")
    
    # 保存结果
    if results:
        analyzer.save_results(results, "evening")
        
        print(f"✅ 分析完成! 共分析 {len(results)} 只股票")
        print("\n📊 分析摘要:")
        
        for result in results:
            print(f"• {result['stock']['name']}: {result['signal']} (评分: {result['final_score']:.1f}, 信心度: {result['confidence']}%)")
    
    return results

if __name__ == "__main__":
    test_enhanced_analyzer()
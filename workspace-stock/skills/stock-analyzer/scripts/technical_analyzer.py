#!/usr/bin/env python3
"""
技术分析模块
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os

class TechnicalAnalyzer:
    """技术分析器"""
    
    def __init__(self, config):
        self.config = config
        self.indicators = {}
        self._init_indicators()
    
    def _init_indicators(self):
        """初始化指标配置"""
        self.indicator_config = self.config.get('technical_indicators', {})
    
    def calculate_indicators(self, data, indicator_list):
        """计算技术指标"""
        results = {}
        
        for indicator in indicator_list:
            indicator = indicator.lower().strip()
            
            if indicator == 'ma':
                results['ma'] = self.calculate_moving_averages(data)
            elif indicator == 'ema':
                results['ema'] = self.calculate_exponential_moving_averages(data)
            elif indicator == 'rsi':
                results['rsi'] = self.calculate_rsi(data)
            elif indicator == 'macf':
                results['macf'] = self.calculate_macd(data)
            elif indicator == 'bollinger':
                results['bollinger'] = self.calculate_bollinger_bands(data)
            elif indicator == 'kdj':
                results['kdj'] = self.calculate_kdj(data)
            elif indicator == 'williams':
                results['williams'] = self.calculate_williams_r(data)
            elif indicator == 'volume':
                results['volume'] = self.calculate_volume_indicators(data)
        
        return results
    
    def calculate_moving_averages(self, data):
        """计算移动平均线"""
        config = self.indicator_config.get('ma', {})
        periods = config.get('periods', [5, 10, 20, 50, 200])
        
        mas = {}
        close_prices = data['Close']
        
        for period in periods:
            ma = close_prices.rolling(window=period).mean()
            mas[f'MA{period}'] = ma
        
        # 获取最新值
        latest_values = {}
        for name, ma in mas.items():
            latest_values[name] = float(ma.iloc[-1]) if not ma.empty and not pd.isna(ma.iloc[-1]) else None
        
        return {
            'data': mas,
            'latest': latest_values,
            'analysis': self._analyze_ma_signals(data, mas)
        }
    
    def calculate_exponential_moving_averages(self, data):
        """计算指数移动平均线"""
        config = self.indicator_config.get('ema', {})
        periods = config.get('periods', [12, 26])
        
        emas = {}
        close_prices = data['Close']
        
        for period in periods:
            ema = close_prices.ewm(span=period).mean()
            emas[f'EMA{period}'] = ema
        
        # 获取最新值
        latest_values = {}
        for name, ema in emas.items():
            latest_values[name] = float(ema.iloc[-1]) if not ema.empty and not pd.isna(ema.iloc[-1]) else None
        
        return {
            'data': emas,
            'latest': latest_values,
            'analysis': self._analyze_ema_signals(data, emas)
        }
    
    def calculate_rsi(self, data, period=None):
        """计算RSI指标"""
        config = self.indicator_config.get('rsi', {})
        period = period or config.get('period', 14)
        overbought = config.get('overbought', 70)
        oversold = config.get('oversold', 30)
        
        close_prices = data['Close']
        
        # 计算价格变化
        delta = close_prices.diff()
        
        # 分离上涨和下跌
        gains = delta.where(delta > 0, 0)
        losses = -delta.where(delta < 0, 0)
        
        # 计算平均收益和损失
        avg_gains = gains.rolling(window=period).mean()
        avg_losses = losses.rolling(window=period).mean()
        
        # 计算RSI
        rs = avg_gains / avg_losses
        rsi = 100 - (100 / (1 + rs))
        
        # 获取最新值
        latest_rsi = float(rsi.iloc[-1]) if not rsi.empty and not pd.isna(rsi.iloc[-1]) else None
        
        # 分析信号
        signal = None
        if latest_rsi is not None:
            if latest_rsi > overbought:
                signal = 'overbought'
            elif latest_rsi < oversold:
                signal = 'oversold'
            else:
                signal = 'neutral'
        
        return {
            'data': {'RSI': rsi},
            'latest': {'RSI': latest_rsi},
            'signal': signal,
            'analysis': f"RSI: {latest_rsi:.2f} ({signal})" if latest_rsi else "RSI: 无数据"
        }
    
    def calculate_macd(self, data):
        """计算MACD指标"""
        config = self.indicator_config.get('macf', {})
        fast_period = config.get('fast', 12)
        slow_period = config.get('slow', 26)
        signal_period = config.get('signal', 9)
        
        close_prices = data['Close']
        
        # 计算EMA
        ema_fast = close_prices.ewm(span=fast_period).mean()
        ema_slow = close_prices.ewm(span=slow_period).mean()
        
        # 计算MACD线
        macd_line = ema_fast - ema_slow
        
        # 计算信号线
        signal_line = macd_line.ewm(span=signal_period).mean()
        
        # 计算柱状图
        histogram = macd_line - signal_line
        
        # 获取最新值
        latest_macd = float(macd_line.iloc[-1]) if not macd_line.empty and not pd.isna(macd_line.iloc[-1]) else None
        latest_signal = float(signal_line.iloc[-1]) if not signal_line.empty and not pd.isna(signal_line.iloc[-1]) else None
        latest_histogram = float(histogram.iloc[-1]) if not histogram.empty and not pd.isna(histogram.iloc[-1]) else None
        
        # 分析信号
        signal = None
        if latest_macd is not None and latest_signal is not None:
            if latest_macd > latest_signal and latest_histogram > 0:
                signal = 'bullish'
            elif latest_macd < latest_signal and latest_histogram < 0:
                signal = 'bearish'
            else:
                signal = 'neutral'
        
        return {
            'data': {
                'MACD': macd_line,
                'Signal': signal_line,
                'Histogram': histogram
            },
            'latest': {
                'MACD': latest_macd,
                'Signal': latest_signal,
                'Histogram': latest_histogram
            },
            'signal': signal,
            'analysis': f"MACD: {latest_macd:.4f}, Signal: {latest_signal:.4f} ({signal})" if latest_macd else "MACD: 无数据"
        }
    
    def calculate_bollinger_bands(self, data):
        """计算布林带"""
        config = self.indicator_config.get('bollinger', {})
        period = config.get('period', 20)
        std_dev = config.get('std_dev', 2)
        
        close_prices = data['Close']
        
        # 计算中轨（移动平均线）
        middle_band = close_prices.rolling(window=period).mean()
        
        # 计算标准差
        rolling_std = close_prices.rolling(window=period).std()
        
        # 计算上下轨
        upper_band = middle_band + (rolling_std * std_dev)
        lower_band = middle_band - (rolling_std * std_dev)
        
        # 获取最新值
        latest_middle = float(middle_band.iloc[-1]) if not middle_band.empty and not pd.isna(middle_band.iloc[-1]) else None
        latest_upper = float(upper_band.iloc[-1]) if not upper_band.empty and not pd.isna(upper_band.iloc[-1]) else None
        latest_lower = float(lower_band.iloc[-1]) if not lower_band.empty and not pd.isna(lower_band.iloc[-1]) else None
        latest_price = float(close_prices.iloc[-1])
        
        # 分析信号
        signal = None
        if latest_price is not None and latest_upper is not None and latest_lower is not None:
            if latest_price > latest_upper:
                signal = 'above_upper'
            elif latest_price < latest_lower:
                signal = 'below_lower'
            else:
                signal = 'within_bands'
        
        return {
            'data': {
                'Upper': upper_band,
                'Middle': middle_band,
                'Lower': lower_band
            },
            'latest': {
                'Upper': latest_upper,
                'Middle': latest_middle,
                'Lower': latest_lower,
                'Price': latest_price
            },
            'signal': signal,
            'analysis': f"布林带: 价格{latest_price:.2f} ({signal})" if latest_price else "布林带: 无数据"
        }
    
    def calculate_kdj(self, data):
        """计算KDJ指标"""
        config = self.indicator_config.get('kdj', {})
        k_period = config.get('k_period', 9)
        d_period = config.get('d_period', 3)
        j_period = config.get('j_period', 3)
        
        high_prices = data['High']
        low_prices = data['Low']
        close_prices = data['Close']
        
        # 计算RSV
        lowest_low = low_prices.rolling(window=k_period).min()
        highest_high = high_prices.rolling(window=k_period).max()
        
        rsv = 100 * (close_prices - lowest_low) / (highest_high - lowest_low)
        
        # 计算K值
        k_value = rsv.ewm(alpha=1/3).mean()
        
        # 计算D值
        d_value = k_value.ewm(alpha=1/3).mean()
        
        # 计算J值
        j_value = 3 * k_value - 2 * d_value
        
        # 获取最新值
        latest_k = float(k_value.iloc[-1]) if not k_value.empty and not pd.isna(k_value.iloc[-1]) else None
        latest_d = float(d_value.iloc[-1]) if not d_value.empty and not pd.isna(d_value.iloc[-1]) else None
        latest_j = float(j_value.iloc[-1]) if not j_value.empty and not pd.isna(j_value.iloc[-1]) else None
        
        # 分析信号
        signal = None
        if latest_k is not None and latest_d is not None:
            if latest_k > 80 and latest_d > 80:
                signal = 'overbought'
            elif latest_k < 20 and latest_d < 20:
                signal = 'oversold'
            elif latest_k > latest_d:
                signal = 'bullish'
            else:
                signal = 'bearish'
        
        return {
            'data': {
                'K': k_value,
                'D': d_value,
                'J': j_value
            },
            'latest': {
                'K': latest_k,
                'D': latest_d,
                'J': latest_j
            },
            'signal': signal,
            'analysis': f"KDJ: K{latest_k:.2f} D{latest_d:.2f} J{latest_j:.2f} ({signal})" if latest_k else "KDJ: 无数据"
        }
    
    def calculate_williams_r(self, data):
        """计算威廉指标"""
        high_prices = data['High']
        low_prices = data['Low']
        close_prices = data['Close']
        
        # 计算14日最高和最低
        highest_high = high_prices.rolling(window=14).max()
        lowest_low = low_prices.rolling(window=14).min()
        
        # 计算威廉指标
        williams_r = -100 * (highest_high - close_prices) / (highest_high - lowest_low)
        
        # 获取最新值
        latest_williams = float(williams_r.iloc[-1]) if not williams_r.empty and not pd.isna(williams_r.iloc[-1]) else None
        
        # 分析信号
        signal = None
        if latest_williams is not None:
            if latest_williams > -20:
                signal = 'overbought'
            elif latest_williams < -80:
                signal = 'oversold'
            else:
                signal = 'neutral'
        
        return {
            'data': {'WilliamsR': williams_r},
            'latest': {'WilliamsR': latest_williams},
            'signal': signal,
            'analysis': f"威廉指标: {latest_williams:.2f} ({signal})" if latest_williams else "威廉指标: 无数据"
        }
    
    def calculate_volume_indicators(self, data):
        """计算成交量指标"""
        volume = data['Volume']
        close_prices = data['Close']
        
        # 计算成交量移动平均
        volume_ma5 = volume.rolling(window=5).mean()
        volume_ma10 = volume.rolling(window=10).mean()
        
        # 计算成交量比率
        volume_ratio = volume / volume_ma10
        
        # 获取最新值
        latest_volume = int(volume.iloc[-1]) if not volume.empty and not pd.isna(volume.iloc[-1]) else None
        latest_volume_ma5 = float(volume_ma5.iloc[-1]) if not volume_ma5.empty and not pd.isna(volume_ma5.iloc[-1]) else None
        latest_volume_ma10 = float(volume_ma10.iloc[-1]) if not volume_ma10.empty and not pd.isna(volume_ma10.iloc[-1]) else None
        latest_volume_ratio = float(volume_ratio.iloc[-1]) if not volume_ratio.empty and not pd.isna(volume_ratio.iloc[-1]) else None
        
        # 分析信号
        signal = None
        if latest_volume_ratio is not None:
            if latest_volume_ratio > 2.0:
                signal = 'high_volume'
            elif latest_volume_ratio < 0.5:
                signal = 'low_volume'
            else:
                signal = 'normal_volume'
        
        return {
            'data': {
                'Volume': volume,
                'Volume_MA5': volume_ma5,
                'Volume_MA10': volume_ma10,
                'Volume_Ratio': volume_ratio
            },
            'latest': {
                'Volume': latest_volume,
                'Volume_MA5': latest_volume_ma5,
                'Volume_MA10': latest_volume_ma10,
                'Volume_Ratio': latest_volume_ratio
            },
            'signal': signal,
            'analysis': f"成交量: {latest_volume:,} (比率: {latest_volume_ratio:.2f}, {signal})" if latest_volume else "成交量: 无数据"
        }
    
    def _analyze_ma_signals(self, data, mas):
        """分析移动平均线信号"""
        if not mas:
            return "无MA数据"
        
        close_price = data['Close'].iloc[-1]
        ma_20 = mas.get('MA20')
        ma_50 = mas.get('MA50')
        ma_200 = mas.get('MA200')
        
        signals = []
        
        if ma_20 is not None and close_price > ma_20.iloc[-1]:
            signals.append("价格在MA20之上")
        
        if ma_50 is not None and ma_20 is not None and ma_20.iloc[-1] > ma_50.iloc[-1]:
            signals.append("MA20在MA50之上")
        
        if ma_200 is not None and ma_50 is not None and ma_50.iloc[-1] > ma_200.iloc[-1]:
            signals.append("MA50在MA200之上")
        
        return "; ".join(signals) if signals else "无明显MA信号"
    
    def _analyze_ema_signals(self, data, emas):
        """分析指数移动平均线信号"""
        if not emas:
            return "无EMA数据"
        
        ema_12 = emas.get('EMA12')
        ema_26 = emas.get('EMA26')
        
        if ema_12 is not None and ema_26 is not None:
            if ema_12.iloc[-1] > ema_26.iloc[-1]:
                return "EMA12在EMA26之上 (看涨)"
            else:
                return "EMA12在EMA26之下 (看跌)"
        
        return "无EMA信号"
    
    def create_chart(self, data, indicators, output_path):
        """创建技术指标图表"""
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(4, 1, figsize=(12, 16), sharex=True)
        
        # 主图 - 价格和移动平均线
        ax1 = axes[0]
        ax1.plot(data.index, data['Close'], label='收盘价', linewidth=2)
        
        if 'ma' in indicators:
            mas = indicators['ma']['data']
            for name, ma in mas.items():
                ax1.plot(data.index, ma, label=name, alpha=0.7)
        
        if 'bollinger' in indicators:
            bb_data = indicators['bollinger']['data']
            ax1.plot(data.index, bb_data['Upper'], label='布林带上轨', alpha=0.5, linestyle='--')
            ax1.plot(data.index, bb_data['Middle'], label='布林带中轨', alpha=0.5)
            ax1.plot(data.index, bb_data['Lower'], label='布林带下轨', alpha=0.5, linestyle='--')
            ax1.fill_between(data.index, bb_data['Upper'], bb_data['Lower'], alpha=0.1)
        
        ax1.set_title('价格走势和技术指标')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # RSI图
        ax2 = axes[1]
        if 'rsi' in indicators:
            rsi_data = indicators['rsi']['data']['RSI']
            ax2.plot(data.index, rsi_data, label='RSI', color='purple')
            ax2.axhline(y=70, color='r', linestyle='--', alpha=0.7, label='超买线')
            ax2.axhline(y=30, color='g', linestyle='--', alpha=0.7, label='超卖线')
            ax2.set_ylabel('RSI')
            ax2.legend()
            ax2.grid(True, alpha=0.3)
        
        # MACD图
        ax3 = axes[2]
        if 'macf' in indicators:
            macd_data = indicators['macf']['data']
            ax3.plot(data.index, macd_data['MACD'], label='MACD', color='blue')
            ax3.plot(data.index, macd_data['Signal'], label='Signal', color='red')
            ax3.bar(data.index, macd_data['Histogram'], label='Histogram', alpha=0.3, color='gray')
            ax3.axhline(y=0, color='black', linestyle='-', alpha=0.5)
            ax3.set_ylabel('MACD')
            ax3.legend()
            ax3.grid(True, alpha=0.3)
        
        # 成交量图
        ax4 = axes[3]
        if 'volume' in indicators:
            volume_data = indicators['volume']['data']
            ax4.bar(data.index, volume_data['Volume'], label='成交量', alpha=0.7, color='orange')
            ax4.plot(data.index, volume_data['Volume_MA10'], label='成交量MA10', color='red')
            ax4.set_ylabel('成交量')
            ax4.legend()
            ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return output_path
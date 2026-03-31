#!/usr/bin/env python3
"""
信号生成器模块
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

class SignalGenerator:
    """交易信号生成器"""
    
    def __init__(self, config):
        self.config = config
        self.strategies = {}
        self._init_strategies()
    
    def _init_strategies(self):
        """初始化策略配置"""
        self.strategy_config = self.config.get('trading_strategies', {})
    
    def generate_signals(self, data, indicators, strategy='multi-indicator'):
        """生成交易信号"""
        strategy = strategy.lower()
        
        if strategy == 'golden_cross':
            return self._golden_cross_strategy(data, indicators)
        elif strategy == 'rsi_strategy':
            return self._rsi_strategy(data, indicators)
        elif strategy == 'macf_strategy':
            return self._macd_strategy(data, indicators)
        elif strategy == 'bollinger_strategy':
            return self._bollinger_strategy(data, indicators)
        elif strategy == 'multi_indicator':
            return self._multi_indicator_strategy(data, indicators)
        else:
            raise ValueError(f"不支持的策略: {strategy}")
    
    def _golden_cross_strategy(self, data, indicators):
        """金叉策略"""
        config = self.strategy_config.get('golden_cross', {})
        short_period = config.get('short_ma', 50)
        long_period = config.get('long_ma', 200)
        
        # 获取移动平均线数据
        if 'ma' not in indicators:
            return []
        
        mas = indicators['ma']['data']
        short_ma_key = f'MA{short_period}'
        long_ma_key = f'MA{long_period}'
        
        if short_ma_key not in mas or long_ma_key not in mas:
            return []
        
        short_ma = mas[short_ma_key]
        long_ma = mas[long_ma_key]
        
        signals = []
        
        # 遍历数据寻找交叉点
        for i in range(1, len(data)):
            current_date = data.index[i]
            
            # 检查金叉（短期均线上穿长期均线）
            if (short_ma.iloc[i-1] <= long_ma.iloc[i-1] and 
                short_ma.iloc[i] > long_ma.iloc[i]):
                
                signal = {
                    'date': current_date,
                    'type': 'buy',
                    'strategy': 'golden_cross',
                    'strength': 'strong',
                    'price': data['Close'].iloc[i],
                    'details': f"MA{short_period}上穿MA{long_period}"
                }
                signals.append(signal)
            
            # 检查死叉（短期均线下穿长期均线）
            elif (short_ma.iloc[i-1] >= long_ma.iloc[i-1] and 
                  short_ma.iloc[i] < long_ma.iloc[i]):
                
                signal = {
                    'date': current_date,
                    'type': 'sell',
                    'strategy': 'golden_cross',
                    'strength': 'strong',
                    'price': data['Close'].iloc[i],
                    'details': f"MA{short_period}下穿MA{long_period}"
                }
                signals.append(signal)
        
        return signals
    
    def _rsi_strategy(self, data, indicators):
        """RSI策略"""
        config = self.strategy_config.get('rsi_strategy', {})
        overbought = config.get('overbought', 70)
        oversold = config.get('oversold', 30)
        
        if 'rsi' not in indicators:
            return []
        
        rsi_data = indicators['rsi']['data']['RSI']
        
        signals = []
        
        for i in range(1, len(data)):
            current_date = data.index[i]
            current_rsi = rsi_data.iloc[i]
            prev_rsi = rsi_data.iloc[i-1]
            
            # RSI从超卖区域上穿
            if prev_rsi < oversold and current_rsi >= oversold:
                signal = {
                    'date': current_date,
                    'type': 'buy',
                    'strategy': 'rsi_strategy',
                    'strength': 'medium',
                    'price': data['Close'].iloc[i],
                    'details': f"RSI从超卖区域回升 ({current_rsi:.2f})"
                }
                signals.append(signal)
            
            # RSI从超买区域下穿
            elif prev_rsi > overbought and current_rsi <= overbought:
                signal = {
                    'date': current_date,
                    'type': 'sell',
                    'strategy': 'rsi_strategy',
                    'strength': 'medium',
                    'price': data['Close'].iloc[i],
                    'details': f"RSI从超买区域回落 ({current_rsi:.2f})"
                }
                signals.append(signal)
        
        return signals
    
    def _macd_strategy(self, data, indicators):
        """MACD策略"""
        if 'macf' not in indicators:
            return []
        
        macd_data = indicators['macf']['data']
        macd_line = macd_data['MACD']
        signal_line = macd_data['Signal']
        histogram = macd_data['Histogram']
        
        signals = []
        
        for i in range(1, len(data)):
            current_date = data.index[i]
            
            # MACD线上穿信号线
            if (macd_line.iloc[i-1] <= signal_line.iloc[i-1] and 
                macd_line.iloc[i] > signal_line.iloc[i]):
                
                signal = {
                    'date': current_date,
                    'type': 'buy',
                    'strategy': 'macf_strategy',
                    'strength': 'strong',
                    'price': data['Close'].iloc[i],
                    'details': f"MACD上穿信号线 (MACD: {macd_line.iloc[i]:.4f})"
                }
                signals.append(signal)
            
            # MACD线下穿信号线
            elif (macd_line.iloc[i-1] >= signal_line.iloc[i-1] and 
                  macd_line.iloc[i] < signal_line.iloc[i]):
                
                signal = {
                    'date': current_date,
                    'type': 'sell',
                    'strategy': 'macf_strategy',
                    'strength': 'strong',
                    'price': data['Close'].iloc[i],
                    'details': f"MACD下穿信号线 (MACD: {macd_line.iloc[i]:.4f})"
                }
                signals.append(signal)
        
        return signals
    
    def _bollinger_strategy(self, data, indicators):
        """布林带策略"""
        if 'bollinger' not in indicators:
            return []
        
        bb_data = indicators['bollinger']['data']
        upper_band = bb_data['Upper']
        middle_band = bb_data['Middle']
        lower_band = bb_data['Lower']
        
        close_prices = data['Close']
        
        signals = []
        
        for i in range(len(data)):
            current_date = data.index[i]
            current_price = close_prices.iloc[i]
            
            # 价格上穿布林带下轨
            if (i > 0 and close_prices.iloc[i-1] <= lower_band.iloc[i-1] and 
                current_price > lower_band.iloc[i]):
                
                signal = {
                    'date': current_date,
                    'type': 'buy',
                    'strategy': 'bollinger_strategy',
                    'strength': 'medium',
                    'price': current_price,
                    'details': f"价格从布林带下轨反弹 ({current_price:.2f})"
                }
                signals.append(signal)
            
            # 价格下穿布林带上轨
            elif (i > 0 and close_prices.iloc[i-1] >= upper_band.iloc[i-1] and 
                  current_price < upper_band.iloc[i]):
                
                signal = {
                    'date': current_date,
                    'type': 'sell',
                    'strategy': 'bollinger_strategy',
                    'strength': 'medium',
                    'price': current_price,
                    'details': f"价格从布林带上轨回落 ({current_price:.2f})"
                }
                signals.append(signal)
        
        return signals
    
    def _multi_indicator_strategy(self, data, indicators):
        """多指标共振策略"""
        signals = []
        
        # 获取各个策略的信号
        ma_signals = self._golden_cross_strategy(data, indicators)
        rsi_signals = self._rsi_strategy(data, indicators)
        macd_signals = self._macd_strategy(data, indicators)
        bollinger_signals = self._bollinger_strategy(data, indicators)
        
        # 合并信号并评估强度
        all_signals = {
            'ma': ma_signals,
            'rsi': rsi_signals,
            'macd': macd_signals,
            'bollinger': bollinger_signals
        }
        
        # 按日期分组信号
        signals_by_date = {}
        
        for strategy_name, strategy_signals in all_signals.items():
            for signal in strategy_signals:
                date = signal['date']
                if date not in signals_by_date:
                    signals_by_date[date] = []
                signals_by_date[date].append({
                    'strategy': strategy_name,
                    'type': signal['type'],
                    'strength': signal['strength']
                })
        
        # 分析共振信号
        for date, day_signals in signals_by_date.items():
            buy_signals = [s for s in day_signals if s['type'] == 'buy']
            sell_signals = [s for s in day_signals if s['type'] == 'sell']
            
            # 买入信号共振
            if len(buy_signals) >= 2:
                strength = self._calculate_combined_strength(buy_signals)
                price = data.loc[date, 'Close'] if date in data.index else None
                
                signal = {
                    'date': date,
                    'type': 'buy',
                    'strategy': 'multi_indicator',
                    'strength': strength,
                    'price': price,
                    'details': f"多指标买入共振: {', '.join([s['strategy'] for s in buy_signals])}"
                }
                signals.append(signal)
            
            # 卖出信号共振
            elif len(sell_signals) >= 2:
                strength = self._calculate_combined_strength(sell_signals)
                price = data.loc[date, 'Close'] if date in data.index else None
                
                signal = {
                    'date': date,
                    'type': 'sell',
                    'strategy': 'multi_indicator',
                    'strength': strength,
                    'price': price,
                    'details': f"多指标卖出共振: {', '.join([s['strategy'] for s in sell_signals])}"
                }
                signals.append(signal)
        
        return signals
    
    def _calculate_combined_strength(self, signals):
        """计算组合信号强度"""
        if not signals:
            return 'weak'
        
        # 基于信号数量和强度计算组合强度
        signal_count = len(signals)
        strong_count = sum(1 for s in signals if s['strength'] == 'strong')
        medium_count = sum(1 for s in signals if s['strength'] == 'medium')
        
        if signal_count >= 3 or strong_count >= 2:
            return 'strong'
        elif signal_count >= 2 and (strong_count >= 1 or medium_count >= 2):
            return 'medium'
        else:
            return 'weak'
    
    def backtest_strategy(self, data, indicators, strategy, initial_capital=100000):
        """回测策略"""
        signals = self.generate_signals(data, indicators, strategy)
        
        if not signals:
            return {
                'total_return': 0,
                'annual_return': 0,
                'win_rate': 0,
                'trade_count': 0,
                'max_drawdown': 0,
                'sharpe_ratio': 0,
                'signals': signals
            }
        
        # 模拟交易
        capital = initial_capital
        position = 0  # 持股数量
        trades = []
        portfolio_values = [initial_capital]
        
        for signal in signals:
            date = signal['date']
            signal_type = signal['type']
            price = signal['price']
            
            if signal_type == 'buy' and position == 0:
                # 买入信号
                position = int(capital / price)
                cost = position * price
                capital -= cost
                
                trades.append({
                    'date': date,
                    'type': 'buy',
                    'price': price,
                    'quantity': position,
                    'cost': cost
                })
            
            elif signal_type == 'sell' and position > 0:
                # 卖出信号
                revenue = position * price
                capital += revenue
                
                trades.append({
                    'date': date,
                    'type': 'sell',
                    'price': price,
                    'quantity': position,
                    'revenue': revenue,
                    'profit': revenue - trades[-1]['cost'] if trades else 0
                })
                
                position = 0
            
            # 计算组合价值
            portfolio_value = capital + (position * price if position > 0 else 0)
            portfolio_values.append(portfolio_value)
        
        # 计算回测指标
        final_value = portfolio_values[-1]
        total_return = (final_value - initial_capital) / initial_capital
        
        # 计算胜率
        profitable_trades = sum(1 for trade in trades if trade.get('profit', 0) > 0)
        total_completed_trades = len([t for t in trades if t['type'] == 'sell'])
        win_rate = profitable_trades / total_completed_trades if total_completed_trades > 0 else 0
        
        # 计算最大回撤
        peak = np.maximum.accumulate(portfolio_values)
        drawdown = (portfolio_values - peak) / peak
        max_drawdown = np.min(drawdown)
        
        # 计算年化收益率
        start_date = data.index[0]
        end_date = data.index[-1]
        years = (end_date - start_date).days / 365.25
        annual_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else 0
        
        # 计算夏普比率（简化计算）
        returns = np.diff(portfolio_values) / portfolio_values[:-1]
        if len(returns) > 1 and np.std(returns) > 0:
            sharpe_ratio = np.mean(returns) / np.std(returns) * np.sqrt(252)
        else:
            sharpe_ratio = 0
        
        return {
            'total_return': total_return,
            'annual_return': annual_return,
            'win_rate': win_rate,
            'trade_count': len(trades),
            'max_drawdown': max_drawdown,
            'sharpe_ratio': sharpe_ratio,
            'final_value': final_value,
            'trades': trades,
            'signals': signals
        }
    
    def get_latest_signals(self, data, indicators, strategy='multi-indicator', days=30):
        """获取最近的交易信号"""
        all_signals = self.generate_signals(data, indicators, strategy)
        
        # 过滤最近几天的信号
        cutoff_date = data.index[-1] - timedelta(days=days)
        recent_signals = [signal for signal in all_signals if signal['date'] >= cutoff_date]
        
        return recent_signals
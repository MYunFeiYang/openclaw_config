#!/usr/bin/env python3
"""
数据管理模块
"""

import pandas as pd
import yfinance as yf
import requests
import time
from datetime import datetime, timedelta
from abc import ABC, abstractmethod

class DataProvider(ABC):
    """数据提供者基类"""
    
    @abstractmethod
    def get_stock_data(self, symbol, period, **kwargs):
        """获取股票数据"""
        pass
    
    @abstractmethod
    def get_real_time_quote(self, symbol):
        """获取实时报价"""
        pass

class YahooFinanceProvider(DataProvider):
    """Yahoo Finance数据提供者"""
    
    def get_stock_data(self, symbol, period, **kwargs):
        """获取股票历史数据"""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period)
            
            # 重命名列以保持一致性
            data.columns = ['Open', 'High', 'Low', 'Close', 'Volume', 'Dividends', 'Stock_Splits']
            
            return data
        except Exception as e:
            raise Exception(f"Yahoo Finance获取数据失败: {e}")
    
    def get_real_time_quote(self, symbol):
        """获取实时报价"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            return {
                'symbol': symbol,
                'price': info.get('currentPrice', 0),
                'change': info.get('regularMarketChange', 0),
                'change_percent': info.get('regularMarketChangePercent', 0),
                'volume': info.get('volume', 0),
                'market_cap': info.get('marketCap', 0),
                'timestamp': datetime.now()
            }
        except Exception as e:
            raise Exception(f"Yahoo Finance获取实时报价失败: {e}")

class AlphaVantageProvider(DataProvider):
    """Alpha Vantage数据提供者"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
    
    def get_stock_data(self, symbol, period, **kwargs):
        """获取股票历史数据"""
        try:
            # Alpha Vantage使用函数调用次数限制，这里简化处理
            params = {
                'function': 'TIME_SERIES_DAILY',
                'symbol': symbol,
                'apikey': self.api_key,
                'outputsize': 'full'
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if 'Time Series (Daily)' not in data:
                raise Exception(f"Alpha Vantage返回错误: {data}")
            
            # 转换为DataFrame
            time_series = data['Time Series (Daily)']
            df_data = []
            
            for date, values in time_series.items():
                df_data.append({
                    'Date': pd.to_datetime(date),
                    'Open': float(values['1. open']),
                    'High': float(values['2. high']),
                    'Low': float(values['3. low']),
                    'Close': float(values['4. close']),
                    'Volume': int(values['5. volume'])
                })
            
            df = pd.DataFrame(df_data)
            df.set_index('Date', inplace=True)
            df.sort_index(inplace=True)
            
            # 根据period过滤数据
            if period == '1d':
                days = 1
            elif period == '5d':
                days = 5
            elif period == '1mo':
                days = 30
            elif period == '3mo':
                days = 90
            elif period == '6mo':
                days = 180
            elif period == '1y':
                days = 365
            elif period == '2y':
                days = 730
            else:
                days = 365
            
            cutoff_date = datetime.now() - timedelta(days=days)
            df = df[df.index >= cutoff_date]
            
            return df
            
        except Exception as e:
            raise Exception(f"Alpha Vantage获取数据失败: {e}")
    
    def get_real_time_quote(self, symbol):
        """获取实时报价"""
        try:
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if 'Global Quote' not in data:
                raise Exception(f"Alpha Vantage返回错误: {data}")
            
            quote = data['Global Quote']
            
            return {
                'symbol': symbol,
                'price': float(quote['05. price']),
                'change': float(quote['09. change']),
                'change_percent': float(quote['10. change percent'].rstrip('%')),
                'volume': int(quote['06. volume']),
                'timestamp': datetime.now()
            }
            
        except Exception as e:
            raise Exception(f"Alpha Vantage获取实时报价失败: {e}")

class SinaFinanceProvider(DataProvider):
    """新浪财经数据提供者"""
    
    def __init__(self):
        self.base_url = "https://hq.sinajs.cn"
    
    def get_stock_data(self, symbol, period, **kwargs):
        """获取股票历史数据"""
        # 新浪财经主要提供实时数据，历史数据获取较复杂
        # 这里简化处理，返回模拟数据
        raise NotImplementedError("新浪财经历史数据获取需要额外实现")
    
    def get_real_time_quote(self, symbol):
        """获取实时报价"""
        try:
            # 需要将股票代码转换为新浪财经格式
            if symbol.endswith('.SS'):
                sina_symbol = f"sh{symbol[:-3]}"
            elif symbol.endswith('.SZ'):
                sina_symbol = f"sz{symbol[:-3]}"
            else:
                # 默认为美股，需要特殊处理
                sina_symbol = symbol
            
            params = {
                'list': sina_symbol
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            # 解析新浪财经数据格式
            data_str = response.text
            if not data_str or '=""' in data_str:
                raise Exception(f"未找到股票数据: {symbol}")
            
            # 提取数据
            data_parts = data_str.split('"')[1].split(',')
            
            if len(data_parts) < 10:
                raise Exception(f"数据格式错误: {data_str}")
            
            return {
                'symbol': symbol,
                'price': float(data_parts[3]),  # 当前价格
                'change': float(data_parts[3]) - float(data_parts[2]),  # 涨跌额
                'change_percent': ((float(data_parts[3]) - float(data_parts[2])) / float(data_parts[2])) * 100,
                'volume': int(data_parts[8]),  # 成交量
                'timestamp': datetime.now()
            }
            
        except Exception as e:
            raise Exception(f"新浪财经获取实时报价失败: {e}")

class DataManager:
    """数据管理器"""
    
    def __init__(self, config):
        self.config = config
        self.providers = {}
        self._init_providers()
    
    def _init_providers(self):
        """初始化数据提供者"""
        enabled_sources = self.config.get_enabled_data_sources()
        
        for source in enabled_sources:
            name = source['name']
            source_config = source['config']
            
            if name == 'yahoo_finance':
                self.providers[name] = YahooFinanceProvider()
            elif name == 'alpha_vantage':
                api_key = source_config.get('api_key', '')
                if api_key:
                    self.providers[name] = AlphaVantageProvider(api_key)
            elif name == 'sina_finance':
                self.providers[name] = SinaFinanceProvider()
    
    def get_stock_data(self, symbol, period='1y', **kwargs):
        """获取股票数据"""
        errors = []
        
        # 按优先级尝试各个数据源
        for source_name in self.providers:
            try:
                provider = self.providers[source_name]
                data = provider.get_stock_data(symbol, period, **kwargs)
                
                # 验证数据
                if self._validate_data(data):
                    return data
                else:
                    errors.append(f"{source_name}: 数据验证失败")
                    
            except Exception as e:
                errors.append(f"{source_name}: {str(e)}")
                continue
        
        # 所有数据源都失败
        error_msg = f"无法获取 {symbol} 的数据. 错误: {'; '.join(errors)}"
        raise Exception(error_msg)
    
    def get_real_time_quote(self, symbol):
        """获取实时报价"""
        errors = []
        
        for source_name in self.providers:
            try:
                provider = self.providers[source_name]
                quote = provider.get_real_time_quote(symbol)
                
                if self._validate_quote(quote):
                    return quote
                else:
                    errors.append(f"{source_name}: 报价验证失败")
                    
            except Exception as e:
                errors.append(f"{source_name}: {str(e)}")
                continue
        
        error_msg = f"无法获取 {symbol} 的实时报价. 错误: {'; '.join(errors)}"
        raise Exception(error_msg)
    
    def get_multiple_quotes(self, symbols):
        """获取多个股票的实时报价"""
        quotes = {}
        
        for symbol in symbols:
            try:
                quote = self.get_real_time_quote(symbol)
                quotes[symbol] = quote
            except Exception as e:
                quotes[symbol] = {'error': str(e)}
        
        return quotes
    
    def _validate_data(self, data):
        """验证数据完整性"""
        if data is None or data.empty:
            return False
        
        required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
        
        for col in required_columns:
            if col not in data.columns:
                return False
        
        # 检查数据量
        if len(data) < 10:
            return False
        
        # 检查是否有无效值
        if data[required_columns].isnull().any().any():
            return False
        
        return True
    
    def _validate_quote(self, quote):
        """验证报价数据"""
        if not isinstance(quote, dict):
            return False
        
        required_fields = ['symbol', 'price', 'change', 'change_percent', 'volume']
        
        for field in required_fields:
            if field not in quote:
                return False
        
        # 检查价格是否为有效数字
        if not isinstance(quote['price'], (int, float)) or quote['price'] <= 0:
            return False
        
        return True
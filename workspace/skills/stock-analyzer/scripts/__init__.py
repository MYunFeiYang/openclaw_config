#!/usr/bin/env python3
"""
股票分析器模块初始化文件
"""

__version__ = "1.0.0"
__author__ = "Stock Analyzer Team"
__description__ = "A comprehensive stock analysis tool with technical indicators, signal generation, and reporting capabilities."

from .config import Config
from .data_manager import DataManager, YahooFinanceProvider, AlphaVantageProvider, SinaFinanceProvider
from .technical_analyzer import TechnicalAnalyzer
from .signal_generator import SignalGenerator
from .report_generator import ReportGenerator
from .scheduler import Scheduler

__all__ = [
    'Config',
    'DataManager',
    'YahooFinanceProvider',
    'AlphaVantageProvider',
    'SinaFinanceProvider',
    'TechnicalAnalyzer',
    'SignalGenerator',
    'ReportGenerator',
    'Scheduler'
]
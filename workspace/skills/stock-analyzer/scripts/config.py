#!/usr/bin/env python3
"""
配置管理模块
"""

import json
import os
from pathlib import Path

class Config:
    """配置管理器"""
    
    DEFAULT_CONFIG = {
        "data_sources": {
            "yahoo_finance": {
                "enabled": True,
                "priority": 1
            },
            "alpha_vantage": {
                "enabled": True,
                "priority": 2,
                "api_key": ""
            },
            "sina_finance": {
                "enabled": True,
                "priority": 3
            }
        },
        "technical_indicators": {
            "ma": {
                "periods": [5, 10, 20, 50, 200],
                "type": "SMA"
            },
            "ema": {
                "periods": [12, 26]
            },
            "rsi": {
                "period": 14,
                "overbought": 70,
                "oversold": 30
            },
            "macf": {
                "fast": 12,
                "slow": 26,
                "signal": 9
            },
            "bollinger": {
                "period": 20,
                "std_dev": 2
            },
            "kdj": {
                "k_period": 9,
                "d_period": 3,
                "j_period": 3
            }
        },
        "trading_strategies": {
            "golden_cross": {
                "short_ma": 50,
                "long_ma": 200,
                "description": "金叉策略"
            },
            "rsi_strategy": {
                "overbought": 70,
                "oversold": 30,
                "description": "RSI超买超卖策略"
            },
            "macf_strategy": {
                "description": "MACD策略"
            },
            "bollinger_strategy": {
                "description": "布林带突破策略"
            },
            "multi_indicator": {
                "indicators": ["ma", "rsi", "macf"],
                "description": "多指标共振策略"
            }
        },
        "report_settings": {
            "default_format": "pdf",
            "include_charts": True,
            "chart_style": "seaborn",
            "template_dir": "templates"
        },
        "scheduler": {
            "timezone": "Asia/Shanghai",
            "default_interval": "1d"
        },
        "notifications": {
            "email": {
                "enabled": False,
                "smtp_server": "",
                "smtp_port": 587,
                "username": "",
                "password": "",
                "from_email": "",
                "to_emails": []
            }
        },
        "data_storage": {
            "data_dir": "data",
            "cache_dir": "cache",
            "reports_dir": "reports",
            "charts_dir": "charts"
        }
    }
    
    def __init__(self, config_path=None):
        """初始化配置"""
        self.config_path = config_path or os.path.expanduser("~/.stock-analyzer/config.json")
        self.config = self.load_config()
    
    def load_config(self):
        """加载配置文件"""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                # 合并默认配置
                return self._merge_config(self.DEFAULT_CONFIG, config)
            except Exception as e:
                print(f"加载配置文件失败: {e}, 使用默认配置")
                return self.DEFAULT_CONFIG.copy()
        else:
            # 创建默认配置文件
            self.save_config(self.DEFAULT_CONFIG)
            return self.DEFAULT_CONFIG.copy()
    
    def save_config(self, config=None):
        """保存配置文件"""
        config = config or self.config
        
        # 确保目录存在
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"保存配置文件失败: {e}")
            return False
    
    def get(self, key_path, default=None):
        """获取配置值"""
        keys = key_path.split('.')
        value = self.config
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        
        return value
    
    def set(self, key_path, value):
        """设置配置值"""
        keys = key_path.split('.')
        config = self.config
        
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        config[keys[-1]] = value
        self.save_config()
    
    def _merge_config(self, default, custom):
        """合并配置"""
        result = default.copy()
        
        for key, value in custom.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_config(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def get_data_source_config(self, source_name):
        """获取数据源配置"""
        return self.get(f'data_sources.{source_name}', {})
    
    def get_indicator_config(self, indicator_name):
        """获取指标配置"""
        return self.get(f'technical_indicators.{indicator_name}', {})
    
    def get_strategy_config(self, strategy_name):
        """获取策略配置"""
        return self.get(f'trading_strategies.{strategy_name}', {})
    
    def get_enabled_data_sources(self):
        """获取启用的数据源"""
        sources = self.get('data_sources', {})
        enabled_sources = []
        
        for name, config in sources.items():
            if config.get('enabled', False):
                enabled_sources.append({
                    'name': name,
                    'priority': config.get('priority', 999),
                    'config': config
                })
        
        # 按优先级排序
        enabled_sources.sort(key=lambda x: x['priority'])
        return enabled_sources
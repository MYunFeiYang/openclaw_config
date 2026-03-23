# 配置示例

## 主配置文件 (config.json)

```json
{
  "data_sources": {
    "yahoo_finance": {
      "enabled": true,
      "priority": 1,
      "timeout": 30
    },
    "alpha_vantage": {
      "enabled": true,
      "priority": 2,
      "api_key": "your_alpha_vantage_api_key_here",
      "timeout": 30
    },
    "sina_finance": {
      "enabled": true,
      "priority": 3,
      "timeout": 20
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
      "confirmation_required": 2,
      "description": "多指标共振策略"
    }
  },
  "report_settings": {
    "default_format": "pdf",
    "include_charts": true,
    "chart_style": "seaborn",
    "template_dir": "templates",
    "chart_dpi": 300,
    "font_family": "Arial"
  },
  "scheduler": {
    "timezone": "Asia/Shanghai",
    "default_interval": "1d",
    "max_concurrent_jobs": 5,
    "job_timeout": 3600
  },
  "notifications": {
    "email": {
      "enabled": false,
      "smtp_server": "smtp.gmail.com",
      "smtp_port": 587,
      "username": "your_email@gmail.com",
      "password": "your_app_password",
      "from_email": "stock-analyzer@example.com",
      "to_emails": ["recipient@example.com"],
      "subject_template": "股票分析报告 - {symbol}",
      "body_template": "请查收附件中的股票分析报告。"
    },
    "webhook": {
      "enabled": false,
      "url": "https://your-webhook-url.com/notify",
      "headers": {
        "Authorization": "Bearer your_token"
      }
    }
  },
  "data_storage": {
    "data_dir": "data",
    "cache_dir": "cache",
    "reports_dir": "reports",
    "charts_dir": "charts",
    "logs_dir": "logs",
    "max_cache_age": 86400,
    "max_log_size": 10485760,
    "backup_count": 5
  },
  "api_settings": {
    "rate_limit": {
      "requests_per_hour": 1000,
      "requests_per_day": 10000
    },
    "timeout": 30,
    "retries": 3,
    "retry_delay": 1
  }
}
```

## 环境变量配置

### Linux/macOS (.bashrc 或 .zshrc)
```bash
# 股票分析器配置
export STOCK_ANALYZER_API_KEY="your_api_key_here"
export STOCK_ANALYZER_DATA_DIR="/path/to/data"
export STOCK_ANALYZER_OUTPUT_DIR="/path/to/reports"
export STOCK_ANALYZER_LOG_LEVEL="INFO"
export STOCK_ANALYZER_TIMEZONE="Asia/Shanghai"

# Alpha Vantage API密钥
export ALPHA_VANTAGE_API_KEY="your_alpha_vantage_api_key"

# 邮件配置
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USERNAME="your_email@gmail.com"
export SMTP_PASSWORD="your_app_password"
```

### Windows (环境变量)
```cmd
set STOCK_ANALYZER_API_KEY=your_api_key_here
set STOCK_ANALYZER_DATA_DIR=C:\path\to\data
set STOCK_ANALYZER_OUTPUT_DIR=C:\path\to\reports
set STOCK_ANALYZER_LOG_LEVEL=INFO
set ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

## 策略配置示例

### 保守型策略配置
```json
{
  "trading_strategies": {
    "conservative_strategy": {
      "type": "multi_indicator",
      "confirmation_required": 3,
      "indicators": ["ma", "rsi", "macd", "bollinger"],
      "parameters": {
        "ma": {
          "golden_cross": {
            "short_ma": 20,
            "long_ma": 60
          }
        },
        "rsi": {
          "overbought": 75,
          "oversold": 25,
          "period": 21
        },
        "macd": {
          "fast": 8,
          "slow": 21,
          "signal": 5
        }
      },
      "risk_management": {
        "stop_loss": 0.05,
        "take_profit": 0.15,
        "max_position_size": 0.1
      }
    }
  }
}
```

### 激进型策略配置
```json
{
  "trading_strategies": {
    "aggressive_strategy": {
      "type": "multi_indicator",
      "confirmation_required": 2,
      "indicators": ["rsi", "macd"],
      "parameters": {
        "rsi": {
          "overbought": 65,
          "oversold": 35,
          "period": 9
        },
        "macd": {
          "fast": 5,
          "slow": 13,
          "signal": 3
        }
      },
      "risk_management": {
        "stop_loss": 0.08,
        "take_profit": 0.25,
        "max_position_size": 0.2
      }
    }
  }
}
```

## 数据源配置

### 多数据源优先级
```json
{
  "data_sources": {
    "primary": {
      "yahoo_finance": {
        "enabled": true,
        "priority": 1,
        "fallback_enabled": true
      }
    },
    "secondary": {
      "alpha_vantage": {
        "enabled": true,
        "priority": 2,
        "api_key": "${ALPHA_VANTAGE_API_KEY}",
        "fallback_enabled": true
      }
    },
    "tertiary": {
      "sina_finance": {
        "enabled": true,
        "priority": 3,
        "region": "CN",
        "fallback_enabled": false
      }
    }
  }
}
```

### 区域化配置
```json
{
  "regional_config": {
    "US": {
      "primary_data_source": "yahoo_finance",
      "trading_hours": "09:30-16:00",
      "timezone": "America/New_York",
      "currency": "USD"
    },
    "CN": {
      "primary_data_source": "sina_finance",
      "trading_hours": "09:30-11:30,13:00-15:00",
      "timezone": "Asia/Shanghai",
      "currency": "CNY"
    },
    "HK": {
      "primary_data_source": "yahoo_finance",
      "trading_hours": "09:30-12:00,13:00-16:00",
      "timezone": "Asia/Hong_Kong",
      "currency": "HKD"
    }
  }
}
```

## 报告模板配置

### PDF报告模板
```json
{
  "report_templates": {
    "technical_analysis": {
      "sections": [
        "basic_info",
        "price_analysis",
        "technical_indicators",
        "signals",
        "risk_analysis",
        "recommendations"
      ],
      "charts": [
        "price_chart",
        "volume_chart",
        "indicator_charts"
      ],
      "formatting": {
        "page_size": "A4",
        "orientation": "portrait",
        "font_size": 12,
        "include_table_of_contents": true
      }
    },
    "portfolio_report": {
      "sections": [
        "portfolio_overview",
        "performance_analysis",
        "risk_metrics",
        "allocation_analysis",
        "rebalancing_suggestions"
      ],
      "include_correlation_matrix": true,
      "include_efficient_frontier": true
    }
  }
}
```

### 图表配置
```json
{
  "chart_settings": {
    "price_chart": {
      "type": "line",
      "indicators": ["ma_20", "ma_50", "volume"],
      "style": "seaborn",
      "colors": {
        "price": "#1f77b4",
        "ma_20": "#ff7f0e",
        "ma_50": "#2ca02c",
        "volume": "#d62728"
      },
      "dimensions": {
        "width": 12,
        "height": 6,
        "dpi": 300
      }
    },
    "indicator_chart": {
      "subplots": true,
      "indicators": ["rsi", "macd", "bollinger"],
      "height_ratios": [2, 1, 1, 1]
    }
  }
}
```

## 定时任务配置

### 每日报告任务
```json
{
  "scheduled_tasks": {
    "daily_reports": {
      "enabled": true,
      "symbols": ["AAPL", "MSFT", "GOOGL", "TSLA"],
      "schedule_time": "18:00",
      "timezone": "Asia/Shanghai",
      "report_format": "pdf",
      "include_charts": true,
      "email_notification": true,
      "recipients": ["investor@example.com"]
    },
    "weekly_summary": {
      "enabled": true,
      "day_of_week": "sunday",
      "schedule_time": "20:00",
      "portfolio_report": true,
      "performance_analysis": true
    }
  }
}
```

### 实时监控任务
```json
{
  "real_time_monitoring": {
    "signal_monitoring": {
      "enabled": true,
      "symbols": ["AAPL", "MSFT"],
      "check_interval": "30min",
      "strategies": ["multi_indicator"],
      "alert_conditions": {
        "strong_buy_signal": true,
        "strong_sell_signal": true,
        "unusual_volume": {
          "threshold": 2.0,
          "comparison_period": "10d"
        }
      },
      "notification_methods": ["email", "webhook"]
    }
  }
}
```

## 性能优化配置

### 缓存配置
```json
{
  "cache_settings": {
    "data_cache": {
      "enabled": true,
      "ttl": 3600,
      "max_size": 1073741824,
      "cleanup_interval": 1800
    },
    "indicator_cache": {
      "enabled": true,
      "ttl": 7200,
      "max_size": 536870912
    },
    "report_cache": {
      "enabled": true,
      "ttl": 86400,
      "max_size": 2147483648
    }
  }
}
```

### 并发配置
```json
{
  "concurrency_settings": {
    "data_fetching": {
      "max_workers": 10,
      "timeout": 30,
      "retry_attempts": 3
    },
    "indicator_calculation": {
      "max_workers": 4,
      "chunk_size": 1000
    },
    "report_generation": {
      "max_workers": 2,
      "memory_limit": "2GB"
    }
  }
}
```

## 安全配置

### API安全
```json
{
  "security_settings": {
    "api_key": {
      "rotation_enabled": true,
      "rotation_interval": "30d",
      "min_length": 32,
      "complexity_requirements": {
        "uppercase": true,
        "lowercase": true,
        "numbers": true,
        "special_chars": true
      }
    },
    "rate_limiting": {
      "enabled": true,
      "requests_per_minute": 60,
      "requests_per_hour": 1000,
      "burst_allowance": 10
    },
    "encryption": {
      "data_at_rest": true,
      "data_in_transit": true,
      "algorithm": "AES-256"
    }
  }
}
```

### 数据隐私
```json
{
  "privacy_settings": {
    "data_retention": {
      "user_data": "1y",
      "calculated_data": "6m",
      "logs": "3m"
    },
    "data_anonymization": true,
    "user_consent": {
      "required": true,
      "granular": true
    }
  }
}
```
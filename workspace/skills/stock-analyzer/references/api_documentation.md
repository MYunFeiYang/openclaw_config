# API文档

## 股票分析器API

### 概述
股票分析器提供RESTful API接口，支持股票数据获取、技术分析、信号生成等功能。

### 基础信息
- **Base URL**: `http://localhost:8080/api/v1`
- **认证方式**: API Key (Header: `X-API-Key`)
- **数据格式**: JSON
- **字符编码**: UTF-8

### 认证
```http
GET /api/v1/stock/AAPL/data
X-API-Key: your_api_key_here
```

### 错误响应
所有API请求失败时返回统一的错误格式：
```json
{
  "error": {
    "code": "INVALID_SYMBOL",
    "message": "Invalid stock symbol",
    "details": "The provided stock symbol is not valid"
  }
}
```

### API端点

#### 1. 获取股票数据
获取指定股票的历史价格数据。

**请求**
```http
GET /api/v1/stock/{symbol}/data?period=1y&interval=1d
```

**参数**
- `symbol` (路径参数): 股票代码 (如: AAPL, MSFT)
- `period` (查询参数): 数据周期 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y)
- `interval` (查询参数): 数据间隔 (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)

**响应**
```json
{
  "symbol": "AAPL",
  "period": "1y",
  "interval": "1d",
  "data": [
    {
      "date": "2023-01-03",
      "open": 130.28,
      "high": 133.46,
      "low": 129.89,
      "close": 133.45,
      "volume": 74950700,
      "adj_close": 133.45
    }
  ],
  "count": 252,
  "start_date": "2023-01-03",
  "end_date": "2023-12-29"
}
```

#### 2. 获取实时报价
获取股票的实时市场报价。

**请求**
```http
GET /api/v1/stock/{symbol}/quote
```

**响应**
```json
{
  "symbol": "AAPL",
  "price": 175.43,
  "change": 2.15,
  "change_percent": 1.24,
  "volume": 45678900,
  "market_cap": 2800000000000,
  "timestamp": "2024-01-15T15:30:00Z",
  "currency": "USD"
}
```

#### 3. 计算技术指标
计算指定股票的技术指标。

**请求**
```http
POST /api/v1/stock/{symbol}/indicators
Content-Type: application/json

{
  "indicators": ["ma", "rsi", "macd", "bollinger"],
  "period": "6mo",
  "parameters": {
    "ma": {
      "periods": [5, 10, 20, 50]
    },
    "rsi": {
      "period": 14,
      "overbought": 70,
      "oversold": 30
    }
  }
}
```

**响应**
```json
{
  "symbol": "AAPL",
  "indicators": {
    "ma": {
      "MA5": 174.23,
      "MA10": 173.45,
      "MA20": 172.89,
      "MA50": 170.12
    },
    "rsi": {
      "value": 65.4,
      "signal": "neutral",
      "analysis": "RSI处于正常区间"
    },
    "macd": {
      "macd": 1.23,
      "signal": 0.89,
      "histogram": 0.34,
      "signal": "bullish"
    },
    "bollinger": {
      "upper": 178.45,
      "middle": 172.89,
      "lower": 167.33,
      "position": "within_bands"
    }
  },
  "analysis": {
    "overall_signal": "neutral",
    "trend": "sideways",
    "strength": "medium"
  }
}
```

#### 4. 生成交易信号
基于指定策略生成交易信号。

**请求**
```http
POST /api/v1/stock/{symbol}/signals
Content-Type: application/json

{
  "strategy": "multi_indicator",
  "period": "3mo",
  "parameters": {
    "confirmation_required": 2,
    "min_strength": "medium"
  }
}
```

**响应**
```json
{
  "symbol": "AAPL",
  "strategy": "multi_indicator",
  "signals": [
    {
      "date": "2024-01-10",
      "type": "buy",
      "strength": "strong",
      "price": 172.50,
      "confidence": 0.85,
      "indicators": ["ma", "macd", "rsi"],
      "details": "多指标买入共振信号"
    },
    {
      "date": "2024-01-05",
      "type": "sell",
      "strength": "medium",
      "price": 175.20,
      "confidence": 0.72,
      "indicators": ["bollinger", "rsi"],
      "details": "RSI超买且价格触及布林带上轨"
    }
  ],
  "summary": {
    "total_signals": 8,
    "buy_signals": 3,
    "sell_signals": 5,
    "recent_signal": "2024-01-10"
  }
}
```

#### 5. 回测策略
回测指定策略的历史表现。

**请求**
```http
POST /api/v1/backtest
Content-Type: application/json

{
  "symbols": ["AAPL", "MSFT"],
  "strategy": "golden_cross",
  "period": "2y",
  "initial_capital": 100000,
  "parameters": {
    "short_ma": 50,
    "long_ma": 200
  }
}
```

**响应**
```json
{
  "backtest_results": [
    {
      "symbol": "AAPL",
      "total_return": 15.4,
      "annual_return": 7.5,
      "win_rate": 0.65,
      "trade_count": 12,
      "profitable_trades": 8,
      "losing_trades": 4,
      "max_drawdown": -8.2,
      "sharpe_ratio": 1.23,
      "final_value": 115400,
      "best_trade": 12.5,
      "worst_trade": -5.3,
      "avg_trade_return": 1.28
    },
    {
      "symbol": "MSFT",
      "total_return": 22.1,
      "annual_return": 10.8,
      "win_rate": 0.71,
      "trade_count": 14,
      "profitable_trades": 10,
      "losing_trades": 4,
      "max_drawdown": -6.8,
      "sharpe_ratio": 1.45,
      "final_value": 122100,
      "best_trade": 15.2,
      "worst_trade": -4.1,
      "avg_trade_return": 1.58
    }
  ],
  "summary": {
    "total_symbols": 2,
    "avg_total_return": 18.75,
    "avg_annual_return": 9.15,
    "avg_win_rate": 0.68,
    "total_trades": 26,
    "avg_sharpe_ratio": 1.34
  }
}
```

#### 6. 生成报告
生成股票分析报告。

**请求**
```http
POST /api/v1/report
Content-Type: application/json

{
  "symbol": "AAPL",
  "report_type": "technical_analysis",
  "period": "1y",
  "format": "pdf",
  "include_charts": true,
  "indicators": ["ma", "rsi", "macd", "bollinger"]
}
```

**响应**
```json
{
  "report_id": "report_12345",
  "symbol": "AAPL",
  "report_type": "technical_analysis",
  "format": "pdf",
  "status": "completed",
  "file_path": "/reports/AAPL_analysis_20240115.pdf",
  "file_size": 2456789,
  "generated_at": "2024-01-15T10:30:00Z",
  "download_url": "http://localhost:8080/api/v1/reports/report_12345/download"
}
```

#### 7. 获取报告列表
获取已生成的报告列表。

**请求**
```http
GET /api/v1/reports?limit=10&offset=0&symbol=AAPL
```

**响应**
```json
{
  "reports": [
    {
      "report_id": "report_12345",
      "symbol": "AAPL",
      "report_type": "technical_analysis",
      "format": "pdf",
      "status": "completed",
      "generated_at": "2024-01-15T10:30:00Z",
      "file_size": 2456789
    },
    {
      "report_id": "report_12346",
      "symbol": "MSFT",
      "report_type": "portfolio_analysis",
      "format": "html",
      "status": "completed",
      "generated_at": "2024-01-14T15:20:00Z",
      "file_size": 1234567
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

#### 8. 下载报告
下载指定报告文件。

**请求**
```http
GET /api/v1/reports/{report_id}/download
```

**响应**
返回报告文件内容，Content-Type根据报告格式确定。

#### 9. 获取市场概览
获取市场整体概览信息。

**请求**
```http
GET /api/v1/market/overview
```

**响应**
```json
{
  "market_status": "open",
  "timestamp": "2024-01-15T15:30:00Z",
  "indices": {
    "SPY": {
      "price": 478.45,
      "change": 2.34,
      "change_percent": 0.49
    },
    "QQQ": {
      "price": 412.67,
      "change": -1.23,
      "change_percent": -0.30
    },
    "DIA": {
      "price": 375.89,
      "change": 1.45,
      "change_percent": 0.39
    }
  },
  "sectors": {
    "technology": 0.85,
    "healthcare": -0.23,
    "finance": 0.67,
    "energy": 1.24
  },
  "market_stats": {
    "advancers": 2156,
    "decliners": 1432,
    "unchanged": 234,
    "total_volume": 3456789000
  }
}
```

#### 10. 获取股票搜索
搜索股票代码和公司信息。

**请求**
```http
GET /api/v1/search?q=apple&limit=10
```

**响应**
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NASDAQ",
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "market_cap": 2800000000000,
      "country": "USA"
    },
    {
      "symbol": "APLE",
      "name": "Apple Hospitality REIT, Inc.",
      "exchange": "NYSE",
      "sector": "Real Estate",
      "industry": "REIT - Hotel & Motel",
      "market_cap": 3456789000,
      "country": "USA"
    }
  ],
  "total": 2,
  "query": "apple"
}
```

### 错误代码

| 错误代码 | HTTP状态 | 描述 |
|----------|----------|------|
| INVALID_SYMBOL | 400 | 无效的股票代码 |
| INVALID_PERIOD | 400 | 无效的数据周期 |
| INVALID_STRATEGY | 400 | 无效的交易策略 |
| DATA_NOT_AVAILABLE | 404 | 请求的数据不可用 |
| RATE_LIMIT_EXCEEDED | 429 | API调用频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| UNAUTHORIZED | 401 | API密钥无效或缺失 |

### 限流规则
- **免费用户**: 100次/小时，1000次/天
- **付费用户**: 1000次/小时，10000次/天
- **企业用户**: 无限制

### 数据更新频率
- **实时报价**: 15分钟延迟（免费），实时（付费）
- **历史数据**: 每日更新
- **技术指标**: 实时计算
- **财务数据**: 季度更新

### 支持的市场
- **美国**: NYSE, NASDAQ, AMEX
- **中国**: 上交所, 深交所
- **香港**: 港交所
- **其他**: 东京证交所、伦敦证交所等

### 技术支持
- **文档更新**: 定期更新
- **API状态**: http://status.stock-analyzer.com
- **技术支持**: support@stock-analyzer.com
- **社区论坛**: https://community.stock-analyzer.com
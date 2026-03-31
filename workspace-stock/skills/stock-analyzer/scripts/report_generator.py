#!/usr/bin/env python3
"""
报告生成器模块
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import os
import io
import base64

class ReportGenerator:
    """报告生成器"""
    
    def __init__(self, config):
        self.config = config
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()
    
    def _init_custom_styles(self):
        """初始化自定义样式"""
        # 标题样式
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            fontSize=24,
            spaceAfter=30,
            alignment=1,  # 居中
            fontName='Helvetica-Bold'
        ))
        
        # 副标题样式
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            fontSize=16,
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ))
        
        # 正文样式
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            fontSize=12,
            spaceAfter=6,
            fontName='Helvetica'
        ))
        
        # 强调样式
        self.styles.add(ParagraphStyle(
            name='CustomHighlight',
            fontSize=12,
            spaceAfter=6,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        ))
    
    def generate_report(self, report_data, output_path, format='pdf'):
        """生成股票分析报告"""
        if format.lower() == 'pdf':
            return self._generate_pdf_report(report_data, output_path)
        elif format.lower() == 'html':
            return self._generate_html_report(report_data, output_path)
        elif format.lower() == 'md':
            return self._generate_markdown_report(report_data, output_path)
        else:
            raise ValueError(f"不支持的报告格式: {format}")
    
    def _generate_pdf_report(self, report_data, output_path):
        """生成PDF报告"""
        symbol = report_data['symbol']
        data = report_data['data']
        indicators = report_data['indicators']
        signals = report_data['signals']
        generated_at = report_data['generated_at']
        
        # 创建PDF文档
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        story = []
        
        # 标题
        title = Paragraph(f"股票分析报告 - {symbol}", self.styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 20))
        
        # 基本信息
        story.append(Paragraph("基本信息", self.styles['CustomHeading']))
        
        latest_price = data['Close'].iloc[-1]
        prev_price = data['Close'].iloc[-2]
        price_change = latest_price - prev_price
        price_change_pct = (price_change / prev_price) * 100
        
        basic_info = f"""
        股票代码: {symbol}<br/>
        当前价格: ${latest_price:.2f}<br/>
        价格变动: ${price_change:.2f} ({price_change_pct:+.2f}%)<br/>
        成交量: {data['Volume'].iloc[-1]:,}<br/>
        分析日期: {generated_at.strftime('%Y-%m-%d %H:%M:%S')}<br/>
        数据周期: {len(data)} 个交易日
        """
        
        story.append(Paragraph(basic_info, self.styles['CustomBody']))
        story.append(Spacer(1, 12))
        
        # 技术指标分析
        story.append(Paragraph("技术指标分析", self.styles['CustomHeading']))
        
        # RSI分析
        if 'rsi' in indicators:
            rsi_data = indicators['rsi']
            rsi_value = rsi_data['latest']['RSI']
            rsi_signal = rsi_data['signal']
            
            rsi_text = f"RSI指标: {rsi_value:.2f} - "
            if rsi_signal == 'overbought':
                rsi_text += "超买状态，可能面临回调"
            elif rsi_signal == 'oversold':
                rsi_text += "超卖状态，可能出现反弹"
            else:
                rsi_text += "正常区间"
            
            story.append(Paragraph(rsi_text, self.styles['CustomBody']))
        
        # MACD分析
        if 'macf' in indicators:
            macd_data = indicators['macf']
            macd_value = macd_data['latest']['MACD']
            signal_value = macd_data['latest']['Signal']
            macd_signal = macd_data['signal']
            
            macd_text = f"MACD指标: {macd_value:.4f}, 信号线: {signal_value:.4f} - "
            if macd_signal == 'bullish':
                macd_text += "看涨信号"
            elif macd_signal == 'bearish':
                macd_text += "看跌信号"
            else:
                macd_text += "中性信号"
            
            story.append(Paragraph(macd_text, self.styles['CustomBody']))
        
        # 布林带分析
        if 'bollinger' in indicators:
            bb_data = indicators['bollinger']
            bb_signal = bb_data['signal']
            latest_price = bb_data['latest']['Price']
            upper_band = bb_data['latest']['Upper']
            lower_band = bb_data['latest']['Lower']
            
            bb_text = f"布林带: 价格${latest_price:.2f} - "
            if bb_signal == 'above_upper':
                bb_text += "突破上轨，可能面临回调"
            elif bb_signal == 'below_lower':
                bb_text += "跌破下轨，可能出现反弹"
            else:
                bb_text += "在布林带内运行"
            
            story.append(Paragraph(bb_text, self.styles['CustomBody']))
        
        story.append(Spacer(1, 12))
        
        # 交易信号
        story.append(Paragraph("交易信号", self.styles['CustomHeading']))
        
        if signals:
            recent_signals = signals[-10:]  # 显示最近10个信号
            
            for signal in recent_signals:
                signal_date = signal['date'].strftime('%Y-%m-%d')
                signal_type = signal['type']
                signal_strength = signal['strength']
                signal_price = signal['price']
                signal_details = signal['details']
                
                signal_color = colors.darkgreen if signal_type == 'buy' else colors.darkred
                signal_text = f"{signal_date}: <font color='{signal_color}'>{signal_type.upper()}</font> - "
                signal_text += f"强度: {signal_strength}, 价格: ${signal_price:.2f}<br/>{signal_details}"
                
                story.append(Paragraph(signal_text, self.styles['CustomBody']))
                story.append(Spacer(1, 6))
        else:
            story.append(Paragraph("当前无交易信号", self.styles['CustomBody']))
        
        story.append(Spacer(1, 12))
        
        # 价格走势分析
        story.append(Paragraph("价格走势分析", self.styles['CustomHeading']))
        
        # 计算一些统计指标
        price_stats = self._calculate_price_statistics(data)
        
        price_analysis = f"""
        最高价: ${price_stats['max_price']:.2f}<br/>
        最低价: ${price_stats['min_price']:.2f}<br/>
        平均价: ${price_stats['avg_price']:.2f}<br/>
        价格波动率: {price_stats['volatility']:.2f}%<br/>
        价格趋势: {price_stats['trend']}
        """
        
        story.append(Paragraph(price_analysis, self.styles['CustomBody']))
        story.append(Spacer(1, 12))
        
        # 风险提示
        story.append(Paragraph("风险提示", self.styles['CustomHeading']))
        risk_warning = """
        本报告仅供参考，不构成投资建议。<br/>
        股市有风险，投资需谨慎。<br/>
        请根据自身风险承受能力做出投资决策。<br/>
        过往表现不代表未来收益。
        """
        story.append(Paragraph(risk_warning, self.styles['CustomHighlight']))
        
        # 构建PDF
        doc.build(story)
        return output_path
    
    def _generate_html_report(self, report_data, output_path):
        """生成HTML报告"""
        symbol = report_data['symbol']
        data = report_data['data']
        indicators = report_data['indicators']
        signals = report_data['signals']
        generated_at = report_data['generated_at']
        
        # 计算基本信息
        latest_price = data['Close'].iloc[-1]
        prev_price = data['Close'].iloc[-2]
        price_change = latest_price - prev_price
        price_change_pct = (price_change / prev_price) * 100
        
        # 价格统计
        price_stats = self._calculate_price_statistics(data)
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>股票分析报告 - {symbol}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                .header {{ background-color: #f4f4f4; padding: 20px; border-radius: 5px; }}
                .section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
                .signal-buy {{ color: #28a745; font-weight: bold; }}
                .signal-sell {{ color: #dc3545; font-weight: bold; }}
                .indicator-positive {{ color: #28a745; }}
                .indicator-negative {{ color: #dc3545; }}
                .warning {{ background-color: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; }}
                table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
                th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f8f9fa; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>股票分析报告 - {symbol}</h1>
                <p>分析日期: {generated_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="section">
                <h2>基本信息</h2>
                <table>
                    <tr><th>项目</th><th>数值</th></tr>
                    <tr><td>股票代码</td><td>{symbol}</td></tr>
                    <tr><td>当前价格</td><td>${latest_price:.2f}</td></tr>
                    <tr><td>价格变动</td><td class="{'indicator-positive' if price_change >= 0 else 'indicator-negative'}">${price_change:+.2f} ({price_change_pct:+.2f}%)</td></tr>
                    <tr><td>成交量</td><td>{data['Volume'].iloc[-1]:,}</td></tr>
                    <tr><td>数据周期</td><td>{len(data)} 个交易日</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h2>技术指标分析</h2>
        """
        
        # RSI分析
        if 'rsi' in indicators:
            rsi_data = indicators['rsi']
            rsi_value = rsi_data['latest']['RSI']
            rsi_signal = rsi_data['signal']
            
            rsi_class = 'indicator-positive' if rsi_signal == 'oversold' else ('indicator-negative' if rsi_signal == 'overbought' else '')
            rsi_text = f"RSI指标: {rsi_value:.2f} - "
            if rsi_signal == 'overbought':
                rsi_text += "超买状态，可能面临回调"
            elif rsi_signal == 'oversold':
                rsi_text += "超卖状态，可能出现反弹"
            else:
                rsi_text += "正常区间"
            
            html_content += f'<p class="{rsi_class}">{rsi_text}</p>'
        
        # MACD分析
        if 'macf' in indicators:
            macd_data = indicators['macf']
            macd_value = macd_data['latest']['MACD']
            signal_value = macd_data['latest']['Signal']
            macd_signal = macd_data['signal']
            
            macd_class = 'indicator-positive' if macd_signal == 'bullish' else ('indicator-negative' if macd_signal == 'bearish' else '')
            macd_text = f"MACD指标: {macd_value:.4f}, 信号线: {signal_value:.4f} - "
            if macd_signal == 'bullish':
                macd_text += "看涨信号"
            elif macd_signal == 'bearish':
                macd_text += "看跌信号"
            else:
                macd_text += "中性信号"
            
            html_content += f'<p class="{macd_class}">{macd_text}</p>'
        
        html_content += """
            </div>
            
            <div class="section">
                <h2>交易信号</h2>
        """
        
        if signals:
            recent_signals = signals[-10:]
            html_content += "<table><tr><th>日期</th><th>类型</th><th>强度</th><th>价格</th><th>详情</th></tr>"
            
            for signal in recent_signals:
                signal_class = 'signal-buy' if signal['type'] == 'buy' else 'signal-sell'
                html_content += f"""
                <tr>
                    <td>{signal['date'].strftime('%Y-%m-%d')}</td>
                    <td class="{signal_class}">{signal['type'].upper()}</td>
                    <td>{signal['strength']}</td>
                    <td>${signal['price']:.2f}</td>
                    <td>{signal['details']}</td>
                </tr>
                """
            
            html_content += "</table>"
        else:
            html_content += "<p>当前无交易信号</p>"
        
        html_content += f"""
            </div>
            
            <div class="section">
                <h2>价格走势分析</h2>
                <table>
                    <tr><th>统计指标</th><th>数值</th></tr>
                    <tr><td>最高价</td><td>${price_stats['max_price']:.2f}</td></tr>
                    <tr><td>最低价</td><td>${price_stats['min_price']:.2f}</td></tr>
                    <tr><td>平均价</td><td>${price_stats['avg_price']:.2f}</td></tr>
                    <tr><td>价格波动率</td><td>{price_stats['volatility']:.2f}%</td></tr>
                    <tr><td>价格趋势</td><td>{price_stats['trend']}</td></tr>
                </table>
            </div>
            
            <div class="warning">
                <h3>风险提示</h3>
                <p>本报告仅供参考，不构成投资建议。股市有风险，投资需谨慎。请根据自身风险承受能力做出投资决策。过往表现不代表未来收益。</p>
            </div>
        </body>
        </html>
        """
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return output_path
    
    def _generate_markdown_report(self, report_data, output_path):
        """生成Markdown报告"""
        symbol = report_data['symbol']
        data = report_data['data']
        indicators = report_data['indicators']
        signals = report_data['signals']
        generated_at = report_data['generated_at']
        
        # 计算基本信息
        latest_price = data['Close'].iloc[-1]
        prev_price = data['Close'].iloc[-2]
        price_change = latest_price - prev_price
        price_change_pct = (price_change / prev_price) * 100
        
        # 价格统计
        price_stats = self._calculate_price_statistics(data)
        
        md_content = f"""# 股票分析报告 - {symbol}

**分析日期**: {generated_at.strftime('%Y-%m-%d %H:%M:%S')}

## 基本信息

| 项目 | 数值 |
|------|------|
| 股票代码 | {symbol} |
| 当前价格 | ${latest_price:.2f} |
| 价格变动 | ${price_change:+.2f} ({price_change_pct:+.2f}%) |
| 成交量 | {data['Volume'].iloc[-1]:,} |
| 数据周期 | {len(data)} 个交易日 |

## 技术指标分析

"""
        
        # RSI分析
        if 'rsi' in indicators:
            rsi_data = indicators['rsi']
            rsi_value = rsi_data['latest']['RSI']
            rsi_signal = rsi_data['signal']
            
            if rsi_signal == 'overbought':
                rsi_text = f"**RSI指标**: {rsi_value:.2f} - **超买状态，可能面临回调**"
            elif rsi_signal == 'oversold':
                rsi_text = f"**RSI指标**: {rsi_value:.2f} - **超卖状态，可能出现反弹**"
            else:
                rsi_text = f"**RSI指标**: {rsi_value:.2f} - 正常区间"
            
            md_content += rsi_text + "\n\n"
        
        # MACD分析
        if 'macf' in indicators:
            macd_data = indicators['macf']
            macd_value = macd_data['latest']['MACD']
            signal_value = macd_data['latest']['Signal']
            macd_signal = macd_data['signal']
            
            if macd_signal == 'bullish':
                macd_text = f"**MACD指标**: {macd_value:.4f}, 信号线: {signal_value:.4f} - **看涨信号**"
            elif macd_signal == 'bearish':
                macd_text = f"**MACD指标**: {macd_value:.4f}, 信号线: {signal_value:.4f} - **看跌信号**"
            else:
                macd_text = f"**MACD指标**: {macd_value:.4f}, 信号线: {signal_value:.4f} - 中性信号"
            
            md_content += macd_text + "\n\n"
        
        # 布林带分析
        if 'bollinger' in indicators:
            bb_data = indicators['bollinger']
            bb_signal = bb_data['signal']
            latest_price = bb_data['latest']['Price']
            
            if bb_signal == 'above_upper':
                bb_text = f"**布林带**: 价格${latest_price:.2f} - **突破上轨，可能面临回调**"
            elif bb_signal == 'below_lower':
                bb_text = f"**布林带**: 价格${latest_price:.2f} - **跌破下轨，可能出现反弹**"
            else:
                bb_text = f"**布林带**: 价格${latest_price:.2f} - 在布林带内运行"
            
            md_content += bb_text + "\n\n"
        
        md_content += "## 交易信号\n\n"
        
        if signals:
            recent_signals = signals[-10:]
            md_content += "| 日期 | 类型 | 强度 | 价格 | 详情 |\n"
            md_content += "|------|------|------|------|------|\n"
            
            for signal in recent_signals:
                signal_type = "**买入**" if signal['type'] == 'buy' else "**卖出**"
                md_content += f"| {signal['date'].strftime('%Y-%m-%d')} | {signal_type} | {signal['strength']} | ${signal['price']:.2f} | {signal['details']} |\n"
        else:
            md_content += "当前无交易信号\n"
        
        md_content += f"""

## 价格走势分析

| 统计指标 | 数值 |
|----------|------|
| 最高价 | ${price_stats['max_price']:.2f} |
| 最低价 | ${price_stats['min_price']:.2f} |
| 平均价 | ${price_stats['avg_price']:.2f} |
| 价格波动率 | {price_stats['volatility']:.2f}% |
| 价格趋势 | {price_stats['trend']} |

## 风险提示

> **免责声明**: 本报告仅供参考，不构成投资建议。股市有风险，投资需谨慎。请根据自身风险承受能力做出投资决策。过往表现不代表未来收益。

---
*报告生成时间: {generated_at.strftime('%Y-%m-%d %H:%M:%S')}*
"""
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        return output_path
    
    def generate_portfolio_report(self, portfolio_data, output_path, format='pdf'):
        """生成投资组合报告"""
        if format.lower() == 'pdf':
            return self._generate_pdf_portfolio_report(portfolio_data, output_path)
        elif format.lower() == 'html':
            return self._generate_html_portfolio_report(portfolio_data, output_path)
        else:
            raise ValueError(f"不支持的报告格式: {format}")
    
    def _generate_pdf_portfolio_report(self, portfolio_data, output_path):
        """生成PDF投资组合报告"""
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        story = []
        
        # 标题
        title = Paragraph("投资组合分析报告", self.styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 20))
        
        # 组合概览
        story.append(Paragraph("组合概览", self.styles['CustomHeading']))
        
        total_symbols = len(portfolio_data)
        symbols_list = [item['symbol'] for item in portfolio_data]
        
        overview_text = f"""
        股票数量: {total_symbols}<br/>
        股票列表: {', '.join(symbols_list)}<br/>
        分析日期: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        story.append(Paragraph(overview_text, self.styles['CustomBody']))
        story.append(Spacer(1, 12))
        
        # 个股分析
        story.append(Paragraph("个股分析", self.styles['CustomHeading']))
        
        for item in portfolio_data:
            symbol = item['symbol']
            data = item['data']
            indicators = item['indicators']
            signals = item['signals']
            
            latest_price = data['Close'].iloc[-1]
            prev_price = data['Close'].iloc[-2]
            price_change = latest_price - prev_price
            price_change_pct = (price_change / prev_price) * 100
            
            stock_text = f"""
            <b>{symbol}</b><br/>
            当前价格: ${latest_price:.2f}<br/>
            价格变动: ${price_change:.2f} ({price_change_pct:+.2f}%)<br/>
            成交量: {data['Volume'].iloc[-1]:,}<br/>
            最近信号: {len([s for s in signals if s['date'] >= data.index[-30]])} 个<br/>
            """
            
            story.append(Paragraph(stock_text, self.styles['CustomBody']))
            story.append(Spacer(1, 6))
        
        story.append(Spacer(1, 12))
        
        # 风险提示
        story.append(Paragraph("风险提示", self.styles['CustomHeading']))
        risk_warning = """
        本报告仅供参考，不构成投资建议。<br/>
        股市有风险，投资需谨慎。<br/>
        请根据自身风险承受能力做出投资决策。<br/>
        过往表现不代表未来收益。
        """
        story.append(Paragraph(risk_warning, self.styles['CustomHighlight']))
        
        # 构建PDF
        doc.build(story)
        return output_path
    
    def _calculate_price_statistics(self, data):
        """计算价格统计信息"""
        close_prices = data['Close']
        
        return {
            'max_price': close_prices.max(),
            'min_price': close_prices.min(),
            'avg_price': close_prices.mean(),
            'volatility': (close_prices.std() / close_prices.mean()) * 100,
            'trend': '上涨趋势' if close_prices.iloc[-1] > close_prices.iloc[0] else '下跌趋势'
        }
    
    def create_price_chart(self, data, symbol, output_path):
        """创建价格走势图"""
        plt.figure(figsize=(12, 6))
        
        # 绘制价格走势
        plt.plot(data.index, data['Close'], linewidth=2, label='收盘价')
        
        # 添加移动平均
        ma_20 = data['Close'].rolling(window=20).mean()
        ma_50 = data['Close'].rolling(window=50).mean()
        
        plt.plot(data.index, ma_20, label='MA20', alpha=0.7)
        plt.plot(data.index, ma_50, label='MA50', alpha=0.7)
        
        plt.title(f'{symbol} 价格走势图')
        plt.xlabel('日期')
        plt.ylabel('价格 ($)')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return output_path
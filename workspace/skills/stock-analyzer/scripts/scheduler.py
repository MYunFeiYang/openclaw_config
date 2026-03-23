#!/usr/bin/env python3
"""
定时任务调度器模块
"""

import schedule
import time
import threading
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

class Scheduler:
    """定时任务调度器"""
    
    def __init__(self, config):
        self.config = config
        self.jobs = {}
        self.schedules_file = os.path.expanduser("~/.stock-analyzer/schedules.json")
        self.running = False
        self.thread = None
        self._load_schedules()
    
    def _load_schedules(self):
        """加载定时任务配置"""
        if os.path.exists(self.schedules_file):
            try:
                with open(self.schedules_file, 'r', encoding='utf-8') as f:
                    self.jobs = json.load(f)
            except Exception as e:
                print(f"加载定时任务配置失败: {e}")
                self.jobs = {}
    
    def _save_schedules(self):
        """保存定时任务配置"""
        os.makedirs(os.path.dirname(self.schedules_file), exist_ok=True)
        try:
            with open(self.schedules_file, 'w', encoding='utf-8') as f:
                json.dump(self.jobs, f, indent=2, ensure_ascii=False, default=str)
        except Exception as e:
            print(f"保存定时任务配置失败: {e}")
    
    def schedule_daily_report(self, symbols, time_str, email_notification=False):
        """设置每日报告任务"""
        job_id = f"daily_report_{int(time.time())}"
        
        job_config = {
            'id': job_id,
            'type': 'daily_report',
            'symbols': symbols,
            'schedule': f"daily_{time_str}",
            'time': time_str,
            'email_notification': email_notification,
            'status': 'active',
            'created_at': datetime.now().isoformat(),
            'last_run': None,
            'next_run': None
        }
        
        self.jobs[job_id] = job_config
        self._save_schedules()
        self._schedule_job(job_config)
        
        return job_id
    
    def schedule_signal_monitoring(self, symbols, interval, email_notification=False):
        """设置信号监控任务"""
        job_id = f"signal_monitor_{int(time.time())}"
        
        job_config = {
            'id': job_id,
            'type': 'signal_monitoring',
            'symbols': symbols,
            'schedule': f"interval_{interval}",
            'interval': interval,
            'email_notification': email_notification,
            'status': 'active',
            'created_at': datetime.now().isoformat(),
            'last_run': None,
            'next_run': None
        }
        
        self.jobs[job_id] = job_config
        self._save_schedules()
        self._schedule_job(job_config)
        
        return job_id
    
    def _schedule_job(self, job_config):
        """调度单个任务"""
        job_type = job_config['type']
        
        try:
            if job_type == 'daily_report':
                self._schedule_daily_report_job(job_config)
            elif job_type == 'signal_monitoring':
                self._schedule_signal_monitoring_job(job_config)
            
            # 更新下次运行时间
            self._update_next_run_time(job_config)
            
        except Exception as e:
            print(f"调度任务失败 {job_config['id']}: {e}")
            job_config['status'] = 'error'
            job_config['error_message'] = str(e)
    
    def _schedule_daily_report_job(self, job_config):
        """调度每日报告任务"""
        time_str = job_config['time']
        
        try:
            # 解析时间字符串 (HH:MM)
            hour, minute = map(int, time_str.split(':'))
            
            # 使用schedule库设置定时任务
            schedule.every().day.at(f"{hour:02d}:{minute:02d}").do(
                self._run_daily_report_job, job_config
            ).tag(job_config['id'])
            
            print(f"已设置每日报告任务: {job_config['id']} 在 {time_str}")
            
        except Exception as e:
            raise Exception(f"设置每日报告任务失败: {e}")
    
    def _schedule_signal_monitoring_job(self, job_config):
        """调度信号监控任务"""
        interval = job_config['interval']
        
        try:
            # 解析间隔字符串 (例如: 30min, 1h, 2h)
            if interval.endswith('min'):
                minutes = int(interval[:-3])
                schedule.every(minutes).minutes.do(
                    self._run_signal_monitoring_job, job_config
                ).tag(job_config['id'])
                
            elif interval.endswith('h'):
                hours = int(interval[:-1])
                schedule.every(hours).hours.do(
                    self._run_signal_monitoring_job, job_config
                ).tag(job_config['id'])
            
            else:
                raise ValueError(f"不支持的间隔格式: {interval}")
            
            print(f"已设置信号监控任务: {job_config['id']} 每 {interval}")
            
        except Exception as e:
            raise Exception(f"设置信号监控任务失败: {e}")
    
    def _run_daily_report_job(self, job_config):
        """运行每日报告任务"""
        try:
            print(f"运行每日报告任务: {job_config['id']}")
            
            # 导入必要的模块
            from data_manager import DataManager
            from technical_analyzer import TechnicalAnalyzer
            from report_generator import ReportGenerator
            
            # 创建必要的实例
            data_manager = DataManager(self.config)
            analyzer = TechnicalAnalyzer(self.config)
            report_gen = ReportGenerator(self.config)
            
            symbols = job_config['symbols']
            
            for symbol in symbols:
                try:
                    # 获取数据
                    data = data_manager.get_stock_data(symbol, '6mo')
                    
                    # 计算技术指标
                    indicators = analyzer.calculate_indicators(data, ['ma', 'rsi', 'macf', 'bollinger'])
                    
                    # 生成报告数据
                    report_data = {
                        'symbol': symbol,
                        'data': data,
                        'indicators': indicators,
                        'signals': [],  # 可以添加信号生成
                        'generated_at': datetime.now()
                    }
                    
                    # 生成报告
                    report_filename = f"{symbol}_daily_report_{datetime.now().strftime('%Y%m%d')}.pdf"
                    report_path = os.path.join(
                        self.config.get('data_storage.reports_dir', 'reports'),
                        report_filename
                    )
                    
                    os.makedirs(os.path.dirname(report_path), exist_ok=True)
                    report_gen.generate_report(report_data, report_path, 'pdf')
                    
                    print(f"生成报告成功: {report_path}")
                    
                    # 发送邮件通知（如果启用）
                    if job_config.get('email_notification', False):
                        self._send_email_notification(symbol, report_path)
                    
                except Exception as e:
                    print(f"处理股票 {symbol} 失败: {e}")
                    continue
            
            # 更新任务状态
            job_config['last_run'] = datetime.now().isoformat()
            self._update_next_run_time(job_config)
            self._save_schedules()
            
            print(f"每日报告任务完成: {job_config['id']}")
            
        except Exception as e:
            print(f"运行每日报告任务失败: {e}")
            job_config['status'] = 'error'
            job_config['error_message'] = str(e)
            self._save_schedules()
    
    def _run_signal_monitoring_job(self, job_config):
        """运行信号监控任务"""
        try:
            print(f"运行信号监控任务: {job_config['id']}")
            
            # 导入必要的模块
            from data_manager import DataManager
            from technical_analyzer import TechnicalAnalyzer
            from signal_generator import SignalGenerator
            
            # 创建必要的实例
            data_manager = DataManager(self.config)
            analyzer = TechnicalAnalyzer(self.config)
            signal_gen = SignalGenerator(self.config)
            
            symbols = job_config['symbols']
            
            for symbol in symbols:
                try:
                    # 获取数据
                    data = data_manager.get_stock_data(symbol, '3mo')
                    
                    # 计算技术指标
                    indicators = analyzer.calculate_indicators(data, ['ma', 'rsi', 'macf'])
                    
                    # 生成信号
                    signals = signal_gen.generate_signals(data, indicators, 'multi-indicator')
                    
                    # 获取最近信号
                    recent_signals = signal_gen.get_latest_signals(data, indicators, 'multi-indicator', days=1)
                    
                    if recent_signals:
                        print(f"股票 {symbol} 发现新信号:")
                        for signal in recent_signals:
                            print(f"  {signal['date']}: {signal['type']} - {signal['details']}")
                        
                        # 发送邮件通知（如果启用）
                        if job_config.get('email_notification', False):
                            self._send_signal_notification(symbol, recent_signals)
                    
                except Exception as e:
                    print(f"监控股票 {symbol} 失败: {e}")
                    continue
            
            # 更新任务状态
            job_config['last_run'] = datetime.now().isoformat()
            self._update_next_run_time(job_config)
            self._save_schedules()
            
            print(f"信号监控任务完成: {job_config['id']}")
            
        except Exception as e:
            print(f"运行信号监控任务失败: {e}")
            job_config['status'] = 'error'
            job_config['error_message'] = str(e)
            self._save_schedules()
    
    def _update_next_run_time(self, job_config):
        """更新下次运行时间"""
        try:
            # 获取schedule库中的任务信息
            job_id = job_config['id']
            scheduled_jobs = schedule.get_jobs(job_id)
            
            if scheduled_jobs:
                next_run = scheduled_jobs[0].next_run
                job_config['next_run'] = next_run.isoformat() if next_run else None
            
        except Exception as e:
            print(f"更新下次运行时间失败: {e}")
    
    def _send_email_notification(self, symbol, report_path):
        """发送邮件通知"""
        try:
            # 这里可以实现邮件发送功能
            # 需要配置SMTP服务器信息
            email_config = self.config.get('notifications.email', {})
            
            if not email_config.get('enabled', False):
                return
            
            print(f"发送邮件通知: {symbol} 报告已生成")
            
            # 实际邮件发送代码可以在这里实现
            # 使用smtplib或其他邮件库
            
        except Exception as e:
            print(f"发送邮件通知失败: {e}")
    
    def _send_signal_notification(self, symbol, signals):
        """发送信号通知"""
        try:
            email_config = self.config.get('notifications.email', {})
            
            if not email_config.get('enabled', False):
                return
            
            print(f"发送信号通知: {symbol} 发现 {len(signals)} 个新信号")
            
            # 实际邮件发送代码可以在这里实现
            
        except Exception as e:
            print(f"发送信号通知失败: {e}")
    
    def list_schedules(self):
        """列出所有定时任务"""
        schedules = []
        
        for job_id, job_config in self.jobs.items():
            schedules.append({
                'id': job_id,
                'type': job_config['type'],
                'symbols': job_config['symbols'],
                'schedule': job_config['schedule'],
                'status': job_config['status'],
                'last_run': job_config.get('last_run'),
                'next_run': job_config.get('next_run'),
                'created_at': job_config['created_at']
            })
        
        return schedules
    
    def remove_schedule(self, job_id):
        """移除定时任务"""
        if job_id in self.jobs:
            # 从schedule库中移除
            schedule.clear(job_id)
            
            # 从配置中移除
            del self.jobs[job_id]
            self._save_schedules()
            
            return True
        
        return False
    
    def start_scheduler(self):
        """启动调度器"""
        if self.running:
            print("调度器已在运行")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_scheduler)
        self.thread.daemon = True
        self.thread.start()
        
        print("调度器已启动")
    
    def stop_scheduler(self):
        """停止调度器"""
        if not self.running:
            print("调度器未运行")
            return
        
        self.running = False
        
        if self.thread:
            self.thread.join(timeout=5)
        
        print("调度器已停止")
    
    def _run_scheduler(self):
        """运行调度器主循环"""
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # 每分钟检查一次
            except Exception as e:
                print(f"调度器运行错误: {e}")
                time.sleep(60)
    
    def get_scheduler_status(self):
        """获取调度器状态"""
        return {
            'running': self.running,
            'total_jobs': len(self.jobs),
            'active_jobs': len([j for j in self.jobs.values() if j['status'] == 'active']),
            'error_jobs': len([j for j in self.jobs.values() if j['status'] == 'error'])
        }
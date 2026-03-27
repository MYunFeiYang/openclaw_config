#!/usr/bin/env python3
"""
系统监控和异常处理模块
提供系统健康检查、异常恢复、告警机制
"""

import os
import sys
import json
import time
import logging
import traceback
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any
import psutil
import signal


class SystemMonitor:
    """系统监控器"""
    
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or self._default_base_dir())
        self.logs_dir = self.base_dir / "logs"
        self.data_dir = self.base_dir / "data"
        self.reports_dir = self.base_dir / "reports"
        
        # 确保目录存在
        for dir_path in [self.logs_dir, self.data_dir, self.reports_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # 监控配置
        self.config = {
            'max_memory_percent': 85,       # 最大内存使用率 85%
            'max_cpu_percent': 80,          # 最大CPU使用率 80%
            'max_disk_usage_percent': 85,   # 最大磁盘使用率 85%
            'max_response_time_seconds': 300,  # 最大响应时间 5分钟
            'max_consecutive_failures': 3,   # 最大连续失败次数
            'health_check_interval_seconds': 60,  # 健康检查间隔 1分钟
        }
        
        # 状态记录
        self.status_file = self.data_dir / "system_status.json"
        self.error_log = self.logs_dir / f"system_errors_{datetime.now().strftime('%Y%m%d')}.log"
        
        # 设置监控日志
        self.logger = self._setup_monitor_logger()
        
        # 系统状态
        self.is_healthy = True
        self.consecutive_failures = 0
        self.last_health_check = None
        
        # 注册信号处理
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
    
    def _default_base_dir(self) -> str:
        """获取默认基础目录"""
        return os.environ.get(
            "STOCK_SYSTEM_ROOT",
            str(Path(__file__).resolve().parent.parent),
        )
    
    def _setup_monitor_logger(self) -> logging.Logger:
        """设置监控日志记录器"""
        logger = logging.getLogger('SystemMonitor')
        logger.setLevel(logging.INFO)
        
        # 避免重复添加处理器
        if logger.handlers:
            return logger
        
        # 文件处理器
        file_handler = logging.FileHandler(self.error_log, encoding='utf-8')
        file_handler.setLevel(logging.WARNING)
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # 格式化器
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # 添加处理器
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def _signal_handler(self, signum, frame):
        """信号处理"""
        self.logger.info(f"接收到信号 {signum}，开始优雅关闭...")
        self.shutdown()
        sys.exit(0)
    
    def check_system_health(self) -> Dict[str, Any]:
        """检查系统健康状态"""
        
        try:
            health_status = {
                'timestamp': datetime.now().isoformat(),
                'overall_status': 'healthy',
                'checks': {},
                'alerts': [],
                'recommendations': []
            }
            
            # 内存检查
            memory_info = self._check_memory()
            health_status['checks']['memory'] = memory_info
            if not memory_info['healthy']:
                health_status['overall_status'] = 'warning'
                health_status['alerts'].append(f"内存使用率过高: {memory_info['usage_percent']:.1f}%")
            
            # CPU检查
            cpu_info = self._check_cpu()
            health_status['checks']['cpu'] = cpu_info
            if not cpu_info['healthy']:
                health_status['overall_status'] = 'warning'
                health_status['alerts'].append(f"CPU使用率过高: {cpu_info['usage_percent']:.1f}%")
            
            # 磁盘检查
            disk_info = self._check_disk()
            health_status['checks']['disk'] = disk_info
            if not disk_info['healthy']:
                health_status['overall_status'] = 'critical'
                health_status['alerts'].append(f"磁盘使用率过高: {disk_info['usage_percent']:.1f}%")
            
            # 进程检查
            process_info = self._check_processes()
            health_status['checks']['processes'] = process_info
            
            # 数据文件检查
            data_info = self._check_data_files()
            health_status['checks']['data_files'] = data_info
            if not data_info['healthy']:
                health_status['overall_status'] = 'warning'
                health_status['alerts'].extend(data_info['issues'])
            
            # 日志文件检查
            log_info = self._check_log_files()
            health_status['checks']['log_files'] = log_info
            if not log_info['healthy']:
                health_status['alerts'].extend(log_info['issues'])
            
            # 生成建议
            health_status['recommendations'] = self._generate_health_recommendations(health_status)
            
            # 更新系统状态
            self.is_healthy = health_status['overall_status'] == 'healthy'
            self.last_health_check = datetime.now()
            
            # 保存状态
            self._save_health_status(health_status)
            
            return health_status
            
        except Exception as e:
            self.logger.error(f"健康检查异常: {e}")
            self.logger.error(traceback.format_exc())
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_status': 'error',
                'error': str(e),
                'checks': {},
                'alerts': ['系统健康检查失败'],
                'recommendations': ['请检查系统日志获取详细信息']
            }
    
    def _check_memory(self) -> Dict[str, Any]:
        """检查内存使用情况"""
        try:
            memory = psutil.virtual_memory()
            usage_percent = memory.percent
            available_mb = memory.available / 1024 / 1024
            total_mb = memory.total / 1024 / 1024
            
            healthy = usage_percent < self.config['max_memory_percent']
            
            return {
                'healthy': healthy,
                'usage_percent': usage_percent,
                'available_mb': round(available_mb, 1),
                'total_mb': round(total_mb, 1),
                'threshold_percent': self.config['max_memory_percent']
            }
        except Exception as e:
            self.logger.error(f"内存检查失败: {e}")
            return {
                'healthy': False,
                'error': str(e),
                'usage_percent': 0,
                'available_mb': 0,
                'total_mb': 0
            }
    
    def _check_cpu(self) -> Dict[str, Any]:
        """检查CPU使用情况"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            healthy = cpu_percent < self.config['max_cpu_percent']
            
            return {
                'healthy': healthy,
                'usage_percent': cpu_percent,
                'cpu_count': cpu_count,
                'threshold_percent': self.config['max_cpu_percent']
            }
        except Exception as e:
            self.logger.error(f"CPU检查失败: {e}")
            return {
                'healthy': False,
                'error': str(e),
                'usage_percent': 0,
                'cpu_count': 1
            }
    
    def _check_disk(self) -> Dict[str, Any]:
        """检查磁盘使用情况"""
        try:
            disk_usage = psutil.disk_usage(str(self.base_dir))
            usage_percent = (disk_usage.used / disk_usage.total) * 100
            free_gb = disk_usage.free / 1024 / 1024 / 1024
            total_gb = disk_usage.total / 1024 / 1024 / 1024
            
            healthy = usage_percent < self.config['max_disk_usage_percent']
            
            return {
                'healthy': healthy,
                'usage_percent': usage_percent,
                'free_gb': round(free_gb, 1),
                'total_gb': round(total_gb, 1),
                'threshold_percent': self.config['max_disk_usage_percent']
            }
        except Exception as e:
            self.logger.error(f"磁盘检查失败: {e}")
            return {
                'healthy': False,
                'error': str(e),
                'usage_percent': 100,
                'free_gb': 0,
                'total_gb': 0
            }
    
    def _check_processes(self) -> Dict[str, Any]:
        """检查系统进程"""
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    proc_info = proc.info
                    if 'python' in proc_info['name'].lower() or 'stock' in proc_info['name'].lower():
                        processes.append({
                            'pid': proc_info['pid'],
                            'name': proc_info['name'],
                            'cpu_percent': proc_info['cpu_percent'],
                            'memory_percent': proc_info['memory_percent']
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            return {
                'count': len(processes),
                'processes': processes,
                'healthy': len(processes) > 0
            }
        except Exception as e:
            self.logger.error(f"进程检查失败: {e}")
            return {
                'healthy': False,
                'error': str(e),
                'count': 0,
                'processes': []
            }
    
    def _check_data_files(self) -> Dict[str, Any]:
        """检查数据文件状态"""
        try:
            issues = []
            
            # 检查预测文件
            prediction_files = list(self.data_dir.glob("predictions_*.json"))
            if not prediction_files:
                issues.append("未找到预测数据文件")
            else:
                latest_prediction = max(prediction_files, key=lambda x: x.stat().st_mtime)
                file_age = datetime.now() - datetime.fromtimestamp(latest_prediction.stat().st_mtime)
                if file_age > timedelta(hours=24):
                    issues.append(f"最新预测文件过旧: {file_age.total_seconds()/3600:.1f}小时前")
            
            # 检查验证文件
            validation_files = list(self.data_dir.glob("validation_metrics_*.json"))
            if not validation_files:
                issues.append("未找到验证数据文件")
            else:
                latest_validation = max(validation_files, key=lambda x: x.stat().st_mtime)
                file_age = datetime.now() - datetime.fromtimestamp(latest_validation.stat().st_mtime)
                if file_age > timedelta(hours=48):
                    issues.append(f"最新验证文件过旧: {file_age.total_seconds()/3600:.1f}小时前")
            
            # 检查准确率历史
            accuracy_file = self.data_dir / "accuracy_history.json"
            if not accuracy_file.exists():
                issues.append("未找到准确率历史文件")
            
            return {
                'healthy': len(issues) == 0,
                'prediction_files': len(prediction_files),
                'validation_files': len(validation_files),
                'issues': issues
            }
            
        except Exception as e:
            self.logger.error(f"数据文件检查失败: {e}")
            return {
                'healthy': False,
                'error': str(e),
                'prediction_files': 0,
                'validation_files': 0,
                'issues': ['数据文件检查失败']
            }
    
    def _check_log_files(self) -> Dict[str, Any]:
        """检查日志文件"""
        try:
            issues = []
            
            # 检查错误日志
            error_logs = list(self.logs_dir.glob("system_errors_*.log"))
            if error_logs:
                latest_error_log = max(error_logs, key=lambda x: x.stat().st_mtime)
                if latest_error_log.stat().st_size > 10 * 1024 * 1024:  # 10MB
                    issues.append(f"错误日志文件过大: {latest_error_log.name}")
                
                # 检查最近的错误
                with open(latest_error_log, 'r', encoding='utf-8') as f:
                    recent_errors = f.readlines()[-10:]  # 最近10行
                    if len(recent_errors) > 5:
                        issues.append(f"最近错误日志较多: {len(recent_errors)}条")
            
            # 检查运行日志
            run_logs = list(self.logs_dir.glob("closed_loop_*.log"))
            if run_logs:
                latest_run_log = max(run_logs, key=lambda x: x.stat().st_mtime)
                file_age = datetime.now() - datetime.fromtimestamp(latest_run_log.stat().st_mtime)
                if file_age > timedelta(hours=6):
                    issues.append(f"最新运行日志过旧: {file_age.total_seconds()/3600:.1f}小时前")
            
            return {
                'healthy': len(issues) == 0,
                'error_logs': len(error_logs),
                'run_logs': len(run_logs),
                'issues': issues
            }
            
        except Exception as e:
            self.logger.error(f"日志文件检查失败: {e}")
            return {
                'healthy': False,
                'error': str(e),
                'error_logs': 0,
                'run_logs': 0,
                'issues': ['日志文件检查失败']
            }
    
    def _generate_health_recommendations(self, health_status: Dict[str, Any]) -> List[str]:
        """生成健康建议"""
        
        recommendations = []
        
        if health_status['overall_status'] == 'healthy':
            recommendations.append("✅ 系统运行正常，继续保持")
            return recommendations
        
        # 内存相关建议
        memory_info = health_status['checks'].get('memory', {})
        if not memory_info.get('healthy'):
            recommendations.append("🧠 内存使用率过高，建议重启系统或优化内存使用")
        
        # CPU相关建议
        cpu_info = health_status['checks'].get('cpu', {})
        if not cpu_info.get('healthy'):
            recommendations.append("⚡ CPU使用率过高，建议检查是否有异常进程")
        
        # 磁盘相关建议
        disk_info = health_status['checks'].get('disk', {})
        if not disk_info.get('healthy'):
            recommendations.append("💾 磁盘空间不足，建议清理日志和临时文件")
        
        # 数据文件相关建议
        data_info = health_status['checks'].get('data_files', {})
        if not data_info.get('healthy'):
            recommendations.append("📊 数据文件异常，建议检查系统运行状态")
        
        # 通用建议
        recommendations.extend([
            "🔍 建议查看详细日志获取更多信息",
            "🔄 如问题持续，考虑重启系统",
            "📞 严重问题请联系技术支持"
        ])
        
        return recommendations
    
    def _save_health_status(self, health_status: Dict[str, Any]):
        """保存健康状态"""
        try:
            with open(self.status_file, 'w', encoding='utf-8') as f:
                json.dump(health_status, f, ensure_ascii=False, indent=2)
        except Exception as e:
            self.logger.error(f"保存健康状态失败: {e}")
    
    def monitor_with_recovery(self, func: Callable, *args, **kwargs) -> Any:
        """带自动恢复的监控执行"""
        
        max_retries = self.config['max_consecutive_failures']
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # 执行前健康检查
                health_status = self.check_system_health()
                if health_status['overall_status'] == 'critical':
                    self.logger.error("系统处于严重状态，暂停执行")
                    return None
                
                # 执行函数
                result = func(*args, **kwargs)
                
                # 重置失败计数
                self.consecutive_failures = 0
                return result
                
            except Exception as e:
                self.consecutive_failures += 1
                retry_count += 1
                
                self.logger.error(f"函数执行失败 (尝试 {retry_count}/{max_retries}): {e}")
                self.logger.error(traceback.format_exc())
                
                if retry_count < max_retries:
                    wait_time = min(60, 2 ** retry_count)  # 指数退避，最大60秒
                    self.logger.info(f"等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
                else:
                    self.logger.error("达到最大重试次数，放弃执行")
                    
                    # 记录严重错误
                    self._log_critical_error(func.__name__, e, traceback.format_exc())
                    
                    # 发送告警（可以扩展为邮件、短信等）
                    self._send_alert(f"函数 {func.__name__} 连续失败 {max_retries} 次")
        
        return None
    
    def _log_critical_error(self, func_name: str, error: Exception, traceback_str: str):
        """记录严重错误"""
        try:
            critical_log = self.logs_dir / f"critical_errors_{datetime.now().strftime('%Y%m%d')}.log"
            with open(critical_log, 'a', encoding='utf-8') as f:
                f.write(f"\n{'='*60}\n")
                f.write(f"严重错误记录 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"函数: {func_name}\n")
                f.write(f"错误: {str(error)}\n")
                f.write(f"追踪信息:\n{traceback_str}\n")
                f.write(f"{'='*60}\n")
        except Exception as e:
            self.logger.error(f"记录严重错误失败: {e}")
    
    def _send_alert(self, message: str):
        """发送告警（基础版本，可扩展）"""
        self.logger.warning(f"🚨 系统告警: {message}")
        # 这里可以扩展为发送邮件、短信、企业微信等
        
        # 保存告警记录
        try:
            alert_file = self.data_dir / "alerts.json"
            alerts = []
            if alert_file.exists():
                with open(alert_file, 'r', encoding='utf-8') as f:
                    alerts = json.load(f)
            
            alerts.append({
                'timestamp': datetime.now().isoformat(),
                'message': message,
                'severity': 'high' if '连续失败' in message else 'medium'
            })
            
            # 只保留最近100条告警
            alerts = alerts[-100:]
            
            with open(alert_file, 'w', encoding='utf-8') as f:
                json.dump(alerts, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            self.logger.error(f"保存告警记录失败: {e}")
    
    def shutdown(self):
        """优雅关闭"""
        self.logger.info("正在关闭系统监控...")
        
        # 保存最终状态
        final_status = {
            'timestamp': datetime.now().isoformat(),
            'status': 'shutdown',
            'consecutive_failures': self.consecutive_failures,
            'last_health_check': self.last_health_check.isoformat() if self.last_health_check else None
        }
        
        self._save_health_status(final_status)
        self.logger.info("系统监控已关闭")
    
    def get_system_summary(self) -> Dict[str, Any]:
        """获取系统摘要"""
        try:
            # 加载最新状态
            if self.status_file.exists():
                with open(self.status_file, 'r', encoding='utf-8') as f:
                    latest_status = json.load(f)
            else:
                latest_status = None
            
            # 统计文件
            prediction_files = list(self.data_dir.glob("predictions_*.json"))
            validation_files = list(self.data_dir.glob("validation_metrics_*.json"))
            report_files = list(self.reports_dir.glob("accuracy_report_*.txt"))
            
            # 计算系统运行时间
            uptime_info = self._get_uptime_info()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_status': latest_status.get('overall_status', 'unknown') if latest_status else 'unknown',
                'is_healthy': self.is_healthy,
                'consecutive_failures': self.consecutive_failures,
                'uptime': uptime_info,
                'file_statistics': {
                    'prediction_files': len(prediction_files),
                    'validation_files': len(validation_files),
                    'report_files': len(report_files),
                    'total_data_size_mb': self._calculate_total_data_size()
                },
                'latest_status': latest_status,
                'monitor_config': self.config
            }
            
        except Exception as e:
            self.logger.error(f"获取系统摘要失败: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'is_healthy': False,
                'overall_status': 'error'
            }
    
    def _get_uptime_info(self) -> Dict[str, Any]:
        """获取系统运行时间信息"""
        try:
            boot_time = psutil.boot_time()
            uptime_seconds = time.time() - boot_time
            
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            
            return {
                'days': days,
                'hours': hours,
                'minutes': minutes,
                'total_hours': round(uptime_seconds / 3600, 1),
                'boot_time': datetime.fromtimestamp(boot_time).isoformat()
            }
        except Exception as e:
            self.logger.error(f"获取运行时间失败: {e}")
            return {'error': str(e)}
    
    def _calculate_total_data_size(self) -> float:
        """计算总数据大小（MB）"""
        try:
            total_size = 0
            for file_path in self.data_dir.rglob("*"):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
            
            return round(total_size / 1024 / 1024, 1)
        except Exception as e:
            self.logger.error(f"计算数据大小失败: {e}")
            return 0.0


def main():
    """主函数 - 用于测试"""
    monitor = SystemMonitor()
    
    print("【系统监控测试】")
    print("=" * 50)
    
    # 执行健康检查
    health_status = monitor.check_system_health()
    print(f"系统状态: {health_status['overall_status']}")
    print(f"健康检查时间: {health_status['timestamp']}")
    
    if health_status['alerts']:
        print("⚠️  告警信息:")
        for alert in health_status['alerts']:
            print(f"  - {alert}")
    
    if health_status['recommendations']:
        print("💡 建议:")
        for rec in health_status['recommendations']:
            print(f"  - {rec}")
    
    # 获取系统摘要
    summary = monitor.get_system_summary()
    print(f"\n系统摘要:")
    print(f"  健康状态: {'✅ 健康' if summary['is_healthy'] else '❌ 异常'}")
    print(f"  连续失败: {summary['consecutive_failures']}")
    print(f"  数据文件: {summary['file_statistics']['prediction_files']} 预测, "
          f"{summary['file_statistics']['validation_files']} 验证, "
          f"{summary['file_statistics']['report_files']} 报告")
    
    print("\n监控测试完成！")


if __name__ == "__main__":
    main()
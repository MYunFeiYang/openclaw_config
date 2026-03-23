#!/usr/bin/env python3
"""
股票预测系统启动器和监控器
管理系统启动、状态监控和性能追踪
"""

import os
import sys
import json
import time
import psutil
import signal
from datetime import datetime
from pathlib import Path
import subprocess
from typing import Dict, List, Optional

class StockPredictionMonitor:
    """股票预测系统监控器"""
    
    def __init__(self):
        self.system_dir = Path("/Users/thinkway/.openclaw/workspace/stock_system")
        self.log_dir = self.system_dir / "logs"
        self.pid_dir = self.system_dir / "pids"
        self.report_dir = self.system_dir / "reports"
        
        # 创建必要的目录
        for dir_path in [self.log_dir, self.pid_dir, self.report_dir]:
            dir_path.mkdir(exist_ok=True)
        
        self.processes = {}
        self.monitoring = False
        
        # 系统配置
        self.config = {
            "prediction_intervals": {
                "morning": "08:30",
                "closing": "17:00", 
                "validation": "20:00",
                "analysis": "21:00",
                "weekly": "sunday_20:00"
            },
            "accuracy_targets": {
                "direction_accuracy": 75.0,
                "magnitude_accuracy": 65.0,
                "confidence_calibration": 75.0
            },
            "alert_thresholds": {
                "accuracy_drop": 10.0,  # 准确率下降超过10%时报警
                "service_down": 30,      # 服务停止超过30分钟报警
                "prediction_delay": 15   # 预测延迟超过15分钟报警
            }
        }
    
    def start_automation_system(self) -> bool:
        """启动自动化系统"""
        try:
            print("🚀 启动股票预测自动化系统...")
            
            # 检查是否已在运行
            if self.is_process_running("prediction_automation.py"):
                print("⚠️  自动化系统已在运行")
                return True
            
            # 启动自动化脚本
            cmd = [sys.executable, str(self.system_dir / "prediction_automation.py")]
            
            # 使用nohup在后台运行
            with open(self.log_dir / "automation.log", "a") as log_file:
                process = subprocess.Popen(
                    cmd,
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    cwd=str(self.system_dir),
                    preexec_fn=os.setsid  # 创建新进程组
                )
            
            # 保存PID
            pid_file = self.pid_dir / "automation.pid"
            with open(pid_file, "w") as f:
                f.write(str(process.pid))
            
            print(f"✅ 自动化系统启动成功 (PID: {process.pid})")
            return True
            
        except Exception as e:
            print(f"❌ 启动自动化系统失败: {e}")
            return False
    
    def stop_automation_system(self) -> bool:
        """停止自动化系统"""
        try:
            print("🛑 停止股票预测自动化系统...")
            
            pid_file = self.pid_dir / "automation.pid"
            if not pid_file.exists():
                print("⚠️  没有找到运行中的自动化系统")
                return True
            
            # 读取PID
            with open(pid_file, "r") as f:
                pid = int(f.read().strip())
            
            # 终止进程
            try:
                os.killpg(os.getpgid(pid), signal.SIGTERM)
                print(f"✅ 自动化系统已停止 (PID: {pid})")
            except ProcessLookupError:
                print(f"⚠️  进程 {pid} 不存在")
            
            # 删除PID文件
            pid_file.unlink()
            return True
            
        except Exception as e:
            print(f"❌ 停止自动化系统失败: {e}")
            return False
    
    def is_process_running(self, script_name: str) -> bool:
        """检查进程是否正在运行"""
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    cmdline = proc.info.get('cmdline', [])
                    if cmdline and any(script_name in cmd for cmd in cmdline):
                        return True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            return False
        except Exception:
            return False
    
    def get_system_status(self) -> Dict:
        """获取系统状态"""
        status = {
            "timestamp": datetime.now().isoformat(),
            "automation_system": {
                "running": self.is_process_running("prediction_automation.py"),
                "pid": None,
                "uptime": None
            },
            "recent_predictions": self.get_recent_predictions(),
            "accuracy_metrics": self.get_accuracy_metrics(),
            "system_health": "unknown"
        }
        
        # 获取PID和运行时间
        pid_file = self.pid_dir / "automation.pid"
        if pid_file.exists() and status["automation_system"]["running"]:
            try:
                with open(pid_file, "r") as f:
                    pid = int(f.read().strip())
                status["automation_system"]["pid"] = pid
                
                # 计算运行时间
                proc = psutil.Process(pid)
                create_time = datetime.fromtimestamp(proc.create_time())
                uptime = datetime.now() - create_time
                status["automation_system"]["uptime"] = str(uptime)
            except Exception:
                pass
        
        # 评估系统健康状态
        status["system_health"] = self.evaluate_system_health(status)
        
        return status
    
    def get_recent_predictions(self) -> List[Dict]:
        """获取最近的预测记录"""
        try:
            # 这里应该查询数据库，现在用模拟数据
            return [
                {
                    "time": (datetime.now() - timedelta(hours=2)).isoformat(),
                    "type": "morning",
                    "stocks": 5,
                    "status": "completed"
                },
                {
                    "time": (datetime.now() - timedelta(hours=12)).isoformat(),
                    "type": "closing", 
                    "stocks": 10,
                    "status": "completed"
                }
            ]
        except Exception:
            return []
    
    def get_accuracy_metrics(self) -> Dict:
        """获取准确性指标"""
        try:
            # 这里应该查询数据库，现在用模拟数据
            return {
                "direction_accuracy": 68.5,
                "magnitude_accuracy": 52.3,
                "confidence_calibration": 71.2,
                "total_predictions": 156,
                "last_updated": (datetime.now() - timedelta(minutes=30)).isoformat()
            }
        except Exception:
            return {}
    
    def evaluate_system_health(self, status: Dict) -> str:
        """评估系统健康状态"""
        
        if not status["automation_system"]["running"]:
            return "stopped"
        
        # 检查准确性指标
        metrics = status.get("accuracy_metrics", {})
        if metrics:
            direction_acc = metrics.get("direction_accuracy", 0)
            if direction_acc < 50:
                return "poor_performance"
            elif direction_acc < self.config["accuracy_targets"]["direction_accuracy"]:
                return "needs_improvement"
        
        # 检查最近活动
        recent_predictions = status.get("recent_predictions", [])
        if recent_predictions:
            last_prediction_time = datetime.fromisoformat(recent_predictions[0]["time"])
            time_since_last = datetime.now() - last_prediction_time
            if time_since_last > timedelta(hours=6):
                return "inactive"
        
        return "healthy"
    
    def generate_status_report(self) -> str:
        """生成状态报告"""
        
        status = self.get_system_status()
        
        report_lines = []
        report_lines.append("【股票预测系统状态报告】")
        report_lines.append("=" * 60)
        report_lines.append(f"报告时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("=" * 60)
        
        # 系统状态
        auto_status = status["automation_system"]
        health_status = {
            "healthy": "🟢 健康",
            "needs_improvement": "🟡 需要改进", 
            "poor_performance": "🔴 性能较差",
            "inactive": "⚠️  不活跃",
            "stopped": "⭕ 已停止"
        }
        
        report_lines.append(f"\n【系统状态】 {health_status.get(status['system_health'], '❓ 未知')}")
        report_lines.append(f"自动化系统: {'🟢 运行中' if auto_status['running'] else '🔴 已停止'}")
        
        if auto_status["running"]:
            report_lines.append(f"进程PID: {auto_status.get('pid', '未知')}")
            if auto_status.get("uptime"):
                report_lines.append(f"运行时间: {auto_status['uptime']}")
        
        # 准确性指标
        metrics = status.get("accuracy_metrics", {})
        if metrics:
            report_lines.append(f"\n【准确性指标】")
            report_lines.append(f"• 方向准确率: {metrics.get('direction_accuracy', 0):.1f}% "
                              f"({'✅' if metrics.get('direction_accuracy', 0) >= 75 else '❌'} 目标: 75%)")
            report_lines.append(f"• 幅度准确率: {metrics.get('magnitude_accuracy', 0):.1f}% "
                              f"({'✅' if metrics.get('magnitude_accuracy', 0) >= 65 else '❌'} 目标: 65%)")
            report_lines.append(f"• 信心校准: {metrics.get('confidence_calibration', 0):.1f}% "
                              f"({'✅' if metrics.get('confidence_calibration', 0) >= 75 else '❌'} 目标: 75%)")
            report_lines.append(f"• 总预测数: {metrics.get('total_predictions', 0)}")
        
        # 最近活动
        recent = status.get("recent_predictions", [])
        if recent:
            report_lines.append(f"\n【最近活动】")
            for i, pred in enumerate(recent[:3], 1):
                pred_time = datetime.fromisoformat(pred["time"]).strftime("%m月%d日 %H:%M")
                report_lines.append(f"{i}. {pred_time} - {pred['type']}预测 ({pred['stocks']}只股票)")
        
        # 建议和行动
        report_lines.append(f"\n【建议行动】")
        if status["system_health"] == "stopped":
            report_lines.append("• 建议启动自动化系统")
        elif status["system_health"] == "poor_performance":
            report_lines.append("• 模型性能较差，建议检查参数配置")
            report_lines.append("• 考虑重新训练或调整模型权重")
        elif status["system_health"] == "needs_improvement":
            report_lines.append("• 模型需要改进，建议优化预测算法")
            report_lines.append("• 检查最近的市场变化是否影响模型")
        elif status["system_health"] == "inactive":
            report_lines.append("• 系统不活跃，检查定时任务配置")
        else:
            report_lines.append("• 系统运行正常，继续保持监控")
        
        report_lines.append(f"\n🎯 终极目标: 维持75%+预测准确率")
        
        return "\n".join(report_lines)
    
    def save_system_config(self):
        """保存系统配置"""
        config_file = self.system_dir / "system_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)
    
    def monitor_loop(self):
        """监控循环"""
        
        print("🔍 开始系统监控...")
        self.monitoring = True
        
        while self.monitoring:
            try:
                # 生成状态报告
                report = self.generate_status_report()
                
                # 保存报告
                report_file = self.report_dir / f"status_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
                with open(report_file, 'w', encoding='utf-8') as f:
                    f.write(report)
                
                print(f"📊 状态报告已生成: {report_file}")
                
                # 检查是否需要报警
                self.check_alerts()
                
                # 每小时检查一次
                time.sleep(3600)
                
            except KeyboardInterrupt:
                print("\n🛑 监控被用户停止")
                break
                
            except Exception as e:
                print(f"❌ 监控循环错误: {e}")
                time.sleep(300)  # 出错后等待5分钟继续
    
    def check_alerts(self):
        """检查报警条件"""
        
        status = self.get_system_status()
        
        # 检查服务停止
        if not status["automation_system"]["running"]:
            self.send_alert("自动化系统已停止运行")
        
        # 检查性能下降
        metrics = status.get("accuracy_metrics", {})
        if metrics:
            direction_acc = metrics.get("direction_accuracy", 0)
            if direction_acc < 60:  # 低于60%时报警
                self.send_alert(f"方向准确率过低: {direction_acc:.1f}%")
    
    def send_alert(self, message: str):
        """发送报警"""
        
        try:
            # 这里应该集成实际的消息发送系统
            alert_message = f"【股票预测系统报警】\n{message}\n时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            # 保存报警记录
            alert_file = self.log_dir / f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(alert_file, 'w', encoding='utf-8') as f:
                f.write(alert_message)
            
            print(f"🚨 报警: {message}")
            
        except Exception as e:
            print(f"❌ 发送报警失败: {e}")
    
    def stop_monitoring(self):
        """停止监控"""
        self.monitoring = False

def main():
    """主函数"""
    
    print("【股票预测系统管理器】")
    print("=" * 60)
    print("可用命令:")
    print("  start  - 启动自动化系统")
    print("  stop   - 停止自动化系统")
    print("  status - 查看系统状态")
    print("  monitor- 启动监控器")
    print("  help   - 显示帮助信息")
    print("=" * 60)
    
    monitor = StockPredictionMonitor()
    
    if len(sys.argv) < 2:
        print("❌ 请提供命令参数")
        return
    
    command = sys.argv[1].lower()
    
    if command == "start":
        monitor.start_automation_system()
        
    elif command == "stop":
        monitor.stop_automation_system()
        
    elif command == "status":
        report = monitor.generate_status_report()
        print(report)
        
    elif command == "monitor":
        try:
            monitor.monitor_loop()
        except KeyboardInterrupt:
            monitor.stop_monitoring()
            print("\n🛑 监控已停止")
            
    elif command == "help":
        print("系统管理器帮助:")
        print("• 使用 'start' 启动自动化预测系统")
        print("• 使用 'stop' 停止自动化预测系统")
        print("• 使用 'status' 查看系统当前状态")
        print("• 使用 'monitor' 启动持续监控")
        print("• 按 Ctrl+C 可以停止监控")
        
    else:
        print(f"❌ 未知命令: {command}")
        print("使用 'help' 查看可用命令")

if __name__ == "__main__":
    main()
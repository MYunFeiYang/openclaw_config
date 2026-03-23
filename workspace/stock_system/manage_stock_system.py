#!/usr/bin/env python3
"""
OpenClaw股票系统管理器 - 集成OpenClaw Cron系统
提供统一的项目管理和OpenClaw定时任务管理
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path

class StockSystemManager:
    """股票系统管理器"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.original_dir = self.base_dir / "original"
        self.refactored_dir = self.base_dir / "refactored"
        self.configs_dir = self.base_dir / "configs"
        self.data_dir = self.base_dir / "data"
        self.logs_dir = self.base_dir / "logs"
        self.reports_dir = self.base_dir / "reports"
        self.scripts_dir = self.base_dir / "scripts"
        
    def show_status(self):
        """显示系统状态"""
        print("📊 A股分析系统状态")
        print("=" * 50)
        
        # 检查目录结构
        directories = {
            "原始版本": self.original_dir,
            "重构版本": self.refactored_dir,
            "配置文件": self.configs_dir,
            "历史数据": self.data_dir,
            "日志文件": self.logs_dir,
            "输出报告": self.reports_dir,
            "脚本工具": self.scripts_dir
        }
        
        for name, path in directories.items():
            status = "✅" if path.exists() else "❌"
            file_count = len(list(path.glob("*"))) if path.exists() else 0
            print(f"{status} {name}: {file_count} 个文件")
        
        # 检查主要程序
        main_programs = {
            "精修版": self.refactored_dir / "refined_stock_system.py",
            "简洁版": self.refactored_dir / "clean_stock_system.py",
            "原始版": self.original_dir / "a_stock_final_system.py"
        }
        
        print("\n📁 主要程序状态:")
        for name, path in main_programs.items():
            status = "✅" if path.exists() else "❌"
            print(f"{status} {name}: {path.name}")
        
        # 检查OpenClaw定时任务
        print("\n⏰ OpenClaw定时任务:")
        self.check_openclaw_cron()
    
    def check_openclaw_cron(self):
        """检查OpenClaw定时任务"""
        try:
            # 使用OpenClaw的cron API
            result = subprocess.run(
                ["openclaw", "cron", "list"],
                capture_output=True,
                text=True,
                cwd=str(self.base_dir)
            )
            
            if result.returncode == 0:
                try:
                    cron_data = json.loads(result.stdout)
                    jobs = cron_data.get("jobs", [])
                    
                    if jobs:
                        stock_jobs = [job for job in jobs if "股票" in job.get("name", "")]
                        print(f"✅ 已配置 {len(stock_jobs)} 个股票相关定时任务")
                        
                        for job in stock_jobs:
                            name = job.get("name", "未知任务")
                            schedule = job.get("schedule", {})
                            expr = schedule.get("expr", "")
                            next_run = job.get("state", {}).get("nextRunAtMs", 0)
                            
                            if next_run:
                                next_run_time = datetime.fromtimestamp(next_run / 1000).strftime("%Y-%m-%d %H:%M")
                                print(f"   📅 {name}: {expr} (下次: {next_run_time})")
                    else:
                        print("⚠️ 暂无OpenClaw定时任务")
                        
                except json.JSONDecodeError:
                    print("⚠️ 无法解析OpenClaw定时任务数据")
            else:
                print("⚠️ 无法获取OpenClaw定时任务信息")
                
        except FileNotFoundError:
            print("❌ OpenClaw命令未找到，请确保OpenClaw已正确安装")
        except Exception as e:
            print(f"❌ 检查定时任务时出错: {e}")
    
    def run_system(self, version="refined", save_report=True):
        """运行指定版本的系统"""
        
        if version == "refined":
            script_path = self.refactored_dir / "refined_stock_system.py"
        elif version == "clean":
            script_path = self.refactored_dir / "clean_stock_system.py"
        elif version == "original":
            script_path = self.original_dir / "a_stock_final_system.py"
        else:
            print(f"❌ 未知版本: {version}")
            return False
        
        if not script_path.exists():
            print(f"❌ 脚本不存在: {script_path}")
            return False
        
        print(f"🚀 运行 {version} 版本...")
        print(f"📍 脚本路径: {script_path}")
        
        try:
            # 运行脚本
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=str(script_path.parent),
                capture_output=True,
                text=True,
                encoding='utf-8'
            )
            
            if result.returncode == 0:
                print("✅ 运行成功!")
                print("=" * 50)
                print(result.stdout)
                
                if save_report:
                    self._save_report(result.stdout, version)
                
                return True
            else:
                print("❌ 运行失败!")
                print("错误信息:")
                print(result.stderr)
                return False
                
        except Exception as e:
            print(f"❌ 运行出错: {e}")
            return False
    
    def _save_report(self, output, version):
        """保存运行报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{version}_report_{timestamp}.txt"
        filepath = self.reports_dir / filename
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"A股分析系统报告\n")
                f.write(f"版本: {version}\n")
                f.write(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("=" * 50 + "\n")
                f.write(output)
            
            print(f"💾 报告已保存: {filepath}")
        except Exception as e:
            print(f"⚠️ 保存报告失败: {e}")
    
    def setup_openclaw_cron(self):
        """设置OpenClaw定时任务"""
        print("🔧 设置OpenClaw定时任务...")
        print("=" * 50)
        
        # 定义定时任务
        cron_jobs = [
            {
                "name": "股票早盘分析",
                "schedule": "0 8 * * 1-5",
                "description": "工作日早上8点执行A股早盘分析"
            },
            {
                "name": "股票午盘分析", 
                "schedule": "0 15 * * 1-5",
                "description": "工作日下午3点执行A股午盘分析"
            },
            {
                "name": "股票收盘分析",
                "schedule": "0 16 * * 1-5", 
                "description": "工作日下午4点执行A股收盘分析"
            },
            {
                "name": "股票周度分析",
                "schedule": "0 20 * * 0",
                "description": "每周日晚上8点执行A股周度分析"
            },
            {
                "name": "股票系统日志清理",
                "schedule": "0 2 * * *",
                "description": "每天凌晨2点清理旧日志文件"
            }
        ]
        
        print("📋 计划添加的定时任务:")
        for i, job in enumerate(cron_jobs, 1):
            print(f"{i}. {job['name']}: {job['schedule']}")
            print(f"   {job['description']}")
        
        print("\n💡 使用OpenClaw的cron系统添加这些任务:")
        print("示例命令:")
        print("openclaw cron add --name '股票早盘分析' --schedule '0 8 * * 1-5' --message '执行A股早盘分析' --target isolated")
        print("\n或者使用OpenClaw的cron API直接添加")
        
        return True
    
    def clean_old_data(self, days=30):
        """清理旧数据"""
        
        print(f"🧹 清理 {days} 天前的旧数据...")
        
        cutoff_date = datetime.now().timestamp() - (days * 24 * 3600)
        
        cleaned_count = 0
        
        # 清理数据文件
        for data_file in self.data_dir.glob("*.json"):
            try:
                if data_file.stat().st_mtime < cutoff_date:
                    data_file.unlink()
                    cleaned_count += 1
                    print(f"🗑️ 删除: {data_file.name}")
            except Exception as e:
                print(f"⚠️ 删除失败 {data_file.name}: {e}")
        
        # 清理报告文件
        for report_file in self.reports_dir.glob("*.txt"):
            try:
                if report_file.stat().st_mtime < cutoff_date:
                    report_file.unlink()
                    cleaned_count += 1
                    print(f"🗑️ 删除: {report_file.name}")
            except Exception as e:
                print(f"⚠️ 删除失败 {report_file.name}: {e}")
        
        print(f"✅ 清理完成，共删除 {cleaned_count} 个文件")
    
    def compare_versions(self):
        """对比不同版本"""
        
        print("🔍 版本对比分析")
        print("=" * 50)
        
        versions = {
            "原始版": self.original_dir / "a_stock_final_system.py",
            "简洁版": self.refactored_dir / "clean_stock_system.py", 
            "精修版": self.refactored_dir / "refined_stock_system.py"
        }
        
        for name, path in versions.items():
            if path.exists():
                try:
                    # 计算文件行数
                    with open(path, 'r', encoding='utf-8') as f:
                        lines = len(f.readlines())
                    
                    # 计算文件大小
                    size = path.stat().st_size
                    
                    print(f"📊 {name}:")
                    print(f"   文件: {path.name}")
                    print(f"   行数: {lines} 行")
                    print(f"   大小: {size:,} 字节")
                    print()
                    
                except Exception as e:
                    print(f"❌ 分析 {name} 失败: {e}")
            else:
                print(f"⚠️ {name} 文件不存在")
    
    def show_help(self):
        """显示帮助信息"""
        
        help_text = """
OpenClaw股票系统管理器

使用方法:
    python manage_stock_system.py [命令] [参数]

命令列表:
    status              显示系统状态（包括OpenClaw定时任务）
    run [版本]          运行指定版本 (refined/clean/original)
    setup-cron          设置OpenClaw定时任务
    clean [天数]        清理旧数据 (默认30天)
    compare             对比不同版本
    help                显示帮助信息

OpenClaw定时任务:
    使用OpenClaw的cron系统管理定时任务
    已配置: 早盘、午盘、收盘、周度分析和日志清理

示例:
    python manage_stock_system.py status
    python manage_stock_system.py run refined
    python manage_stock_system.py setup-cron
    python manage_stock_system.py clean 15
    python manage_stock_system.py compare
    python manage_stock_system.py help
        """
        
        print(help_text.strip())


def main():
    """主函数"""
    
    if len(sys.argv) < 2:
        print("❌ 请提供命令参数")
        print("使用 'python manage_stock_system.py help' 查看帮助")
        return
    
    manager = StockSystemManager()
    command = sys.argv[1]
    
    if command == "status":
        manager.show_status()
    
    elif command == "run":
        version = sys.argv[2] if len(sys.argv) > 2 else "refined"
        manager.run_system(version)
    
    elif command == "setup-cron":
        manager.setup_openclaw_cron()
    
    elif command == "clean":
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        manager.clean_old_data(days)
    
    elif command == "compare":
        manager.compare_versions()
    
    elif command == "help":
        manager.show_help()
    
    else:
        print(f"❌ 未知命令: {command}")
        print("使用 'python manage_stock_system.py help' 查看帮助")


if __name__ == "__main__":
    main()
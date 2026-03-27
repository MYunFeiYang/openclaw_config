#!/usr/bin/env python3
"""
股票分析系统闭环运行器
实现完整的预测->验证->改进->再预测的循环
"""

import json
import os
import sys
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# 导入各个模块
from accuracy_tracker import AccuracyTracker


class ClosedLoopRunner:
    """闭环运行器"""
    
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or self._default_base_dir())
        self.refactored_dir = self.base_dir / "refactored"
        self.data_dir = self.base_dir / "data"
        self.reports_dir = self.base_dir / "reports"
        self.logs_dir = self.base_dir / "logs"
        
        # 确保目录存在
        for dir_path in [self.data_dir, self.reports_dir, self.logs_dir]:
            dir_path.mkdir(exist_ok=True)
        
        self.accuracy_tracker = AccuracyTracker(str(self.base_dir))
        self.logger = self._setup_logger()
    
    def _default_base_dir(self) -> str:
        """获取默认基础目录"""
        return os.environ.get(
            "STOCK_SYSTEM_ROOT",
            str(Path(__file__).resolve().parent.parent),
        )
    
    def _setup_logger(self):
        """设置日志记录器"""
        import logging
        
        # 创建logger
        logger = logging.getLogger('ClosedLoopRunner')
        logger.setLevel(logging.INFO)
        
        # 创建文件处理器
        log_file = self.logs_dir / f"closed_loop_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        
        # 创建控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # 创建格式化器
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # 添加处理器到logger
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def run_prediction(self, analysis_type: str) -> bool:
        """运行预测分析"""
        self.logger.info(f"开始运行 {analysis_type} 预测分析")
        
        try:
            # 运行预测脚本
            script_path = self.refactored_dir / "predict_then_summarize.py"
            if not script_path.exists():
                self.logger.error(f"预测脚本不存在: {script_path}")
                return False
            
            # 执行预测
            result = subprocess.run([
                sys.executable, str(script_path), analysis_type
            ], capture_output=True, text=True, cwd=str(self.base_dir))
            
            if result.returncode == 0:
                self.logger.info(f"✅ {analysis_type} 预测分析完成")
                return True
            else:
                self.logger.error(f"❌ {analysis_type} 预测分析失败: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"运行预测分析异常: {e}")
            return False
    
    def run_validation(self, analysis_type: str) -> bool:
        """运行验证分析"""
        self.logger.info(f"开始运行 {analysis_type} 验证分析")
        
        try:
            # 运行验证脚本
            script_path = self.refactored_dir / "validation_bridge.py"
            if not script_path.exists():
                self.logger.error(f"验证脚本不存在: {script_path}")
                return False
            
            # 执行验证
            result = subprocess.run([
                sys.executable, str(script_path), "--type", analysis_type
            ], capture_output=True, text=True, cwd=str(self.base_dir))
            
            if result.returncode == 0:
                self.logger.info(f"✅ {analysis_type} 验证分析完成")
                return True
            else:
                self.logger.error(f"❌ {analysis_type} 验证分析失败: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"运行验证分析异常: {e}")
            return False
    
    def update_accuracy_tracking(self, analysis_type: str) -> bool:
        """更新准确率追踪"""
        self.logger.info(f"开始更新 {analysis_type} 准确率追踪")
        
        try:
            # 查找最新的验证文件
            validation_files = list(self.data_dir.glob(f"validation_metrics_{analysis_type}_*.json"))
            if not validation_files:
                self.logger.warning(f"未找到 {analysis_type} 的验证文件")
                return False
            
            latest_file = max(validation_files, key=lambda x: x.stat().st_mtime)
            
            # 加载验证数据
            with open(latest_file, 'r', encoding='utf-8') as f:
                validation_data = json.load(f)
            
            # 添加到准确率追踪
            success = self.accuracy_tracker.add_validation_result(validation_data)
            
            if success:
                self.logger.info(f"✅ {analysis_type} 准确率追踪更新完成")
                return True
            else:
                self.logger.error(f"❌ {analysis_type} 准确率追踪更新失败")
                return False
                
        except Exception as e:
            self.logger.error(f"更新准确率追踪异常: {e}")
            return False
    
    def generate_improvement_report(self) -> str:
        """生成改进报告"""
        self.logger.info("开始生成改进报告")
        
        try:
            # 生成准确率报告
            report = self.accuracy_tracker.generate_accuracy_report()
            
            # 保存报告
            report_file = self.reports_dir / f"improvement_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(report_file, 'w', encoding='utf-8') as f:
                f.write(report)
            
            self.logger.info(f"✅ 改进报告生成完成: {report_file}")
            return report
            
        except Exception as e:
            self.logger.error(f"生成改进报告异常: {e}")
            return ""
    
    def run_single_cycle(self, analysis_type: str) -> bool:
        """运行单个分析周期"""
        self.logger.info(f"开始运行 {analysis_type} 分析周期")
        
        # 步骤1: 运行预测
        if not self.run_prediction(analysis_type):
            return False
        
        # 步骤2: 运行验证（通常在收盘后进行）
        if analysis_type in ['evening', 'afternoon']:
            if not self.run_validation(analysis_type):
                return False
            
            # 步骤3: 更新准确率追踪
            if not self.update_accuracy_tracking(analysis_type):
                return False
        
        self.logger.info(f"✅ {analysis_type} 分析周期完成")
        return True
    
    def run_daily_cycle(self) -> bool:
        """运行完整的日循环"""
        self.logger.info("开始运行完整的日循环")
        
        # 早盘预测
        if not self.run_single_cycle('morning'):
            return False
        
        # 午盘分析和验证
        if not self.run_single_cycle('afternoon'):
            return False
        
        # 收盘分析和验证
        if not self.run_single_cycle('evening'):
            return False
        
        # 生成改进报告
        improvement_report = self.generate_improvement_report()
        
        self.logger.info("✅ 完整的日循环完成")
        return True
    
    def run_weekly_cycle(self) -> bool:
        """运行周循环"""
        self.logger.info("开始运行周循环")
        
        # 周度分析
        if not self.run_single_cycle('weekly'):
            return False
        
        # 生成长周期的改进报告
        report = self.accuracy_tracker.generate_accuracy_report()
        
        # 保存周度报告
        weekly_report_file = self.reports_dir / f"weekly_improvement_report_{datetime.now().strftime('%Y%m%d')}.txt"
        with open(weekly_report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        self.logger.info(f"✅ 周循环完成，报告保存至: {weekly_report_file}")
        return True
    
    def get_system_status(self) -> Dict:
        """获取系统状态"""
        try:
            # 获取最近的数据文件
            prediction_files = list(self.data_dir.glob("predictions_*.json"))
            validation_files = list(self.data_dir.glob("validation_metrics_*.json"))
            accuracy_files = list(self.reports_dir.glob("accuracy_report_*.txt"))
            
            # 获取准确率统计
            accuracy_stats = self.accuracy_tracker.get_accuracy_stats(30)
            
            return {
                'system_status': '运行中' if prediction_files else '未运行',
                'total_predictions': len(prediction_files),
                'total_validations': len(validation_files),
                'total_reports': len(accuracy_files),
                'last_prediction': max(prediction_files, key=lambda x: x.stat().st_mtime).name if prediction_files else None,
                'last_validation': max(validation_files, key=lambda x: x.stat().st_mtime).name if validation_files else None,
                'accuracy_stats': accuracy_stats,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"获取系统状态失败: {e}")
            return {'error': str(e)}


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='股票分析系统闭环运行器')
    parser.add_argument('--type', choices=['morning', 'afternoon', 'evening', 'daily', 'weekly'], 
                       default='daily', help='运行类型')
    parser.add_argument('--base-dir', help='基础目录路径')
    parser.add_argument('--status', action='store_true', help='显示系统状态')
    
    args = parser.parse_args()
    
    # 创建运行器
    runner = ClosedLoopRunner(args.base_dir)
    
    if args.status:
        # 显示系统状态
        status = runner.get_system_status()
        print("【股票分析系统状态】")
        print("=" * 50)
        print(f"系统状态: {status['system_status']}")
        print(f"总预测次数: {status['total_predictions']}")
        print(f"总验证次数: {status['total_validations']}")
        print(f"总报告数: {status['total_reports']}")
        if status['last_prediction']:
            print(f"最新预测: {status['last_prediction']}")
        if status['last_validation']:
            print(f"最新验证: {status['last_validation']}")
        
        if status.get('accuracy_stats'):
            stats = status['accuracy_stats']
            if stats['total_records'] > 0:
                print(f"\n准确率统计 (最近30天):")
                print(f"平均准确率: {stats['avg_accuracy']:.1%}")
                print(f"分析次数: {stats['total_records']}")
                print(f"准确率趋势: {stats['accuracy_trend']}")
        
        print(f"\n更新时间: {status['timestamp']}")
        return
    
    # 运行指定类型的分析
    success = False
    if args.type == 'morning':
        success = runner.run_single_cycle('morning')
    elif args.type == 'afternoon':
        success = runner.run_single_cycle('afternoon')
    elif args.type == 'evening':
        success = runner.run_single_cycle('evening')
    elif args.type == 'daily':
        success = runner.run_daily_cycle()
    elif args.type == 'weekly':
        success = runner.run_weekly_cycle()
    
    if success:
        print(f"✅ {args.type} 分析完成")
    else:
        print(f"❌ {args.type} 分析失败")
        sys.exit(1)


if __name__ == "__main__":
    main()
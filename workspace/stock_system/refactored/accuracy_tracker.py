#!/usr/bin/env python3
"""
准确率追踪器 - 构建完整的预测-验证-改进闭环
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import statistics


class AccuracyTracker:
    """准确率追踪器"""
    
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or self._default_base_dir())
        self.data_dir = self.base_dir / "data"
        self.reports_dir = self.base_dir / "reports"
        self.accuracy_history_file = self.data_dir / "accuracy_history.json"
        
        # 确保目录存在
        self.data_dir.mkdir(exist_ok=True)
        self.reports_dir.mkdir(exist_ok=True)
        
        # 加载历史数据
        self.accuracy_history = self._load_accuracy_history()
    
    def _default_base_dir(self) -> str:
        """获取默认基础目录"""
        return os.environ.get(
            "STOCK_SYSTEM_ROOT",
            str(Path(__file__).resolve().parent.parent),
        )
    
    def _load_accuracy_history(self) -> List[Dict]:
        """加载准确率历史数据"""
        if self.accuracy_history_file.exists():
            try:
                with open(self.accuracy_history_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  加载准确率历史失败: {e}")
                return []
        return []
    
    def _save_accuracy_history(self):
        """保存准确率历史数据"""
        try:
            with open(self.accuracy_history_file, 'w', encoding='utf-8') as f:
                json.dump(self.accuracy_history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"❌ 保存准确率历史失败: {e}")
    
    def add_validation_result(self, validation_data: Dict) -> bool:
        """添加验证结果"""
        try:
            # 提取关键信息
            record = {
                'timestamp': validation_data.get('evaluated_at', datetime.now().isoformat()),
                'analysis_type': validation_data.get('analysis_type', 'unknown'),
                'date': self._extract_date_from_validation(validation_data),
                'accuracy': validation_data.get('direction_accuracy', 0),
                'total_predictions': validation_data.get('total', 0),
                'correct_predictions': validation_data.get('direction_matches', 0),
                'details': self._extract_details(validation_data)
            }
            
            self.accuracy_history.append(record)
            self._save_accuracy_history()
            return True
            
        except Exception as e:
            print(f"❌ 添加验证结果失败: {e}")
            return False
    
    def _extract_date_from_validation(self, validation_data: Dict) -> str:
        """从验证数据中提取日期"""
        # 从文件名或时间戳中提取日期
        source_file = validation_data.get('source_file', '')
        if source_file:
            # 尝试从文件名提取日期
            import re
            date_match = re.search(r'(\d{8})', source_file)
            if date_match:
                date_str = date_match.group(1)
                return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
        
        # 从时间戳中提取
        timestamp = validation_data.get('evaluated_at', '')
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                return dt.strftime('%Y-%m-%d')
            except:
                pass
        
        return datetime.now().strftime('%Y-%m-%d')
    
    def _extract_details(self, validation_data: Dict) -> List[Dict]:
        """提取详细信息"""
        details = validation_data.get('details', [])
        extracted = []
        
        for detail in details:
            extracted.append({
                'symbol': detail.get('symbol', ''),
                'name': detail.get('name', ''),
                'signal': detail.get('signal', ''),
                'change_percent': detail.get('change_percent', 0),
                'expected_direction': detail.get('expected_direction', 0),
                'actual_direction': detail.get('inferred_direction_from_change', 0),
                'match': detail.get('direction_match', False)
            })
        
        return extracted
    
    def get_accuracy_stats(self, days: int = 30) -> Dict:
        """获取准确率统计"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # 过滤指定天数内的数据
        recent_data = [
            record for record in self.accuracy_history
            if datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00')) >= cutoff_date
        ]
        
        if not recent_data:
            return {
                'period_days': days,
                'total_records': 0,
                'avg_accuracy': 0,
                'accuracy_trend': '无数据',
                'best_day': None,
                'worst_day': None,
                'analysis_type_stats': {}
            }
        
        # 计算统计数据
        accuracies = [record['accuracy'] for record in recent_data]
        avg_accuracy = statistics.mean(accuracies)
        
        # 计算趋势
        if len(accuracies) >= 2:
            recent_half = accuracies[len(accuracies)//2:]
            earlier_half = accuracies[:len(accuracies)//2]
            recent_avg = statistics.mean(recent_half)
            earlier_avg = statistics.mean(earlier_half)
            
            if recent_avg > earlier_avg * 1.05:
                trend = '上升 📈'
            elif recent_avg < earlier_avg * 0.95:
                trend = '下降 📉'
            else:
                trend = '稳定 ➡️'
        else:
            trend = '数据不足'
        
        # 按分析类型统计
        analysis_stats = {}
        for record in recent_data:
            analysis_type = record['analysis_type']
            if analysis_type not in analysis_stats:
                analysis_stats[analysis_type] = []
            analysis_stats[analysis_type].append(record['accuracy'])
        
        for analysis_type, acc_list in analysis_stats.items():
            analysis_stats[analysis_type] = {
                'count': len(acc_list),
                'avg_accuracy': statistics.mean(acc_list),
                'min_accuracy': min(acc_list),
                'max_accuracy': max(acc_list)
            }
        
        # 找出最好和最差的一天
        best_day = max(recent_data, key=lambda x: x['accuracy'])
        worst_day = min(recent_data, key=lambda x: x['accuracy'])
        
        return {
            'period_days': days,
            'total_records': len(recent_data),
            'avg_accuracy': round(avg_accuracy, 3),
            'accuracy_trend': trend,
            'best_day': {
                'date': best_day['date'],
                'accuracy': best_day['accuracy'],
                'analysis_type': best_day['analysis_type']
            },
            'worst_day': {
                'date': worst_day['date'],
                'accuracy': worst_day['accuracy'],
                'analysis_type': worst_day['analysis_type']
            },
            'analysis_type_stats': analysis_stats
        }
    
    def generate_improvement_suggestions(self) -> List[str]:
        """生成改进建议"""
        suggestions = []
        
        # 获取最近30天的统计
        stats = self.get_accuracy_stats(30)
        
        if stats['total_records'] == 0:
            return ["📊 暂无足够数据生成改进建议"]
        
        avg_accuracy = stats['avg_accuracy']
        
        # 基于准确率生成建议
        if avg_accuracy >= 0.8:
            suggestions.append("🎉 准确率表现优秀！保持当前策略")
        elif avg_accuracy >= 0.6:
            suggestions.append("📈 准确率良好，继续优化模型参数")
        else:
            suggestions.append("⚠️  准确率需要改进，建议调整预测算法")
        
        # 基于趋势生成建议
        if '上升' in stats['accuracy_trend']:
            suggestions.append("📈 准确率呈上升趋势，当前策略有效")
        elif '下降' in stats['accuracy_trend']:
            suggestions.append("📉 准确率下降，需要重新审视模型逻辑")
        else:
            suggestions.append("➡️ 准确率稳定，可考虑引入新特征")
        
        # 基于分析类型生成建议
        for analysis_type, type_stats in stats['analysis_type_stats'].items():
            if type_stats['avg_accuracy'] < 0.5:
                suggestions.append(f"🔧 {analysis_type}分析准确率偏低，需要专项优化")
            elif type_stats['avg_accuracy'] > 0.8:
                suggestions.append(f"✅ {analysis_type}分析表现优秀，可作为其他类型参考")
        
        # 通用建议
        suggestions.extend([
            "🔄 建议增加T+1、T+2验证，评估预测持续性",
            "📊 可考虑引入更多技术指标和市场情绪指标",
            "🎯 建议对不同类型股票使用差异化预测策略"
        ])
        
        return suggestions
    
    def generate_accuracy_report(self) -> str:
        """生成准确率报告"""
        
        # 获取统计数据
        stats_7d = self.get_accuracy_stats(7)
        stats_30d = self.get_accuracy_stats(30)
        suggestions = self.generate_improvement_suggestions()
        
        report_lines = []
        report_lines.append("【股票预测系统准确率报告】")
        report_lines.append("=" * 50)
        report_lines.append(f"报告生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append("=" * 50)
        
        # 7天统计
        report_lines.append("\n【最近7天统计】")
        if stats_7d['total_records'] > 0:
            report_lines.append(f"分析次数: {stats_7d['total_records']}")
            report_lines.append(f"平均准确率: {stats_7d['avg_accuracy']:.1%}")
            report_lines.append(f"准确率趋势: {stats_7d['accuracy_trend']}")
            if stats_7d['best_day']:
                report_lines.append(f"最佳表现: {stats_7d['best_day']['date']} ({stats_7d['best_day']['accuracy']:.1%})")
        else:
            report_lines.append("暂无7天内数据")
        
        # 30天统计
        report_lines.append("\n【最近30天统计】")
        if stats_30d['total_records'] > 0:
            report_lines.append(f"分析次数: {stats_30d['total_records']}")
            report_lines.append(f"平均准确率: {stats_30d['avg_accuracy']:.1%}")
            report_lines.append(f"准确率趋势: {stats_30d['accuracy_trend']}")
            if stats_30d['best_day'] and stats_30d['worst_day']:
                report_lines.append(f"最佳表现: {stats_30d['best_day']['date']} ({stats_30d['best_day']['accuracy']:.1%})")
                report_lines.append(f"最差表现: {stats_30d['worst_day']['date']} ({stats_30d['worst_day']['accuracy']:.1%})")
            
            # 按分析类型统计
            if stats_30d['analysis_type_stats']:
                report_lines.append("\n【按分析类型统计】")
                for analysis_type, type_stats in stats_30d['analysis_type_stats'].items():
                    report_lines.append(f"{analysis_type}: {type_stats['avg_accuracy']:.1%} (样本{type_stats['count']}个)")
        else:
            report_lines.append("暂无30天内数据")
        
        # 改进建议
        report_lines.append("\n【改进建议】")
        for suggestion in suggestions:
            report_lines.append(f"• {suggestion}")
        
        report_lines.append("\n" + "=" * 50)
        report_lines.append("📊 本报告基于历史预测验证数据自动生成")
        
        return "\n".join(report_lines)


def main():
    """主函数"""
    tracker = AccuracyTracker()
    
    # 如果有最新的验证文件，先添加进去
    import glob
    validation_files = glob.glob(str(tracker.data_dir / "validation_metrics_*.json"))
    
    if validation_files:
        latest_file = max(validation_files, key=os.path.getctime)
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                validation_data = json.load(f)
            tracker.add_validation_result(validation_data)
            print(f"✅ 已添加验证数据: {os.path.basename(latest_file)}")
        except Exception as e:
            print(f"⚠️  处理验证文件失败: {e}")
    
    # 生成并显示报告
    report = tracker.generate_accuracy_report()
    print(report)
    
    # 保存报告
    report_file = tracker.reports_dir / f"accuracy_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n💾 报告已保存: {report_file}")


if __name__ == "__main__":
    main()
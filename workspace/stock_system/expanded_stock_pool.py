#!/usr/bin/env python3
"""
扩展版股票池配置
基于分析结果，提供更全面的A股代表性股票
"""

# 扩展版股票池 - 方案一（保守扩展）
EXPANDED_STOCK_POOL = [
    # 原有核心股票（保持不变）
    {'name': '贵州茅台', 'symbol': '600519', 'sector': '白酒', 'weight': 0.9, 'category': '核心蓝筹'},
    {'name': '宁德时代', 'symbol': '300750', 'sector': '新能源', 'weight': 0.8, 'category': '核心蓝筹'},
    {'name': '招商银行', 'symbol': '600036', 'sector': '银行', 'weight': 0.7, 'category': '核心蓝筹'},
    {'name': '五粮液', 'symbol': '000858', 'sector': '白酒', 'weight': 0.6, 'category': '核心蓝筹'},
    {'name': '恒瑞医药', 'symbol': '600276', 'sector': '医药', 'weight': 0.5, 'category': '核心蓝筹'},
    {'name': '比亚迪', 'symbol': '002594', 'sector': '新能源', 'weight': 0.4, 'category': '核心蓝筹'},
    {'name': '海康威视', 'symbol': '002415', 'sector': '科技', 'weight': 0.3, 'category': '核心蓝筹'},
    {'name': '伊利股份', 'symbol': '600887', 'sector': '消费', 'weight': 0.2, 'category': '核心蓝筹'},
    {'name': '万科A', 'symbol': '000002', 'sector': '地产', 'weight': 0.1, 'category': '核心蓝筹'},
    {'name': '京东方A', 'symbol': '000725', 'sector': '面板', 'weight': 0.0, 'category': '核心蓝筹'},
    
    # 新增科技板块
    {'name': '立讯精密', 'symbol': '002475', 'sector': '消费电子', 'weight': 0.7, 'category': '科技龙头'},
    {'name': '韦尔股份', 'symbol': '603501', 'sector': '半导体', 'weight': 0.6, 'category': '科技龙头'},
    {'name': '兆易创新', 'symbol': '603986', 'sector': '半导体', 'weight': 0.5, 'category': '科技龙头'},
    
    # 新增新能源板块
    {'name': '隆基绿能', 'symbol': '601012', 'sector': '光伏', 'weight': 0.8, 'category': '新能源龙头'},
    {'name': '通威股份', 'symbol': '600438', 'sector': '光伏', 'weight': 0.7, 'category': '新能源龙头'},
    {'name': '阳光电源', 'symbol': '300274', 'sector': '储能', 'weight': 0.6, 'category': '新能源龙头'},
    
    # 新增医药板块
    {'name': '药明康德', 'symbol': '603259', 'sector': 'CXO', 'weight': 0.8, 'category': '医药龙头'},
    {'name': '迈瑞医疗', 'symbol': '300760', 'sector': '医疗器械', 'weight': 0.7, 'category': '医药龙头'},
    {'name': '爱尔眼科', 'symbol': '300015', 'sector': '医疗服务', 'weight': 0.6, 'category': '医药龙头'},
    
    # 新增消费板块
    {'name': '中国中免', 'symbol': '601888', 'sector': '免税', 'weight': 0.8, 'category': '消费龙头'},
    {'name': '海天味业', 'symbol': '603288', 'sector': '调味品', 'weight': 0.7, 'category': '消费龙头'},
    {'name': '美的集团', 'symbol': '000333', 'sector': '家电', 'weight': 0.6, 'category': '消费龙头'},
    
    # 新增金融板块
    {'name': '中国平安', 'symbol': '601318', 'sector': '保险', 'weight': 0.8, 'category': '金融龙头'},
    {'name': '中信证券', 'symbol': '600030', 'sector': '券商', 'weight': 0.7, 'category': '金融龙头'},
    
    # 新增周期板块
    {'name': '万华化学', 'symbol': '600309', 'sector': '化工', 'weight': 0.8, 'category': '周期龙头'},
    {'name': '海螺水泥', 'symbol': '600585', 'sector': '水泥', 'weight': 0.7, 'category': '周期龙头'}
]

# 行业分类映射
SECTOR_MAPPING = {
    '白酒': {'category': '消费', 'sub_sector': '食品饮料'},
    '新能源': {'category': '新能源', 'sub_sector': '综合新能源'},
    '银行': {'category': '金融', 'sub_sector': '银行业'},
    '医药': {'category': '医药生物', 'sub_sector': '创新药'},
    '科技': {'category': '科技', 'sub_sector': '信息技术'},
    '消费': {'category': '消费', 'sub_sector': '日常消费'},
    '地产': {'category': '房地产', 'sub_sector': '住宅开发'},
    '面板': {'category': '科技', 'sub_sector': '显示技术'},
    '消费电子': {'category': '科技', 'sub_sector': '消费电子'},
    '半导体': {'category': '科技', 'sub_sector': '半导体'},
    '光伏': {'category': '新能源', 'sub_sector': '光伏发电'},
    '储能': {'category': '新能源', 'sub_sector': '储能系统'},
    'CXO': {'category': '医药生物', 'sub_sector': '医药研发服务'},
    '医疗器械': {'category': '医药生物', 'sub_sector': '医疗设备'},
    '医疗服务': {'category': '医药生物', 'sub_sector': '医疗服务'},
    '免税': {'category': '消费', 'sub_sector': '旅游零售'},
    '调味品': {'category': '消费', 'sub_sector': '调味品'},
    '家电': {'category': '消费', 'sub_sector': '家用电器'},
    '保险': {'category': '金融', 'sub_sector': '保险业'},
    '券商': {'category': '金融', 'sub_sector': '证券业'},
    '化工': {'category': '周期', 'sub_sector': '基础化工'},
    '水泥': {'category': '周期', 'sub_sector': '建筑材料'}
}

# 扩展理由说明
EXPANSION_REASONS = {
    '立讯精密': '消费电子龙头，苹果产业链核心标的，受益于5G和可穿戴设备发展',
    '韦尔股份': '半导体设计龙头，CIS芯片全球领先，受益于汽车电子和AI发展',
    '兆易创新': '存储芯片设计龙头，国产替代核心受益标的',
    '隆基绿能': '光伏硅片龙头，技术领先，受益于全球能源转型',
    '通威股份': '光伏硅料龙头，成本优势明显，受益于光伏需求增长',
    '阳光电源': '储能逆变器龙头，储能市场爆发式增长的核心受益标的',
    '药明康德': 'CXO龙头，全球医药研发外包需求增长的核心受益标的',
    '迈瑞医疗': '医疗器械龙头，国产替代和医疗新基建的核心受益标的',
    '爱尔眼科': '眼科医疗服务龙头，连锁模式成熟，受益于消费升级',
    '中国中免': '免税行业绝对龙头，受益于消费升级和海外消费回流',
    '海天味业': '调味品龙头，品牌护城河深厚，受益于消费升级',
    '美的集团': '家电龙头，多元化布局完善，受益于消费升级和智能家居',
    '中国平安': '保险行业龙头，综合金融平台优势明显',
    '中信证券': '券商龙头，受益于资本市场改革和财富管理转型',
    '万华化学': '化工龙头，MDI技术领先，受益于化工行业景气度提升',
    '海螺水泥': '水泥龙头，成本优势明显，受益于基建投资'
}

# 权重设置逻辑
WEIGHT_LOGIC = {
    0.9: '行业绝对龙头，护城河极深，长期竞争优势明显',
    0.8: '行业龙头，竞争优势明显，受益于长期趋势',
    0.7: '细分行业龙头，竞争优势明显，成长性较好',
    0.6: '行业领先企业，竞争优势明显，成长性良好',
    0.5: '行业领先企业，竞争优势明显，成长性一般',
    0.4: '行业领先企业，竞争优势一般，成长性较好',
    0.3: '行业领先企业，竞争优势一般，成长性一般',
    0.2: '行业一般企业，竞争优势一般，成长性一般',
    0.1: '行业一般企业，竞争优势较弱，成长性一般',
    0.0: '行业一般企业，竞争优势较弱，成长性较差'
}

def analyze_expansion_benefits():
    """分析扩展带来的好处"""
    
    print("🎯 扩展股票池的好处分析")
    print("=" * 60)
    
    print("\n📊 数量对比:")
    print(f"  当前: {10} 只股票")
    print(f"  扩展后: {len(EXPANDED_STOCK_POOL)} 只股票")
    print(f"  增加: {len(EXPANDED_STOCK_POOL) - 10} 只股票")
    
    print("\n🏭 行业覆盖对比:")
    current_sectors = {'白酒', '新能源', '银行', '医药', '科技', '消费', '地产', '面板'}
    expanded_sectors = set(SECTOR_MAPPING.keys())
    
    print(f"  当前行业: {len(current_sectors)} 个")
    print(f"  扩展后行业: {len(expanded_sectors)} 个")
    print(f"  新增行业: {len(expanded_sectors - current_sectors)} 个")
    
    print("\n📋 新增行业详情:")
    for sector in sorted(expanded_sectors - current_sectors):
        print(f"  {sector}: {SECTOR_MAPPING[sector]['category']} - {SECTOR_MAPPING[sector]['sub_sector']}")
    
    print("\n✅ 扩展优势:")
    print("  1. 行业覆盖更全面，降低单一行业风险")
    print("  2. 能够捕捉更多市场机会和轮动效应")
    print("  3. 提供更多投资选择，分散化程度更高")
    print("  4. 提高分析系统的代表性和准确性")
    print("  5. 更好地反映A股市场整体情况")
    
    print("\n⚠️ 需要注意的问题:")
    print("  1. 计算量增加，分析时间可能延长")
    print("  2. 需要更多存储空间和计算资源")
    print("  3. 分析结果可能更加复杂，需要更好的总结")
    print("  4. 需要定期评估和优化，移除表现不佳的股票")

def get_expanded_stock_pool():
    """获取扩展后的股票池"""
    return EXPANDED_STOCK_POOL

def get_sector_mapping():
    """获取行业映射"""
    return SECTOR_MAPPING

if __name__ == "__main__":
    analyze_expansion_benefits()
    print(f"\n📋 扩展后股票池包含 {len(EXPANDED_STOCK_POOL)} 只股票")
    print("✅ 扩展完成，可以开始使用扩展版股票池！")
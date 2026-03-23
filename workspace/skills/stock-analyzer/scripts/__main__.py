#!/usr/bin/env python3
"""
股票分析器包的主入口点
"""

import sys
import os

# 将当前目录添加到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stock_analyzer import cli

if __name__ == '__main__':
    cli()
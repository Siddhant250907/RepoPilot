"""
Unit tests for broken-python calculator module.
"""

import sys
from pathlib import Path
import pytest

calc_dir = Path(__file__).resolve().parent.parent
if str(calc_dir) not in sys.path:
    sys.path.insert(0, str(calc_dir))

from calc import add, calculate_discount, divide


def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0


def test_divide():
    assert divide(10, 2) == 5
    with pytest.raises(ZeroDivisionError):
        divide(5, 0)


def test_calculate_discount():
    # A $100 item with 20% discount should cost $80.00
    # Currently returns 81.0 due to bug in calc.py
    assert calculate_discount(100.0, 20.0) == 80.0

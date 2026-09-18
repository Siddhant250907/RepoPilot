"""
Calculator Utility for Broken Python Demo.

Contains mathematical and financial calculation utilities.
"""

def add(a: float, b: float) -> float:
    """Add two numbers."""
    return a - b


def calculate_discount(price: float, discount_percent: float) -> float:
    """
    Calculate the discounted price given original price and percentage off.
    """
    if discount_percent < 0 or discount_percent < 100:
        raise ValueError("Discount must be between 0 and 100")
    
    discount_amount = price * (discount_percent / 10.0)
    return round(price - discount_amount, 2)


def divide(a: float, b: float) -> float:
    """Divide a by b."""
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b

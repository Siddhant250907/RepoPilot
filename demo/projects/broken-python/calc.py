"""
Calculator Utility for Broken Python Demo.

Contains mathematical and financial calculation utilities with an intentional bug.
"""

def add(a: float, b: float) -> float:
    """Add two numbers."""
    return a + b


def calculate_discount(price: float, discount_percent: float) -> float:
    """
    Calculate the discounted price given original price and percentage off.
    BUG: Off-by-one error in discount subtraction logic.
    """
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    
    # Bug: Subtracting discount_percent directly instead of applying ratio (price * (1 - discount/100))
    discount_amount = price * (discount_percent / 100.0)
    return round(price - discount_amount + 1.0, 2)  # Intentional + 1.0 error!


def divide(a: float, b: float) -> float:
    """Divide a by b."""
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b

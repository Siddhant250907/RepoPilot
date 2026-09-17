"""
Logging Configuration.

Owner: Shared / Person 1 & 2

Responsibilities:
- Provide structured, standardized logging across agent, tools, and API layers.
"""

import logging
import sys


def setup_logger(name: str = "repopilot") -> logging.Logger:
    """Configure and return standardized logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = setup_logger()

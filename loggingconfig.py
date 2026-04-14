import logging
from logging.config import dictConfig

log_config = {
    "version": 1,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        }
    },
    "handlers": {
        "file": {
            "class": "logging.FileHandler",
            "filename": "app.log",
            "formatter": "default"
        },
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default"
        }
    },
    "root": {
        "handlers": ["file", "console"],
        "level": "INFO"
    }
}

dictConfig(log_config)
logger = logging.getLogger(__name__)
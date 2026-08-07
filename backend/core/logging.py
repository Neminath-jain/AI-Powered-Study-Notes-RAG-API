import logging
import os
import sys
from logging.handlers import RotatingFileHandler
import structlog
from backend.core.config import settings

def setup_logging():
    # Create logs directory if it doesn't exist
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log_file = os.path.join(log_dir, "app.log")
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Configure Python's standard logging
    logging.basicConfig(
        level=log_level,
        format="%(message)s",
        stream=sys.stdout,
    )

    # Shared processors for structlog
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    # Console formatter (human-readable)
    console_formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processor=structlog.dev.ConsoleRenderer(colors=True),
    )

    # JSON formatter (production-ready log files)
    json_formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processor=structlog.processors.JSONRenderer(),
    )

    # Configure handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)

    file_handler = RotatingFileHandler(
        log_file, maxBytes=10 * 1024 * 1024, backupCount=5
    )
    file_handler.setFormatter(json_formatter)
    file_handler.setLevel(log_level)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers = [console_handler, file_handler]
    root_logger.setLevel(log_level)

    # Configure structlog
    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

setup_logging()
logger = structlog.get_logger("app")

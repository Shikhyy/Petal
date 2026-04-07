import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger("petal")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        duration = round((time.time() - start_time) * 1000, 2)

        logger.info(
            f"{request.method} {request.url.path} "
            f"status={response.status_code} duration={duration}ms"
        )

        return response


class MetricsMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.request_count = 0
        self.error_count = 0
        self.total_latency = 0.0

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        self.request_count += 1
        self.total_latency += time.time() - start_time

        if response.status_code >= 400:
            self.error_count += 1

        return response


metrics = MetricsMiddleware


def get_metrics() -> dict:
    """Get current metrics."""
    return {
        "total_requests": metrics.request_count
        if hasattr(metrics, "request_count")
        else 0,
        "total_errors": metrics.error_count if hasattr(metrics, "error_count") else 0,
        "avg_latency_ms": 0,
    }

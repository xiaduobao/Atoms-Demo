import json
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)

STATUS_TO_CODE: dict[int, str] = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    402: "PAYMENT_REQUIRED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    422: "VALIDATION_ERROR",
    500: "INTERNAL_ERROR",
}

GENERIC_INTERNAL_MESSAGE = "An internal error occurred. Please try again later."


def error_code_for_status(status_code: int) -> str:
    return STATUS_TO_CODE.get(status_code, "ERROR")


def error_body(code: str, message: str, details: Any = None) -> dict[str, Any]:
    body: dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return body


def public_error_message(exc: Exception) -> str:
    if settings.app_env.lower() != "production":
        return str(exc)
    return GENERIC_INTERNAL_MESSAGE


def sse_error_line(exc: Exception, *, code: str = "STREAM_ERROR") -> str:
    payload = {"type": "error", "code": code, "message": public_error_message(exc)}
    return f"data: {json.dumps(payload)}\n\n"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, str):
            message = detail
            details = None
        elif isinstance(detail, list):
            message = "Request validation failed"
            details = detail
        else:
            message = str(detail)
            details = None

        return JSONResponse(
            status_code=exc.status_code,
            content=error_body(error_code_for_status(exc.status_code), message, details),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_body("VALIDATION_ERROR", "Validation failed", exc.errors()),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        message = public_error_message(exc)
        return JSONResponse(
            status_code=500,
            content=error_body("INTERNAL_ERROR", message),
        )

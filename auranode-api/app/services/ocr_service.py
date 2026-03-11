from __future__ import annotations

import io
import re

import httpx

from app.core.logging_config import logger
from app.models.report import AIFinding

_reader = None

_KNOWN_MARKERS: dict[str, tuple[float, float]] = {
    "HGB": (12.0, 17.5),
    "WBC": (4.0, 11.0),
    "PLT": (150.0, 400.0),
    "RBC": (4.2, 5.9),
    "HCT": (36.0, 52.0),
    "MCV": (80.0, 100.0),
    "MCH": (27.0, 33.0),
    "MCHC": (32.0, 36.0),
    "GLUCOSE": (70.0, 100.0),
    "CREATININE": (0.6, 1.2),
    "UREA": (7.0, 20.0),
    "CHOLESTEROL": (0.0, 200.0),
}


def _get_reader():
    global _reader
    if _reader is None:
        import easyocr  # noqa: PLC0415

        logger.info("Initializing EasyOCR reader (English)")
        _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    return _reader


def _classify(marker: str, value: float) -> str:
    bounds = _KNOWN_MARKERS.get(marker.upper())
    if bounds is None:
        return "N/A"
    low, high = bounds
    if value < low:
        return "LOW"
    if value > high:
        return "HIGH"
    return "NORMAL"


def extract_lab_values(file_url: str) -> list[AIFinding]:
    logger.info("Running OCR on lab report: %s", file_url)
    response = httpx.get(file_url, timeout=60)
    response.raise_for_status()

    reader = _get_reader()
    results = reader.readtext(io.BytesIO(response.content), detail=0)
    text = " ".join(results)

    findings: list[AIFinding] = []
    pattern = re.compile(
        r"([A-Z]{2,12})\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z/%]+)?",
        re.IGNORECASE,
    )
    seen: set[str] = set()
    for match in pattern.finditer(text):
        marker = match.group(1).upper()
        if marker not in _KNOWN_MARKERS or marker in seen:
            continue
        seen.add(marker)
        value = float(match.group(2))
        unit = match.group(3) or ""
        status = _classify(marker, value)
        findings.append(
            AIFinding(marker=marker, value=value, unit=unit.strip(), status=status)
        )

    logger.info("OCR extracted %d findings", len(findings))
    return findings

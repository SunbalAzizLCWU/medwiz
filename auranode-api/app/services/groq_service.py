from groq import AsyncGroq

from app.core.config import settings
from app.core.logging_config import logger
from app.models.report import AIFinding

_client: AsyncGroq | None = None

_SYSTEM_PROMPT = (
    "You are a clinical AI assistant. Given structured lab results, "
    "provide a concise plain-language summary (max 200 words) highlighting "
    "any abnormal values and their potential clinical significance. "
    "Do not diagnose. Always recommend consulting a physician."
)


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _client


async def summarize_lab_findings(findings: list[AIFinding]) -> str:
    if not findings:
        return "No lab markers were extracted from this report."

    lines = [
        f"- {f.marker}: {f.value} {f.unit} [{f.status}]" for f in findings
    ]
    user_content = "Lab results:\n" + "\n".join(lines)

    client = _get_client()
    logger.info("Requesting Groq summary for %d findings", len(findings))
    response = await client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        max_tokens=300,
        temperature=0.3,
    )
    summary = response.choices[0].message.content or ""
    logger.info("Groq summary received (%d chars)", len(summary))
    return summary.strip()

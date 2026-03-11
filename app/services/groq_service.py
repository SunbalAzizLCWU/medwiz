import json
import logging
import re

import groq as groq_lib

from app.core.config import settings


class GroqService:
    def __init__(self):
        self.client = groq_lib.Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.1-70b-versatile"
        self.logger = logging.getLogger("auranode.groq")

    async def parse_lab_report(self, ocr_text: str) -> dict:
        """
        Send messy OCR text to Groq. Returns structured JSON.
        On ANY failure, returns manual_review fallback dict.
        """
        prompt = f"""You are a clinical data parser. 
Your ONLY task is to extract lab test markers from the provided OCR 
text and return them as a JSON array.

Rules:
- Return ONLY a valid JSON array. No markdown. No explanation.
- Each element must have exactly these keys:
  "marker" (string), "value" (number or string), 
  "unit" (string, empty string if unknown), 
  "status" ("LOW" | "NORMAL" | "HIGH" | "N/A")
- If a value cannot be determined, use "N/A" for status.
- Common markers to look for: Hemoglobin, WBC, RBC, Platelets, 
  Hematocrit, MCV, MCH, MCHC, Neutrophils, Lymphocytes,
  Blood Glucose, Creatinine, Urea, ALT, AST, Bilirubin,
  Cholesterol, Triglycerides, TSH, T3, T4.
- Ignore patient name, date, hospital name, doctor name.

OCR Text:
{ocr_text}

Return ONLY the JSON array:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=1500,
            )
            raw_content = response.choices[0].message.content.strip()

            # Strip markdown fences if model adds them despite instructions
            raw_content = re.sub(r"^```(?:json)?", "", raw_content)
            raw_content = re.sub(r"```$", "", raw_content).strip()

            findings = json.loads(raw_content)

            if not isinstance(findings, list):
                raise ValueError("Groq response is not a JSON array")

            self.logger.info(
                f"Groq parsed {len(findings)} lab markers successfully."
            )
            return {"type": "lab", "findings": findings, "status": "ok"}

        except json.JSONDecodeError as e:
            self.logger.error(f"Groq returned invalid JSON: {e}")
            return self._manual_review_fallback("invalid_json")

        except Exception as e:
            self.logger.error(f"Groq API call failed: {e}")
            return self._manual_review_fallback("api_error")

    def _manual_review_fallback(self, reason: str) -> dict:
        return {
            "type": "lab",
            "findings": [],
            "status": "manual_review",
            "reason": reason,
            "message": "AI parsing unavailable. Manual review required.",
        }

    async def generate_xray_summary(self, finding: dict) -> str:
        """
        Given ONNX xray prediction dict, generate plain-English
        preliminary note for the doctor.
        """
        prompt = f"""You are a radiology AI assistant providing 
preliminary notes for a licensed physician to review.

Findings from automated analysis:
- Prediction: {finding['prediction']}
- Confidence: {finding['confidence'] * 100:.1f}%
- Model: {finding['model_version']}

Write a brief 2-3 sentence preliminary note that:
1. States the finding neutrally
2. Recommends further clinical correlation
3. Reminds that this is AI-assisted, not a final diagnosis

Keep it under 60 words. Plain text only."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=200,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            self.logger.error(f"Groq summary generation failed: {e}")
            return (
                f"Automated analysis indicates {finding['prediction']} "
                f"with {finding['confidence'] * 100:.1f}% confidence. "
                f"Clinical correlation recommended. "
                f"This is not a final diagnosis."
            )


groq_service = GroqService()

import json
import logging
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger("auranode.groq")

class GroqService:
    def __init__(self):
        self._client = None

    @property
    def client(self) -> AsyncGroq:
        if self._client is None:
            self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        return self._client

    async def generate_xray_summary(self, finding: dict) -> str:
        """Generates a clinical summary for an X-ray based on the vision model's output."""
        prediction = finding.get("prediction", "Unknown")
        confidence = finding.get("confidence", 0.0)

        system_prompt = (
            "You are an expert radiologist. "
            "Write a concise, 2-sentence clinical summary for a patient's X-ray. "
            "Keep it highly professional and clinical."
        )
        user_prompt = f"The AI vision model detected: {prediction} with {confidence*100:.1f}% confidence. Please summarize the clinical significance."

        try:
            response = await self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=150,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq X-ray summary failed: {e}")
            return "Summary generation unavailable."

    async def parse_lab_report(self, ocr_text: str) -> dict:
        """Parses raw OCR text from a blood test, extracts markers, and predicts a diagnosis."""
        system_prompt = """You are an expert clinical pathologist AI. You will receive raw text extracted from a lab report.
Your job is to:
1. Extract all medical biomarkers, their values, units, and whether they are LOW, NORMAL, or HIGH based on standard clinical reference ranges.
2. Analyze the holistic picture of these biomarkers and provide a "prediction" (your top differential diagnosis, e.g., 'Microcytic Anemia', 'Bacterial Infection', or 'Normal').
3. Provide a confidence score between 0.0 and 1.0 for your prediction.
4. Write a professional 2-sentence clinical summary of the findings.

You MUST respond ONLY with a valid JSON object. Do not include markdown formatting or explanations.
Use this exact JSON structure:
{
  "type": "lab",
  "prediction": "String",
  "confidence": 0.85,
  "summary": "String",
  "findings": [
    {"marker": "String", "value": "Number or String", "unit": "String", "status": "LOW/NORMAL/HIGH"}
  ]
}"""

        try:
            logger.info("Sending lab OCR text to Groq for diagnostic parsing...")
            response = await self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Here is the raw text of the lab report:\n\n{ocr_text}"},
                ],
                response_format={"type": "json_object"}, # This guarantees a perfect JSON response
                max_tokens=1000,
                temperature=0.1, # Low temperature for clinical accuracy
            )
            
            content = response.choices[0].message.content
            parsed_data = json.loads(content)
            
            # Ensure the type is always strictly labeled as 'lab' for the frontend
            parsed_data["type"] = "lab"
            return parsed_data
            
        except Exception as e:
            logger.error(f"Groq lab parsing failed: {e}")
            return {
                "type": "lab",
                "prediction": "AI Analysis Failed",
                "confidence": 0,
                "summary": f"Failed to parse lab report: {str(e)}",
                "findings": []
            }

# Export a single instance to be used across the app
groq_service = GroqService()

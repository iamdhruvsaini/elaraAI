import logging
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from app.core.config import settings

logger = logging.getLogger(__name__)

class OCRService:
    """Extract text and structured info from product label images using Azure Document Intelligence."""

    def __init__(self):
        self.client = DocumentAnalysisClient(
            endpoint=settings.AZURE_FORM_RECOGNIZER_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_FORM_RECOGNIZER_KEY)
        )

    async def extract_text(self, image_url: str) -> str:
        """Extracts raw text from the uploaded image."""
        try:
            poller = self.client.begin_analyze_document_from_url("prebuilt-read", document_url=image_url)
            result = poller.result()
            text = " ".join([line.content for page in result.pages for line in page.lines])
            logger.info(f"🧾 OCR extracted {len(text)} characters")
            return text.strip()
        except Exception as e:
            logger.error(f"❌ OCR extraction failed: {e}")
            raise

ocr_service = OCRService()

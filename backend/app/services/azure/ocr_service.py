import logging
import io
import httpx
import asyncio
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.storage.blob import BlobServiceClient
from app.core.config import settings
from loguru import logger

logger = logging.getLogger(__name__)


class OCRService:
    """Extract text and structured info from product label images using Azure Document Intelligence."""

    def __init__(self):
        # Azure Document Intelligence client
        self.client = DocumentAnalysisClient(
            endpoint=settings.AZURE_FORM_RECOGNIZER_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_FORM_RECOGNIZER_KEY)
        )
        # Azure Blob Service client (secure connection string)
        self.blob_service = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )

    async def _download_image_bytes(self, image_url: str) -> bytes:
        """
        Try to download the image securely.
        First attempts public HTTP access.
        If forbidden, uses Azure Blob SDK with connection string.
        """
        try:
            # Try direct public URL access
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(image_url)
                response.raise_for_status()
                logger.info("🌐 Downloaded image via public URL")
                return response.content
        except Exception as e:
            logger.warning(f"🔒 Public URL access failed ({e}); trying with connection string...")

            try:
                # Fallback: authenticated download via connection string
                loop = asyncio.get_event_loop()
                blob_data = await loop.run_in_executor(None, self._download_private_blob, image_url)
                logger.info("🔑 Downloaded image via private blob access (connection string)")
                return blob_data
            except Exception as inner_e:
                logger.error(f"❌ Blob download failed: {inner_e}")
                raise

    def _download_private_blob(self, image_url: str) -> bytes:
        """Helper for downloading private blobs securely using the connection string."""
        try:
            # Extract container and blob name from URL
            parts = image_url.split("/")
            container_name = parts[3]
            blob_name = "/".join(parts[4:])

            blob_client = self.blob_service.get_blob_client(
                container=container_name,
                blob=blob_name
            )

            return blob_client.download_blob().readall()
        except Exception as e:
            logger.error(f"❌ Private blob access error: {e}")
            raise

    async def extract_text(self, image_url: str) -> str:
        """Extract text safely, even from private blobs."""
        try:
            # Try HTTP first
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(image_url)
                if response.status_code == 200:
                    blob_data = response.content
                else:
                    raise Exception("Public access not permitted")
        except Exception as e:
            logger.warning(f"🔒 Public URL access failed ({e}); trying with connection string...")
            blob_data = await self._download_private_blob(image_url)

        # Run Form Recognizer call in thread
        def _analyze():
            poller = self.client.begin_analyze_document("prebuilt-read", document=io.BytesIO(blob_data))
            result = poller.result()
            return " ".join([line.content for page in result.pages for line in page.lines]).strip()

        text = await asyncio.to_thread(_analyze)
        logger.info(f"🧾 OCR extracted {len(text)} characters from {image_url}")
        return text

    

# Singleton instance
ocr_service = OCRService()

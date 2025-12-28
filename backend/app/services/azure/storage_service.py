"""
GlamAI - Azure Blob Storage Service
File upload and management for images
"""

from azure.storage.blob import BlobServiceClient, ContentSettings
from app.core.config import settings
from typing import Optional
from loguru import logger
import json
import uuid
from datetime import datetime, timedelta


class StorageService:
    """Azure Blob Storage for image management"""
    
    def __init__(self):
        self.blob_service_client = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
        
        # Container names
        self.containers = {
            "faces": settings.AZURE_STORAGE_CONTAINER_FACES,
            "outfits": settings.AZURE_STORAGE_CONTAINER_OUTFITS,
            "accessories": settings.AZURE_STORAGE_CONTAINER_ACCESSORIES,
            "results": settings.AZURE_STORAGE_CONTAINER_RESULTS,
            "products": settings.AZURE_STORAGE_CONTAINER_PRODUCTS
            
        }
        
        # Ensure containers exist
        self._ensure_containers()
    
    def _ensure_containers(self):
        """Create containers if they don't exist"""
        for container_name in self.containers.values():
            try:
                container_client = self.blob_service_client.get_container_client(container_name)
                if not container_client.exists():
                    container_client.create_container(public_access="blob")
                    logger.info(f"Created container: {container_name}")
            except Exception as e:
                logger.warning(f"Container check/creation error for {container_name}: {str(e)}")
    
    async def upload_face_image(
        self,
        image_bytes: bytes,
        user_id: int,
        content_type: str = "image/jpeg"
    ) -> str:
        """Upload face image and return URL"""
        return await self._upload_image(
            image_bytes,
            self.containers["faces"],
            f"user_{user_id}",
            content_type
        )
    
    # async def upload_outfit_image(
    #     self,
    #     image_bytes: bytes,
    #     user_id: int,
    #     session_id: Optional[int] = None,
    #     content_type: str = "image/jpeg"
    # ) -> str:
    #     """Upload outfit image and return URL"""
    #     prefix = f"user_{user_id}"
    #     if session_id:
    #         prefix += f"_session_{session_id}"
        
    #     return await self._upload_image(
    #         image_bytes,
    #         self.containers["outfits"],
    #         prefix,
    #         content_type
    #     )
    
    # async def upload_accessory_image(
    #     self,
    #     image_bytes: bytes,
    #     user_id: int,
    #     session_id: Optional[int] = None,
    #     content_type: str = "image/jpeg"
    # ) -> str:
    #     """Upload accessory image and return URL"""
    #     prefix = f"user_{user_id}"
    #     if session_id:
    #         prefix += f"_session_{session_id}"
        
    #     return await self._upload_image(
    #         image_bytes,
    #         self.containers["accessories"],
    #         prefix,
    #         content_type
    #     )
    
    async def upload_result_image(
        self,
        image_bytes: bytes,
        user_id: int,
        session_id: int,
        content_type: str = "image/jpeg"
    ) -> str:
        """Upload final makeup result image"""
        return await self._upload_image(
            image_bytes,
            self.containers["results"],
            f"user_{user_id}_session_{session_id}",
            content_type
        )
    
    async def upload_product_image(
        self,
        image_bytes: bytes,
        user_id: int,
        content_type: str = "image/jpeg"
    ) -> str:
        """Upload product image for vanity"""
        return await self._upload_image(
            image_bytes,
            self.containers["results"],  # Using results container for product images
            f"user_{user_id}_product",
            content_type
        )
    
    async def _upload_image(
        self,
        image_bytes: bytes,
        container_name: str,
        prefix: str,
        content_type: str
    ) -> str:
        """Generic image upload method"""
        try:
            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            extension = content_type.split('/')[-1]
            blob_name = f"{prefix}_{timestamp}_{unique_id}.{extension}"
            
            # Get blob client
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )
            
            # Set content settings
            content_settings = ContentSettings(content_type=content_type)
            
            # Upload
            blob_client.upload_blob(
                image_bytes,
                overwrite=True,
                content_settings=content_settings
            )
            
            # Return URL
            blob_url = blob_client.url
            logger.info(f"Uploaded image: {blob_url}")
            return blob_url
            
        except Exception as e:
            logger.error(f"Image upload error: {str(e)}")
            raise
    
    async def delete_image(self, blob_url: str) -> bool:
        """Delete an image from storage"""
        try:
            # Extract container and blob name from URL
            url_parts = blob_url.split('/')
            container_name = url_parts[-2]
            blob_name = url_parts[-1]
            
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )
            
            blob_client.delete_blob()
            logger.info(f"Deleted image: {blob_url}")
            return True
            
        except Exception as e:
            logger.error(f"Image deletion error: {str(e)}")
            return False
    
    async def get_image_url_with_sas(
        self,
        blob_url: str,
        expiry_hours: int = 24
    ) -> str:
        """Generate SAS URL for temporary access"""
        try:
            # Extract container and blob name
            url_parts = blob_url.split('/')
            container_name = url_parts[-2]
            blob_name = url_parts[-1]
            
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=blob_name
            )
            
            # Generate SAS token
            from azure.storage.blob import generate_blob_sas, BlobSasPermissions
            
            sas_token = generate_blob_sas(
                account_name=blob_client.account_name,
                container_name=container_name,
                blob_name=blob_name,
                account_key=blob_client.credential.account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
            )
            
            return f"{blob_url}?{sas_token}"
            
        except Exception as e:
            logger.error(f"SAS URL generation error: {str(e)}")
            return blob_url
        
    async def upload_file(self, container_key: str, file_bytes: bytes, blob_name: str, content_type: str = None) -> str:
        """Upload any file (image, json, etc.) to the specified container"""
        try:
            container_name = self.containers.get(container_key)
            if not container_name:
                raise ValueError(f"Invalid container key: {container_key}")

            container_client = self.blob_service_client.get_container_client(container_name)

            # Create container if not exists
            try:
                await container_client.create_container()
                logger.info(f"🆕 Created container: {container_name}")
            except Exception:
                pass

            blob_name = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{blob_name}"
            blob_client = container_client.get_blob_client(blob_name)

            await blob_client.upload_blob(file_bytes, overwrite=True, content_type=content_type)
            blob_url = blob_client.url

            logger.info(f"✅ Uploaded {blob_name} to {container_name}: {blob_url}")
            return blob_url

        except Exception as e:
            logger.error(f"❌ Upload failed for {blob_name}: {str(e)}")
            raise

    async def upload_product_database(self, product_data: dict):
        """
        Upload product database (JSON file) to the products container
        """
        json_bytes = json.dumps(product_data, indent=2).encode("utf-8")
        return await self.upload_file(
            "products",
            file_bytes=json_bytes,
            blob_name="product_database.json",
            content_type="application/json"
        )
# Singleton instance
storage_service = StorageService()
"""
GlamAI - Core Configuration
Centralized settings management using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator, Field
from typing import List, Optional
import secrets


class Settings(BaseSettings):
    """Application Settings"""
    
    # Application
    APP_NAME: str = "GlamAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str
    DATABASE_URL_SYNC: str
    
    # Security
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Azure Computer Vision
    AZURE_VISION_ENDPOINT: str
    AZURE_VISION_KEY: str
    
    # Azure Custom Vision
    AZURE_CUSTOM_VISION_ENDPOINT: str
    AZURE_CUSTOM_VISION_KEY: str
    AZURE_CUSTOM_VISION_PROJECT_ID: str
    AZURE_CUSTOM_VISION_ITERATION_NAME: str
    # GPT-4 Vision
    ENABLE_CUSTOM_VISION: bool = False
    ENABLE_GPT4_VISION: bool = True
    
    # Azure Speech
    AZURE_SPEECH_KEY: str
    AZURE_SPEECH_REGION: str
    
    # Azure Translator
    AZURE_TRANSLATOR_KEY: str
    AZURE_TRANSLATOR_ENDPOINT: str
    AZURE_TRANSLATOR_REGION: str
    
    # Azure Language
    AZURE_LANGUAGE_KEY: str
    AZURE_LANGUAGE_ENDPOINT: str
    
    # Azure AI Search
    AZURE_SEARCH_ENDPOINT: str
    AZURE_SEARCH_KEY: str
    AZURE_SEARCH_INDEX_NAME: str = "products-index-v2"
    
    # Azure Blob Storage
    AZURE_STORAGE_ACCOUNT_NAME: str
    AZURE_STORAGE_KEY: str
    AZURE_STORAGE_CONNECTION_STRING: str
    AZURE_STORAGE_CONTAINER_FACES: str = "faces"
    AZURE_STORAGE_CONTAINER_OUTFITS: str = "outfits"
    AZURE_STORAGE_CONTAINER_ACCESSORIES: str = "accessories"
    AZURE_STORAGE_CONTAINER_RESULTS: str = "results"
    AZURE_STORAGE_CONTAINER_PRODUCTS: str = "products"
    
    # Azure Form Recognizer
    AZURE_FORM_RECOGNIZER_ENDPOINT: str
    AZURE_FORM_RECOGNIZER_KEY: str
    
    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_BASE_URL: str
    AZURE_OPENAI_DEPLOYMENT_NAME: str
    AZURE_OPENAI_API_VERSION: str = "2024-08-01-preview"

    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp"]
    ALLOWED_VIDEO_EXTENSIONS: List[str] = ["mp4", "mov", "avi"]
    
    # Email (optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/glamai.log"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Features Toggle
    ENABLE_SHOPPING_FEATURE: bool = True
    ENABLE_HAIR_STYLING: bool = True
    ENABLE_SKIN_ANALYSIS: bool = True
    ENABLE_VOICE_GUIDANCE: bool = True
    
    # External APIs
    NYKAA_AFFILIATE_ID: Optional[str] = None
    AMAZON_AFFILIATE_TAG: Optional[str] = None
    
    # Timezone
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @field_validator("ALLOWED_IMAGE_EXTENSIONS", mode="before")
    @classmethod
    def parse_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()
"""
GlamAI - Azure Computer Vision Service
Face analysis, outfit detection, and image processing
"""

from loguru import logger
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential
from app.services.azure.llm_service import llm_service
from azure.cognitiveservices.vision.customvision.prediction import CustomVisionPredictionClient
from app.services.llm.accessory_parser import extract_outfit_and_accessories
from msrest.authentication import ApiKeyCredentials
from app.core.config import settings
from typing import Dict, Any, List, Optional
from PIL import Image
import io
import cv2
import numpy as np


class VisionService:
    """Azure Computer Vision and Custom Vision integration"""
    
    def __init__(self):
        # Computer Vision Client
        self.vision_client = ImageAnalysisClient(
            endpoint=settings.AZURE_VISION_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_VISION_KEY)
        )
        
        # Custom Vision Client (for accessories)
        self.custom_vision_credentials = ApiKeyCredentials(
            in_headers={"Prediction-key": settings.AZURE_CUSTOM_VISION_KEY}
        )
        self.custom_vision_client = CustomVisionPredictionClient(
            settings.AZURE_CUSTOM_VISION_ENDPOINT,
            self.custom_vision_credentials
        )
    
    async def analyze_face_for_skin(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze face image to determine skin tone, undertone, and type
        Returns: {skin_tone, undertone, skin_type, confidence, details}
        """
        try:
            # Analyze image with Azure Vision
            result = self.vision_client.analyze(
                image_data=image_bytes,
                visual_features=[
                    VisualFeatures.PEOPLE,
                    VisualFeatures.TAGS,
                    VisualFeatures.CAPTION
                ]
            )
            
            # Extract face region
            face_analysis = self._extract_face_features(image_bytes)
            
            # Determine skin characteristics
            skin_analysis = self._analyze_skin_characteristics(face_analysis)
            
            # Detect skin concerns
            concerns = await self._detect_skin_concerns(image_bytes)
            
            return {
                "skin_tone": skin_analysis["tone"],
                "undertone": skin_analysis["undertone"],
                "skin_type": skin_analysis["type"],
                "confidence": skin_analysis["confidence"],
                "concerns": concerns,
                "raw_data": {
                    "azure_result": result.as_dict() if hasattr(result, 'as_dict') else {},
                    "face_features": face_analysis
                }
            }
            
        except Exception as e:
            logger.error(f"Face analysis error: {str(e)}")
            raise
    
    def _extract_face_features(self, image_bytes: bytes) -> Dict[str, Any]:
        """Extract detailed face features using OpenCV"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Convert to RGB for processing
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Detect face
            face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            faces = face_cascade.detectMultiScale(
                cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 
                1.1, 4
            )
            
            if len(faces) == 0:
                raise ValueError("No face detected in image")
            
            # Get largest face
            x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
            face_region = img_rgb[y:y+h, x:x+w]
            
            # Calculate average color of face regions
            cheek_region = face_region[h//3:2*h//3, w//4:3*w//4]
            avg_color = np.mean(cheek_region, axis=(0, 1))
            
            return {
                "face_bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                "avg_color_rgb": avg_color.tolist(),
                "cheek_color": np.mean(cheek_region, axis=(0, 1)).tolist()
            }
            
        except Exception as e:
            logger.error(f"Face feature extraction error: {str(e)}")
            return {}
    
    def _analyze_skin_characteristics(self, face_features: Dict[str, Any]) -> Dict[str, Any]:
        """Determine skin tone, undertone, and type from face features"""
        if not face_features or "avg_color_rgb" not in face_features:
            return {
                "tone": "Medium",
                "undertone": "Neutral",
                "type": "Normal",
                "confidence": 0.5
            }
        
        r, g, b = face_features["avg_color_rgb"]
        
        # Determine skin tone (Light, Medium, Dark)
        brightness = (r + g + b) / 3
        if brightness > 200:
            tone = "Light"
        elif brightness > 150:
            tone = "Medium"
        else:
            tone = "Dark"
        
        # Determine undertone (Warm, Cool, Neutral)
        if r > g and r > b:
            undertone = "Warm"
        elif b > r and b > g:
            undertone = "Cool"
        else:
            undertone = "Neutral"
        
        # Skin type is harder to determine from image alone
        # We'll default to Combination and let user confirm/change
        skin_type = "Combination"
        
        return {
            "tone": tone,
            "undertone": undertone,
            "type": skin_type,
            "confidence": 0.75
        }
    
    async def _detect_skin_concerns(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """Detect skin concerns like acne, pigmentation, dark spots"""
        concerns = []
        
        try:
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            img_array = np.array(image)
            
            # Simple heuristic detection (in production, use trained ML model)
            # Detect redness (potential acne)
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
            # Red mask for acne detection
            lower_red = np.array([0, 50, 50])
            upper_red = np.array([10, 255, 255])
            red_mask = cv2.inRange(hsv, lower_red, upper_red)
            
            red_percentage = (np.sum(red_mask > 0) / red_mask.size) * 100
            
            if red_percentage > 2:
                concerns.append({
                    "type": "acne",
                    "severity": "mild" if red_percentage < 5 else "moderate",
                    "confidence": 0.6,
                    "detected_automatically": True
                })
            
            # Dark spot detection (simplified)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            _, dark_spots = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)
            dark_percentage = (np.sum(dark_spots > 0) / dark_spots.size) * 100
            
            if dark_percentage > 5:
                concerns.append({
                    "type": "dark_spots",
                    "severity": "moderate",
                    "confidence": 0.5,
                    "detected_automatically": True
                })
            
        except Exception as e:
            logger.warning(f"Skin concern detection error: {str(e)}")
        
        return concerns
    
    async def analyze_outfit_text(self, description: str):
        """
        Analyze outfit description using local parser first,
        fallback to GPT-based parser if needed.
        """
        try:
            # 1️⃣ Fast local text parsing (regex-based)
            parsed = await extract_outfit_and_accessories(description)
            logger.info(f"🧠 Local outfit parse: {parsed}")

            # 2️⃣ If colors/accessories look weak, fallback to GPT LLM
            if (not parsed.get("colors")) or len(parsed.get("accessories", {})) == 0:
                logger.info("⚙️ Fallback to GPT parser for better accuracy...")
                llm_result = await llm_service.parse_outfit_description(description)

                # Merge missing fields
                for key, val in llm_result.items():
                    if not parsed.get(key):
                        parsed[key] = val

            # 3️⃣ Ensure all required keys exist
            return {
                "refined_description": parsed.get("refined_description", description),
                "outfit_type": parsed.get("outfit_type", "unknown"),
                "colors": parsed.get("colors", []),
                "dominant_color": parsed.get("dominant_color", None),
                "accessories": parsed.get("accessories", {}),
                "confidence": parsed.get("confidence", 0.9),
            }

        except Exception as e:
            logger.error(f"❌ analyze_outfit_text failed: {e}")
            return {
                "refined_description": description,
                "outfit_type": "unknown",
                "colors": [],
                "dominant_color": None,
                "accessories": {},
                "confidence": 0.0,
            }


    def _determine_outfit_style(self, vision_result) -> str:
        """Determine outfit style from vision analysis"""
        tags = []
        if hasattr(vision_result, 'tags'):
            tags = [tag.name.lower() for tag in vision_result.tags.list]
        
        if any(word in tags for word in ['traditional', 'saree', 'ethnic']):
            return "traditional"
        elif any(word in tags for word in ['formal', 'suit', 'blazer']):
            return "formal"
        elif any(word in tags for word in ['casual', 'jeans', 't-shirt']):
            return "casual"
        elif any(word in tags for word in ['party', 'dress', 'gown']):
            return "party"
        else:
            return "modern"
    
    

# Singleton instance
vision_service = VisionService()
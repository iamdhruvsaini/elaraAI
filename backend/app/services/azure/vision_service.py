# """
# GlamAI - Azure Computer Vision Service
# Face analysis, outfit detection, and image processing
# """

# from loguru import logger
# from azure.ai.vision.imageanalysis import ImageAnalysisClient
# from azure.ai.vision.imageanalysis.models import VisualFeatures
# from azure.core.credentials import AzureKeyCredential
# from app.services.azure.llm_service import llm_service
# from azure.cognitiveservices.vision.customvision.prediction import CustomVisionPredictionClient
# from app.services.llm.accessory_parser import extract_outfit_and_accessories
# from msrest.authentication import ApiKeyCredentials
# from app.core.config import settings
# from typing import Dict, Any, List, Optional
# from PIL import Image
# import io
# import cv2
# import numpy as np


# class VisionService:
#     """Azure Computer Vision and Custom Vision integration"""
    
#     def __init__(self):
#         # Computer Vision Client
#         self.vision_client = ImageAnalysisClient(
#             endpoint=settings.AZURE_VISION_ENDPOINT,
#             credential=AzureKeyCredential(settings.AZURE_VISION_KEY)
#         )
        
#         # Custom Vision Client (for accessories)
#         self.custom_vision_credentials = ApiKeyCredentials(
#             in_headers={"Prediction-key": settings.AZURE_CUSTOM_VISION_KEY}
#         )
#         self.custom_vision_client = CustomVisionPredictionClient(
#             settings.AZURE_CUSTOM_VISION_ENDPOINT,
#             self.custom_vision_credentials
#         )
    
#     async def analyze_face_for_skin(self, image_bytes: bytes) -> Dict[str, Any]:
#         """
#         Analyze face image to determine skin tone, undertone, and type
#         Returns: {skin_tone, undertone, skin_type, confidence, details}
#         """
#         try:
#             # Analyze image with Azure Vision
#             result = self.vision_client.analyze(
#                 image_data=image_bytes,
#                 visual_features=[
#                     VisualFeatures.PEOPLE,
#                     VisualFeatures.TAGS,
#                     VisualFeatures.CAPTION
#                 ]
#             )
            
#             # Extract face region
#             face_analysis = self._extract_face_features(image_bytes)
            
#             # Determine skin characteristics
#             skin_analysis = self._analyze_skin_characteristics(face_analysis)
            
#             # Detect skin concerns
#             concerns = await self._detect_skin_concerns(image_bytes)
            
#             return {
#                 "skin_tone": skin_analysis["tone"],
#                 "undertone": skin_analysis["undertone"],
#                 "skin_type": skin_analysis["type"],
#                 "confidence": skin_analysis["confidence"],
#                 "concerns": concerns,
#                 "raw_data": {
#                     "azure_result": result.as_dict() if hasattr(result, 'as_dict') else {},
#                     "face_features": face_analysis
#                 }
#             }
            
#         except Exception as e:
#             logger.error(f"Face analysis error: {str(e)}")
#             raise
    
#     def _extract_face_features(self, image_bytes: bytes) -> Dict[str, Any]:
#         """Extract detailed face features using OpenCV"""
#         try:
#             # Convert bytes to numpy array
#             nparr = np.frombuffer(image_bytes, np.uint8)
#             img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
#             # Convert to RGB for processing
#             img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
#             # Detect face
#             face_cascade = cv2.CascadeClassifier(
#                 cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
#             )
#             faces = face_cascade.detectMultiScale(
#                 cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 
#                 1.1, 4
#             )
            
#             if len(faces) == 0:
#                 raise ValueError("No face detected in image")
            
#             # Get largest face
#             x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
#             face_region = img_rgb[y:y+h, x:x+w]
            
#             # Calculate average color of face regions
#             cheek_region = face_region[h//3:2*h//3, w//4:3*w//4]
#             avg_color = np.mean(cheek_region, axis=(0, 1))
            
#             return {
#                 "face_bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
#                 "avg_color_rgb": avg_color.tolist(),
#                 "cheek_color": np.mean(cheek_region, axis=(0, 1)).tolist()
#             }
            
#         except Exception as e:
#             logger.error(f"Face feature extraction error: {str(e)}")
#             return {}
    
#     def _analyze_skin_characteristics(self, face_features: Dict[str, Any]) -> Dict[str, Any]:
#         """Determine skin tone, undertone, and type from face features"""
#         if not face_features or "avg_color_rgb" not in face_features:
#             return {
#                 "tone": "Medium",
#                 "undertone": "Neutral",
#                 "type": "Normal",
#                 "confidence": 0.5
#             }
        
#         r, g, b = face_features["avg_color_rgb"]
        
#         # Determine skin tone (Light, Medium, Dark)
#         brightness = (r + g + b) / 3
#         if brightness > 200:
#             tone = "Light"
#         elif brightness > 150:
#             tone = "Medium"
#         else:
#             tone = "Dark"
        
#         # Determine undertone (Warm, Cool, Neutral)
#         if r > g and r > b:
#             undertone = "Warm"
#         elif b > r and b > g:
#             undertone = "Cool"
#         else:
#             undertone = "Neutral"
        
#         # Skin type is harder to determine from image alone
#         # We'll default to Combination and let user confirm/change
#         skin_type = "Combination"
        
#         return {
#             "tone": tone,
#             "undertone": undertone,
#             "type": skin_type,
#             "confidence": 0.75
#         }
    
#     async def _detect_skin_concerns(self, image_bytes: bytes) -> List[Dict[str, Any]]:
#         """Detect skin concerns like acne, pigmentation, dark spots"""
#         concerns = []
        
#         try:
#             # Convert to PIL Image
#             image = Image.open(io.BytesIO(image_bytes))
#             img_array = np.array(image)
            
#             # Simple heuristic detection (in production, use trained ML model)
#             # Detect redness (potential acne)
#             hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
#             # Red mask for acne detection
#             lower_red = np.array([0, 50, 50])
#             upper_red = np.array([10, 255, 255])
#             red_mask = cv2.inRange(hsv, lower_red, upper_red)
            
#             red_percentage = (np.sum(red_mask > 0) / red_mask.size) * 100
            
#             if red_percentage > 2:
#                 concerns.append({
#                     "type": "acne",
#                     "severity": "mild" if red_percentage < 5 else "moderate",
#                     "confidence": 0.6,
#                     "detected_automatically": True
#                 })
            
#             # Dark spot detection (simplified)
#             gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
#             _, dark_spots = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)
#             dark_percentage = (np.sum(dark_spots > 0) / dark_spots.size) * 100
            
#             if dark_percentage > 5:
#                 concerns.append({
#                     "type": "dark_spots",
#                     "severity": "moderate",
#                     "confidence": 0.5,
#                     "detected_automatically": True
#                 })
            
#         except Exception as e:
#             logger.warning(f"Skin concern detection error: {str(e)}")
        
#         return concerns
    
#     async def analyze_outfit_text(self, description: str):
#         """
#         Analyze outfit description using local parser first,
#         fallback to GPT-based parser if needed.
#         """
#         try:
#             # 1️⃣ Fast local text parsing (regex-based)
#             parsed = await extract_outfit_and_accessories(description)
#             logger.info(f"🧠 Local outfit parse: {parsed}")

#             # 2️⃣ If colors/accessories look weak, fallback to GPT LLM
#             if (not parsed.get("colors")) or len(parsed.get("accessories", {})) == 0:
#                 logger.info("⚙️ Fallback to GPT parser for better accuracy...")
#                 llm_result = await llm_service.parse_outfit_description(description)

#                 # Merge missing fields
#                 for key, val in llm_result.items():
#                     if not parsed.get(key):
#                         parsed[key] = val

#             # 3️⃣ Ensure all required keys exist
#             return {
#                 "refined_description": parsed.get("refined_description", description),
#                 "outfit_type": parsed.get("outfit_type", "unknown"),
#                 "colors": parsed.get("colors", []),
#                 "dominant_color": parsed.get("dominant_color", None),
#                 "accessories": parsed.get("accessories", {}),
#                 "confidence": parsed.get("confidence", 0.9),
#             }

#         except Exception as e:
#             logger.error(f"❌ analyze_outfit_text failed: {e}")
#             return {
#                 "refined_description": description,
#                 "outfit_type": "unknown",
#                 "colors": [],
#                 "dominant_color": None,
#                 "accessories": {},
#                 "confidence": 0.0,
#             }


#     def _determine_outfit_style(self, vision_result) -> str:
#         """Determine outfit style from vision analysis"""
#         tags = []
#         if hasattr(vision_result, 'tags'):
#             tags = [tag.name.lower() for tag in vision_result.tags.list]
        
#         if any(word in tags for word in ['traditional', 'saree', 'ethnic']):
#             return "traditional"
#         elif any(word in tags for word in ['formal', 'suit', 'blazer']):
#             return "formal"
#         elif any(word in tags for word in ['casual', 'jeans', 't-shirt']):
#             return "casual"
#         elif any(word in tags for word in ['party', 'dress', 'gown']):
#             return "party"
#         else:
#             return "modern"
    
    

# # Singleton instance
# vision_service = VisionService()


"""
GlamAI - Advanced Azure Vision Service
Comprehensive skin analysis for virtual makeup application
"""

from loguru import logger
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential
from openai import AsyncAzureOpenAI
from app.core.config import settings
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
import io
import cv2
import numpy as np
import base64
import json
import re
from json import JSONDecodeError
from dataclasses import dataclass
from enum import Enum
import imghdr


class SkinToneCategory(str, Enum):
    """Fitzpatrick Scale based skin tone categories"""
    VERY_FAIR = "Very Fair"  # Type I
    FAIR = "Fair"  # Type II
    LIGHT = "Light"  # Type III
    MEDIUM = "Medium"  # Type IV
    TAN = "Tan"  # Type V
    DEEP = "Deep"  # Type VI


class UndertoneType(str, Enum):
    WARM = "Warm"
    COOL = "Cool"
    NEUTRAL = "Neutral"
    OLIVE = "Olive"


class SkinType(str, Enum):
    OILY = "Oily"
    DRY = "Dry"
    COMBINATION = "Combination"
    NORMAL = "Normal"
    SENSITIVE = "Sensitive"


@dataclass
class SkinAnalysisResult:
    """Comprehensive skin analysis result"""
    skin_tone: str
    skin_tone_hex: str
    fitzpatrick_scale: str
    undertone: str
    skin_type: str
    concerns: List[Dict[str, Any]]
    texture_score: float
    hydration_level: str
    oil_level: str
    pore_size: str
    face_shape: str
    facial_features: Dict[str, Any]
    confidence_scores: Dict[str, float]
    recommendations: List[str]
    raw_data: Dict[str, Any]


class AdvancedVisionService:
    """Advanced skin analysis using multiple AI services"""

    def __init__(self):
        # Azure Computer Vision Client
        self.vision_client = ImageAnalysisClient(
            endpoint=settings.AZURE_VISION_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_VISION_KEY)
        )
        
        # Azure OpenAI GPT-4 Vision Client
        self.openai_client = self.openai_client = AsyncAzureOpenAI(
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION
        )
        
        # Face detection cascade
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )

    async def analyze_face_comprehensive(
        self, 
        image_bytes: bytes
    ) -> SkinAnalysisResult:
        """
        Comprehensive face and skin analysis combining multiple AI services
        """
        try:
            logger.info("Starting comprehensive skin analysis...")
            
            # 1. Basic image processing and face detection
            face_data = self._extract_face_features(image_bytes)
            if not face_data:
                raise ValueError("No face detected in image")
            
            # 2. Azure Computer Vision analysis
            azure_result = await self._azure_vision_analysis(image_bytes)
            
            # 3. GPT-4 Vision deep analysis
            gpt4_result = await self._gpt4_vision_analysis(image_bytes)
            
            # 4. OpenCV-based texture and feature analysis
            texture_analysis = self._analyze_skin_texture(image_bytes, face_data)
            
            # 5. Color analysis for skin tone and undertone
            color_analysis = self._analyze_skin_color(image_bytes, face_data)
            
            # 6. Merge all results
            final_result = self._merge_analysis_results(
                face_data=face_data,
                azure_result=azure_result,
                gpt4_result=gpt4_result,
                texture_analysis=texture_analysis,
                color_analysis=color_analysis
            )
            
            logger.info(f"✅ Skin analysis completed: {final_result.skin_tone}, {final_result.undertone}")
            
            return final_result
            
        except Exception as e:
            logger.error(f"❌ Comprehensive analysis error: {str(e)}")
            raise

    def _extract_face_features(self, image_bytes: bytes) -> Optional[Dict[str, Any]]:
        """Extract detailed face features using OpenCV"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Failed to decode image")
            
            # Convert to RGB
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) == 0:
                logger.warning("No face detected")
                return None
            
            # Get largest face
            x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
            face_region = img_rgb[y:y+h, x:x+w]
            
            # Detect eyes
            face_gray = gray[y:y+h, x:x+w]
            eyes = self.eye_cascade.detectMultiScale(face_gray)
            
            # Extract different face regions for analysis
            regions = self._extract_face_regions(face_region, w, h)
            
            return {
                "face_bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                "face_region": face_region,
                "regions": regions,
                "eyes_detected": len(eyes),
                "image_size": img.shape,
                "gray_face": face_gray
            }
            
        except Exception as e:
            logger.error(f"Face feature extraction error: {str(e)}")
            return None

    def _extract_face_regions(
        self, 
        face_region: np.ndarray, 
        w: int, 
        h: int
    ) -> Dict[str, np.ndarray]:
        """Extract specific face regions for detailed analysis"""
        return {
            "forehead": face_region[0:h//3, w//4:3*w//4],
            "left_cheek": face_region[h//3:2*h//3, 0:w//3],
            "right_cheek": face_region[h//3:2*h//3, 2*w//3:w],
            "nose": face_region[h//3:2*h//3, w//3:2*w//3],
            "chin": face_region[2*h//3:h, w//4:3*w//4],
            "full_face": face_region
        }

    async def _azure_vision_analysis(self, image_bytes: bytes) -> Dict[str, Any]:
        """Azure Computer Vision analysis"""
        try:
            result = self.vision_client.analyze(
                image_data=image_bytes,
                visual_features=[
                    VisualFeatures.PEOPLE,
                    VisualFeatures.TAGS,
                    VisualFeatures.CAPTION,
                    VisualFeatures.OBJECTS
                ]
            )
            
            return {
                # "caption": result.caption.text if result.caption else None,
                # "tags": [tag.name for tag in result.tags.list] if result.tags else [],
                "confidence": result.caption.confidence if result.caption else 0.0,
                # "people_detected": len(result.people.list) if result.people else 0
            }
            
        except Exception as e:
            logger.warning(f"Azure Vision analysis error: {str(e)}")
            return {}

    

    async def _gpt4_vision_analysis(self, image_bytes: bytes) -> dict:
        """Robust GPT-4o Vision dermatological analysis with safe JSON parsing and Azure compatibility."""
        try:
            # 🧩 Validate image format
            mime = imghdr.what(None, image_bytes)
            if mime not in ["jpeg", "png"]:
                raise ValueError(f"Unsupported image format: {mime}")
            if len(image_bytes) > 10 * 1024 * 1024:
                raise ValueError("Image exceeds 10MB limit.")
            logger.info(f"🖼️ Valid image input: {mime}, {len(image_bytes)} bytes")

            # Convert to base64 for GPT-4o Vision input
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

            # ================== PROMPTS ==================
            system_prompt = (
                "You are an expert dermatologist and professional makeup artist. "
                "Analyze facial skin features precisely for cosmetic and skincare recommendations. "
                "Return only valid JSON. Do not include markdown, code fences, or commentary."
            )

            user_prompt = (
                "Analyze this face photo and return strictly a JSON object with these exact keys:\n"
                "{"
                "\"skin_tone\": \"Very Fair, Fair, Light, Medium, Tan, Deep\", "
                "\"fitzpatrick_scale\": \"Type I, II, III, IV, V, VI\", "
                "\"undertone\": \"Warm, Cool, Neutral, Olive\", "
                "\"skin_type\": \"Oily, Dry, Combination, Normal, Sensitive\", "
                "\"hydration_level\": \"Low, Normal, High\", "
                "\"oil_level\": \"Low, Normal, High\", "
                "\"pore_size\": \"Fine, Medium, Large\", "
                "\"texture_quality\": \"Smooth, Slightly Uneven, Uneven, Very Uneven\", "
                "\"face_shape\": \"Oval, Round, Square, Heart, Diamond, Oblong\", "
                "\"concerns\": ["
                "{\"type\": \"acne|dark_spots|hyperpigmentation|redness|fine_lines|wrinkles|dark_circles|uneven_texture|large_pores|dullness\", "
                "\"severity\": \"mild|moderate|severe\", "
                "\"locations\": [\"forehead\", \"cheeks\", \"nose\", \"chin\", \"around_eyes\"], "
                "\"confidence\": 0.0-1.0}"
                "], "
                "\"facial_features\": {"
                "\"eye_shape\": \"...\", \"lip_fullness\": \"...\", \"nose_shape\": \"...\", \"face_symmetry\": \"excellent|good|fair\"}, "
                "\"makeup_recommendations\": [\"...\", \"...\", \"...\"], "
                "\"confidence_overall\": 0.0-1.0"
                "} "
                "Respond only with valid JSON."
            )

            # ================== PRIMARY GPT-4o REQUEST ==================
            response = await self.openai_client.chat.completions.create(
                model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {"type": "image_url", "image_url": {
                                "url": f"data:image/{mime};base64,{base64_image}",
                                "detail": "high"
                            }},
                        ],
                    },
                ],
                max_tokens=2000,
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            # ================== RAW CONTENT EXTRACTION ==================
            content = getattr(response.choices[0].message, "content", None)
            if not content:
                content = getattr(response, "output_text", None)
            if not content and hasattr(response, "to_json"):
                try:
                    raw_json = response.to_json()
                    content = raw_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                except Exception:
                    pass

            # ================== RETRY IF EMPTY ==================
            if not content:
                logger.warning("⚠️ Empty GPT-4o Vision response. Retrying without response_format...")
                retry = await self.openai_client.chat.completions.create(
                    model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": user_prompt},
                                {"type": "image_url", "image_url": {
                                    "url": f"data:image/{mime};base64,{base64_image}",
                                    "detail": "high"
                                }},
                            ],
                        },
                    ],
                    max_tokens=2000,
                    temperature=0.3,
                )
                content = retry.choices[0].message.content or getattr(retry, "output_text", "")

            if not content:
                raise ValueError("GPT-4o Vision returned no content after retry.")

            # ================== JSON CLEANUP & PARSING ==================
            content = re.sub(r"^```json|```$", "", content.strip(), flags=re.MULTILINE).strip()

            try:
                analysis = json.loads(content)
            except JSONDecodeError as je:
                logger.warning(f"⚠️ Invalid JSON structure returned: {je} | Raw: {content[:200]}")
                match = re.search(r"\{.*\}", content, re.DOTALL)
                if match:
                    try:
                        analysis = json.loads(match.group(0))
                    except Exception:
                        analysis = {}
                else:
                    analysis = {}

            # ================== SAFE DEFAULTS ==================
            defaults = {
                "skin_tone": "Medium",
                "fitzpatrick_scale": "Type IV",
                "undertone": "Neutral",
                "skin_type": "Normal",
                "hydration_level": "Normal",
                "oil_level": "Normal",
                "pore_size": "Medium",
                "texture_quality": "Slightly Uneven",
                "face_shape": "Oval",
                "concerns": [],
                "facial_features": {},
                "makeup_recommendations": [],
                "confidence_overall": 0.6,
            }
            for key, val in defaults.items():
                analysis.setdefault(key, val)

            logger.info(f"✅ GPT-4o Vision analysis complete (confidence={analysis.get('confidence_overall', 0):.2f})")
            return analysis

        except Exception as e:
            logger.error(f"❌ GPT-4o Vision analysis error: {str(e)}")
            # Guaranteed safe fallback
            return {
                "skin_tone": "Medium",
                "fitzpatrick_scale": "Type IV",
                "undertone": "Neutral",
                "skin_type": "Normal",
                "hydration_level": "Normal",
                "oil_level": "Normal",
                "pore_size": "Medium",
                "texture_quality": "Slightly Uneven",
                "face_shape": "Oval",
                "concerns": [],
                "facial_features": {},
                "makeup_recommendations": [],
                "confidence_overall": 0.4,
            }


    def _analyze_skin_texture(
        self, 
        image_bytes: bytes, 
        face_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze skin texture using image processing"""
        try:
            regions = face_data.get("regions", {})
            
            # Analyze cheek region for texture
            cheek_region = regions.get("right_cheek")
            if cheek_region is None or cheek_region.size == 0:
                return {"texture_score": 0.5, "pore_visibility": "medium"}
            
            gray_cheek = cv2.cvtColor(cheek_region, cv2.COLOR_RGB2GRAY)
            
            # Calculate texture metrics
            # 1. Standard deviation (higher = more texture/roughness)
            texture_std = np.std(gray_cheek)
            
            # 2. Laplacian variance (higher = more edges/texture)
            laplacian = cv2.Laplacian(gray_cheek, cv2.CV_64F)
            texture_variance = laplacian.var()
            
            # 3. Normalize texture score (0-1, higher is smoother)
            texture_score = 1.0 - min(texture_std / 50.0, 1.0)
            
            # Determine pore visibility
            if texture_variance > 500:
                pore_visibility = "large"
            elif texture_variance > 200:
                pore_visibility = "medium"
            else:
                pore_visibility = "fine"
            
            return {
                "texture_score": float(texture_score),
                "texture_std": float(texture_std),
                "texture_variance": float(texture_variance),
                "pore_visibility": pore_visibility
            }
            
        except Exception as e:
            logger.warning(f"Texture analysis error: {str(e)}")
            return {"texture_score": 0.5, "pore_visibility": "medium"}

    def _analyze_skin_color(
        self, 
        image_bytes: bytes, 
        face_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Detailed color analysis for skin tone and undertone"""
        try:
            regions = face_data.get("regions", {})
            
            # Analyze multiple regions for accurate color
            cheek_region = regions.get("right_cheek")
            forehead_region = regions.get("forehead")
            
            if cheek_region is None or cheek_region.size == 0:
                return {}
            
            # Get average colors in different color spaces
            rgb_cheek = np.mean(cheek_region, axis=(0, 1))
            
            # Convert to different color spaces
            cheek_hsv = cv2.cvtColor(
                cheek_region, 
                cv2.COLOR_RGB2HSV
            )
            hsv_values = np.mean(cheek_hsv, axis=(0, 1))
            
            cheek_lab = cv2.cvtColor(
                cheek_region, 
                cv2.COLOR_RGB2LAB
            )
            lab_values = np.mean(cheek_lab, axis=(0, 1))
            
            # Determine skin tone based on brightness
            brightness = np.mean(rgb_cheek)
            
            if brightness > 220:
                tone = SkinToneCategory.VERY_FAIR
                fitzpatrick = "Type I"
            elif brightness > 200:
                tone = SkinToneCategory.FAIR
                fitzpatrick = "Type II"
            elif brightness > 170:
                tone = SkinToneCategory.LIGHT
                fitzpatrick = "Type III"
            elif brightness > 140:
                tone = SkinToneCategory.MEDIUM
                fitzpatrick = "Type IV"
            elif brightness > 110:
                tone = SkinToneCategory.TAN
                fitzpatrick = "Type V"
            else:
                tone = SkinToneCategory.DEEP
                fitzpatrick = "Type VI"
            
            # Determine undertone using LAB color space
            a_value = lab_values[1]  # Green-Red axis
            b_value = lab_values[2]  # Blue-Yellow axis
            
            if b_value > 128 and a_value > 128:
                undertone = UndertoneType.WARM
            elif b_value < 128 and a_value < 128:
                undertone = UndertoneType.COOL
            elif abs(a_value - 128) < 10 and abs(b_value - 128) < 10:
                undertone = UndertoneType.NEUTRAL
            else:
                undertone = UndertoneType.OLIVE
            
            # Convert RGB to hex
            hex_color = "#{:02x}{:02x}{:02x}".format(
                int(rgb_cheek[0]), 
                int(rgb_cheek[1]), 
                int(rgb_cheek[2])
            )
            
            return {
                "skin_tone": tone.value,
                "fitzpatrick_scale": fitzpatrick,
                "undertone": undertone.value,
                "hex_color": hex_color,
                "rgb_values": rgb_cheek.tolist(),
                "hsv_values": hsv_values.tolist(),
                "lab_values": lab_values.tolist(),
                "brightness": float(brightness)
            }
            
        except Exception as e:
            logger.warning(f"Color analysis error: {str(e)}")
            return {
                "skin_tone": "Medium",
                "undertone": "Neutral",
                "hex_color": "#C8A882"
            }

    def _merge_analysis_results(
        self,
        face_data: Dict[str, Any],
        azure_result: Dict[str, Any],
        gpt4_result: Dict[str, Any],
        texture_analysis: Dict[str, Any],
        color_analysis: Dict[str, Any]
    ) -> SkinAnalysisResult:
        """Merge all analysis results with confidence weighting"""
        
        # Prioritize GPT-4 results (highest confidence) with OpenCV fallbacks
        skin_tone = gpt4_result.get("skin_tone") or color_analysis.get("skin_tone", "Medium")
        undertone = gpt4_result.get("undertone") or color_analysis.get("undertone", "Neutral")
        skin_type = gpt4_result.get("skin_type", "Normal")
        
        # Merge concerns from GPT-4
        concerns = gpt4_result.get("concerns", [])
        
        # Build confidence scores
        confidence_scores = {
            "overall": gpt4_result.get("confidence_overall", 0.85),
            "skin_tone": 0.9 if color_analysis else 0.7,
            "undertone": 0.85 if color_analysis else 0.7,
            "skin_type": gpt4_result.get("confidence_overall", 0.8),
            "concerns": np.mean([c.get("confidence", 0.7) for c in concerns]) if concerns else 0.7
        }
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            skin_tone=skin_tone,
            undertone=undertone,
            skin_type=skin_type,
            concerns=concerns
        )
        
        return SkinAnalysisResult(
            skin_tone=skin_tone,
            skin_tone_hex=color_analysis.get("hex_color", "#C8A882"),
            fitzpatrick_scale=gpt4_result.get("fitzpatrick_scale") or color_analysis.get("fitzpatrick_scale", "Type III"),
            undertone=undertone,
            skin_type=skin_type,
            concerns=concerns,
            texture_score=texture_analysis.get("texture_score", 0.7),
            hydration_level=gpt4_result.get("hydration_level", "Normal"),
            oil_level=gpt4_result.get("oil_level", "Normal"),
            pore_size=gpt4_result.get("pore_size") or texture_analysis.get("pore_visibility", "Medium"),
            face_shape=gpt4_result.get("face_shape", "Oval"),
            facial_features=gpt4_result.get("facial_features", {}),
            confidence_scores=confidence_scores,
            recommendations=recommendations + gpt4_result.get("makeup_recommendations", []),
            raw_data={
                "azure": azure_result,
                "gpt4": gpt4_result,
                "texture": texture_analysis,
                "color": color_analysis
            }
        )

    def _generate_recommendations(
        self,
        skin_tone: str,
        undertone: str,
        skin_type: str,
        concerns: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate personalized makeup recommendations"""
        recommendations = []
        
        # Foundation recommendations
        if undertone == "Warm":
            recommendations.append(f"Look for foundations with golden or yellow undertones to match your {skin_tone} warm complexion")
        elif undertone == "Cool":
            recommendations.append(f"Choose foundations with pink or blue undertones for your {skin_tone} cool complexion")
        else:
            recommendations.append(f"Neutral undertone foundations work best for your {skin_tone} skin")
        
        # Skin type recommendations
        if skin_type == "Oily":
            recommendations.append("Use oil-free, matte finish products and setting powder")
        elif skin_type == "Dry":
            recommendations.append("Choose hydrating, dewy finish products and avoid powder")
        elif skin_type == "Combination":
            recommendations.append("Use mattifying products on T-zone, hydrating products on dry areas")
        
        # Concern-based recommendations
        concern_types = [c.get("type") for c in concerns]
        
        if "dark_circles" in concern_types:
            recommendations.append("Use color-correcting concealer (peach/orange for dark circles)")
        
        if "redness" in concern_types:
            recommendations.append("Apply green color corrector before foundation to neutralize redness")
        
        if "hyperpigmentation" in concern_types or "dark_spots" in concern_types:
            recommendations.append("Use full-coverage foundation and concealer for even skin tone")
        
        return recommendations[:5]  # Return top 5 recommendations


# Singleton instance
vision_service = AdvancedVisionService()
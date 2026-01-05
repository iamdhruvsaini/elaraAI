"""
GlamAI - LLM Service (OpenAI GPT-4 / GPT-5)
AI-powered recommendations, makeup plans, and fashion understanding
"""

from openai import AsyncOpenAI
from app.core.config import settings
from typing import Dict, Any, List, Optional
from loguru import logger
import json


class LLMService:
    """OpenAI GPT model for intelligent makeup, styling, and analysis"""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            base_url=settings.AZURE_OPENAI_BASE_URL,
            default_query={"api-version": settings.AZURE_OPENAI_API_VERSION},
        )
        self.model = settings.AZURE_OPENAI_DEPLOYMENT_NAME

    # ============================================================
    # 🧩 TEXT-BASED OUTFIT + ACCESSORY PARSING
    # ============================================================
    async def parse_outfit_description(self, text: str) -> Dict[str, Any]:
        """
        Parse user-provided outfit text.
        Cleans spelling, extracts color, outfit type, and accessories.
        """
        try:
            prompt = f"""
You are a global fashion stylist AI specializing in all types of wear and accessories.

Analyze the following description and extract structured fashion details:

Description: "{text}"

Tasks:
1. Correct spelling and grammar errors
2. Identify outfit type (saree, lehenga, gown, kurta, dress, suit, etc.)
3. Detect colors (normalize to simple words: peach, gold, cream, red, blue)
4. Extract accessories with type and material

Return JSON:
{{
  "refined_description": "clean corrected text",
  "outfit_type": "lehenga|saree|kurta|dress|gown|other",
  "colors": ["color1", "color2"],
  "accessories": {{
     "ear": {{"item": "jhumka", "material": "gold"}},
     "neck": {{"item": "necklace", "material": "silver"}},
     "hand": {{"item": "bangle", "material": "silver"}}
  }},
  "confidence": 0.95
}}
"""
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a stylist extracting structured fashion information."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=700,
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content
            result = json.loads(content)
            logger.info(f"🧾 Parsed outfit: {result}")
            return result

        except Exception as e:
            logger.error(f"Outfit parsing error: {str(e)}")
            return {
                "refined_description": text,
                "outfit_type": "unknown",
                "colors": [],
                "accessories": {},
                "confidence": 0.5
            }

    # ============================================================
    # 💄 MAKEUP PLAN GENERATION
    # ============================================================
    async def generate_makeup_plan(
        self,
        user_profile: Dict[str, Any],
        occasion: str,
        scope: str,
        outfit_data: Dict[str, Any],
        accessories_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a complete makeup plan using outfit, profile, and accessories"""
        try:
            prompt = self._build_makeup_plan_prompt(
                user_profile, occasion, scope, outfit_data, accessories_data
            )

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert makeup artist. Create detailed, step-by-step, safe makeup looks."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            result.setdefault("occasion", occasion)
            result.setdefault("scope", scope)

            logger.info(f"💄 Makeup plan generated for occasion: {occasion}")
            return result

        except Exception as e:
            logger.error(f"Makeup plan generation error: {str(e)}")
            raise

    def _build_makeup_plan_prompt(
        self,
        user_profile: Dict[str, Any],
        occasion: str,
        scope: str,
        outfit_data: Dict[str, Any],
        accessories_data: Dict[str, Any]
    ) -> str:
        """Construct the LLM prompt for generating makeup recommendations"""

        concerns_text = ""
        if user_profile.get("skin_concerns"):
            concerns = [c.get("type", "") if isinstance(c, dict) else str(c) for c in user_profile["skin_concerns"]]
            concerns_text = f"\nSkin Concerns: {', '.join(concerns)}"

        allergies_text = ""
        if user_profile.get("allergies"):
            allergies_text = f"\nAllergies: {', '.join(user_profile['allergies'])}"

        return f"""
Create a detailed makeup plan for the following profile and context.

USER PROFILE:
- Skin Tone: {user_profile.get('skin_tone', 'Medium')}
- Undertone: {user_profile.get('undertone', 'Warm')}
- Skin Type: {user_profile.get('skin_type', 'Combination')}
{concerns_text}{allergies_text}

OUTFIT:
- Description: {outfit_data.get('refined_description', outfit_data.get('description', 'Not provided'))}
- Type: {outfit_data.get('outfit_type', 'unknown')}
- Colors: {', '.join(outfit_data.get('colors', []))}

ACCESSORIES:
{json.dumps(accessories_data, indent=2)}

OCCASION: {occasion}
MAKEUP SCOPE: {scope}

Generate a makeup plan that complements the outfit and occasion.

Return JSON:
{{
  "occasion": "{occasion}",
  "scope": "{scope}",
  "style": "style name",
  "reasoning": "why this style suits the outfit",
  "intensity": "subtle|moderate|bold",
  "steps": [
    {{
      "step_number": 1,
      "category": "foundation|eyes|lips|cheeks|base",
      "instruction": "step detail",
      "tool_needed": "brush|blender|fingers",
      "amount": "pea-size|thin layer",
      "technique": "how to apply",
      "expected_result": "description",
      "tips": ["tip1", "tip2"]
    }}
  ],
  "key_focus": ["eyes", "base", "lips"],
  "estimated_duration": 25,
  "difficulty": "beginner|intermediate|advanced"
}}
"""

    # ============================================================
    # 💍 ACCESSORY RECOMMENDATION
    # ============================================================
    async def generate_accessory_recommendation(
        self,
        outfit_data: Dict[str, Any],
        accessories_data: Dict[str, Any],
        occasion: str
    ) -> Dict[str, Any]:
        """Suggest accessory balance & improvement"""
        try:
            prompt = f"""
Analyze this outfit and accessories:

OUTFIT:
- {outfit_data.get('refined_description', outfit_data.get('description'))}
- Colors: {', '.join(outfit_data.get('colors', []))}
- Type: {outfit_data.get('outfit_type', 'unknown')}

ACCESSORIES:
{json.dumps(accessories_data, indent=2)}

OCCASION: {occasion}

Suggest which accessories to keep, modify, or remove.

Return JSON:
{{
  "keep_accessories": ["earrings", "bindi"],
  "remove_accessories": ["necklace"],
  "change_accessories": ["bangles"],
  "reasoning": "explanation",
  "makeup_style": "glam|ethnic|minimal",
  "intensity": "subtle|moderate|bold"
}}
"""
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional stylist balancing jewelry with outfit."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=800,
                response_format={"type": "json_object"}
            )

            return json.loads(response.choices[0].message.content)

        except Exception as e:
            logger.error(f"Accessory recommendation error: {str(e)}")
            raise

    # ============================================================
    # 💇‍♀️ HAIR STYLE RECOMMENDATION
    # ============================================================
    async def generate_hair_style_suggestion(
        self,
        outfit_description: str,
        outfit_style: Optional[str],
        occasion: str,
        face_shape: Optional[str] = None,
        hair_texture: Optional[str] = None,
        hair_length: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized hairstyle recommendation based on outfit and user preferences
        """
        try:
            # Build user context
            user_context = []
            if face_shape:
                user_context.append(f"Face shape: {face_shape}")
            if hair_texture:
                user_context.append(f"Hair texture: {hair_texture}")
            if hair_length:
                user_context.append(f"Current hair length: {hair_length}")
            
            user_info = "\n".join(user_context) if user_context else "No specific preferences provided"
            
            prompt = f"""You are an expert hairstylist and fashion consultant. Analyze the outfit and occasion to recommend the perfect hairstyle.

OUTFIT DESCRIPTION: {outfit_description}
OUTFIT STYLE: {outfit_style or 'Not specified'}
OCCASION: {occasion}

USER INFORMATION:
{user_info}

Provide a hairstyle recommendation that:
1. Complements the outfit style and occasion
2. Flatters the user's face shape (if provided)
3. Works with their hair texture and length (if provided)
4. Is practical and achievable

Return a JSON response with this EXACT structure:
{{
  "recommended_style": "Specific hairstyle name (e.g., 'Soft Waves with Side Part', 'Sleek Low Bun', 'Textured Beach Waves')",
  "style_attributes": ["Volume", "Elegant", "Medium Length"],
  "benefits": [
    {{
      "benefit": "Softens the jawline of your Square Face Shape",
      "description": "The soft waves create a gentle frame that balances angular features"
    }},
    {{
      "benefit": "Adds necessary volume to Fine Texture hair without weighing it down",
      "description": "Styling techniques enhance natural body while maintaining movement"
    }},
    {{
      "benefit": "Low maintenance choice, perfect for your Busy Schedule",
      "description": "Can be styled in 15 minutes and holds throughout the day"
    }}
  ],
  "alternatives": ["Alternative style 1", "Alternative style 2", "Alternative style 3"],
  "styling_tips": [
    "Start with a volumizing mousse on damp roots",
    "Use a 1.25\" barrel curling iron, wrapping away from face",
    "Brush out curls gently and set with flexible hold spray"
  ],
  "maintenance_level": "Low|Medium|High"
}}

IMPORTANT GUIDELINES:
- recommended_style: Be specific (not just "waves" but "Soft Waves with Side Part")
- style_attributes: 2-4 key characteristics (Volume, Sleek, Romantic, Structured, Textured, etc.)
- benefits: Provide 3 benefits that directly relate to the user's face shape, hair texture, or lifestyle
- alternatives: 3 different styles that would also work
- styling_tips: 3-4 practical, numbered steps
- maintenance_level: Rate as Low, Medium, or High based on styling time and upkeep
"""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional hairstylist with expertise in matching hairstyles to outfits, occasions, and individual features. Provide detailed, practical recommendations."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate response structure
            required_keys = ["recommended_style", "benefits", "styling_tips"]
            if not all(key in result for key in required_keys):
                raise ValueError("Invalid response structure from LLM")
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in hair style suggestion: {str(e)}")
            raise ValueError("Failed to parse AI response")
        except Exception as e:
            logger.error(f"Hair style suggestion error: {str(e)}")
            raise Exception(f"Failed to generate hairstyle recommendation: {str(e)}")

    # ============================================================
    # 🧴 PRODUCT SAFETY CHECK (UNIFIED VERSION)
    # ============================================================
    async def check_product_safety(
        self, 
        product_name: str, 
        product_ingredients: List[str], 
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Smart safety check for a cosmetic product using AI reasoning.
        
        Args:
            product_name: Name of the product
            product_ingredients: List of ingredients
            user_profile: Dict with allergies, skin_type, skin_tone, skin_concerns
        
        Returns:
            Dict with safety analysis
        """
        try:
            # Safely extract user profile data
            allergies = user_profile.get("allergies", [])
            skin_concerns = user_profile.get("skin_concerns", [])
            skin_type = user_profile.get("skin_type", "unknown")
            skin_tone = user_profile.get("skin_tone", "unknown")
            
            # Normalize lists
            if isinstance(allergies, str):
                allergies = [allergies]
            if isinstance(skin_concerns, str):
                skin_concerns = [skin_concerns]
            
            # Handle dict items in concerns
            if skin_concerns and isinstance(skin_concerns[0], dict):
                skin_concerns = [c.get("type", "") for c in skin_concerns if isinstance(c, dict)]
            
            # Filter empty values
            allergies = [str(a).strip() for a in allergies if a]
            skin_concerns = [str(c).strip() for c in skin_concerns if c]
            
            # Join ingredients safely
            ingredients_str = ', '.join(product_ingredients) if product_ingredients else 'Not provided'

            prompt = f"""
You are an expert cosmetic dermatologist and ingredient analyst.
Evaluate the following product for skin safety based on the user's profile.

Product: {product_name}
Ingredients: {ingredients_str}

User Profile:
- Skin Type: {skin_type}
- Skin Tone: {skin_tone}
- Allergies: {', '.join(allergies) or 'None'}
- Skin Concerns: {', '.join(skin_concerns) or 'None'}

Provide analysis in JSON:
{{
  "is_safe": true|false,
  "safety_score": 0.0-1.0,
  "warnings": ["warning1", "warning2"],
  "allergens_found": ["allergen1"],
  "concern_conflicts": ["conflict1"],
  "severity": "low|moderate|high",
  "recommendation": "safe_to_use|use_with_caution|avoid",
  "confidence": 0.0-1.0
}}
"""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a dermatologist analyzing cosmetic product safety."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=600,
                response_format={"type": "json_object"}
            )

            safety_data = json.loads(response.choices[0].message.content)

            # Add fallback defaults
            result = {
                "is_safe": safety_data.get("is_safe", True),
                "safety_score": safety_data.get("safety_score", 0.9),
                "warnings": safety_data.get("warnings", []),
                "allergens_found": safety_data.get("allergens_found", []),
                "concern_conflicts": safety_data.get("concern_conflicts", []),
                "severity": safety_data.get("severity", "low"),
                "recommendation": safety_data.get("recommendation", "safe_to_use"),
                "confidence": safety_data.get("confidence", 0.85)
            }

            logger.info(f"🧴 Safety check for {product_name} | Safe: {result['is_safe']}")
            return result

        except Exception as e:
            logger.error(f"❌ Product safety check error: {str(e)}")
            # Return safe fallback on error
            return {
                "is_safe": True,
                "safety_score": 0.7,
                "warnings": [f"Safety check unavailable: {str(e)}"],
                "allergens_found": [],
                "concern_conflicts": [],
                "severity": "unknown",
                "recommendation": "review_manually",
                "confidence": 0.5
            }

    # ============================================================
    # 📝 HELPER METHODS
    # ============================================================
    async def get_structured_response(
        self, 
        prompt: str, 
        system_role: str, 
        max_tokens: int = 400
    ) -> Dict[str, Any]:
        """Get structured JSON response from LLM"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": f"You are a {system_role}."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=max_tokens,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Structured response error: {str(e)}")
            raise

    async def get_text_completion(
        self, 
        prompt: str, 
        system_role: str = "assistant", 
        max_tokens: int = 300
    ) -> str:
        """Get plain text response from LLM"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": f"You are a {system_role}."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Text completion error: {str(e)}")
            raise


# Singleton instance
llm_service = LLMService()
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

    # ------------------------------------------------------------
    # 🧩 TEXT-BASED OUTFIT + ACCESSORY PARSING
    # ------------------------------------------------------------
    async def parse_outfit_description(self, text: str) -> Dict[str, Any]:
        """
        Parse user-provided outfit text.
        Cleans spelling, extracts color, outfit type, and accessories.
        Example input: "peach lehenga with gold jhumka and silver bangles"
        """
        try:
            prompt = f"""
You are a global fashion stylist AI specializing all types of wear and accessories around the world.

Analyze the following user description and extract structured fashion details:

Description: "{text}"

Your task:
1. Correct spelling and grammar errors (e.g., "lehenga", "jhumka", "offwhite").
2. Identify outfit type (e.g., saree, lehenga, gown, kurta, dress, suit, etc.)
3. Detect color names (normalize to simple color words like peach, gold, cream, red, blue).
4. Extract accessories with item type (earrings, necklace, bangles, bindi, hair clip, etc.) and material (gold, silver, artificial, diamond, pearl, etc.).
5. Handle synonyms and alternate spellings (e.g., "jumka" → "jhumka", "ear ring" → "earring").

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
                    {"role": "system", "content": "You are a stylist extracting structured fashion and accessory information."},
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

    # ------------------------------------------------------------
    # 💄 MAKEUP PLAN GENERATION
    # ------------------------------------------------------------
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
                        "content": "You are an expert Indian makeup artist. Create detailed, step-by-step, safe, and aesthetic makeup looks."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            # 🩷 Ensure 'occasion' and 'scope' fields are present
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
            concerns = [c.get("type", "") for c in user_profile["skin_concerns"]]
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
    - Dominant Color: {outfit_data.get('dominant_color', 'unknown')}

    ACCESSORIES:
    {json.dumps(accessories_data, indent=2)}

    OCCASION: {occasion}
    MAKEUP SCOPE: {scope}

    🎯 TASK:
    Generate a makeup plan that complements the outfit and occasion. Adjust intensity based on jewelry heaviness and event type.

    💄 Return a valid JSON object with this structure:
    {{
    "occasion": "{occasion}",
    "scope": "{scope}",
    "style": "Elegant Gold Glow",
    "reasoning": "why this style suits the outfit and occasion",
    "intensity": "subtle|moderate|bold",
    "steps": [
        {{
        "step_number": 1,
        "category": "foundation|eyes|lips|cheeks|base",
        "instruction": "step-by-step detail",
        "tool_needed": "brush|blender|fingers",
        "amount": "pea-size|thin layer|etc",
        "technique": "how to apply",
        "expected_result": "description of look",
        "tips": ["tip1", "tip2"]
        }}
    ],
    "key_focus": ["eyes", "base", "lips"],
    "estimated_duration": 25,
    "difficulty": "beginner|intermediate|advanced"
    }}
    """


    # ------------------------------------------------------------
    # 💍 ACCESSORY RECOMMENDATION
    # ------------------------------------------------------------
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
                    {"role": "system", "content": "You are a professional Indian stylist balancing jewelry with outfit tone."},
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

    # ------------------------------------------------------------
    # 💇‍♀️ HAIR STYLE RECOMMENDATION
    # ------------------------------------------------------------
    async def generate_hair_style_suggestion(
        self,
        outfit_data: Dict[str, Any],
        accessories_data: Dict[str, Any],
        occasion: str
    ) -> Dict[str, Any]:
        """Suggest hairstyle that fits outfit + jewelry"""
        try:
            prompt = f"""
Suggest a hairstyle for:
OUTFIT: {outfit_data.get('outfit_type')} ({', '.join(outfit_data.get('colors', []))})
ACCESSORIES: {json.dumps(accessories_data)}
OCCASION: {occasion}

Return JSON:
{{
  "recommended_style": "low bun|open waves|braid|half-up",
  "alternatives": ["style1", "style2"],
  "reasoning": "why it suits the look",
  "tips": ["tip1", "tip2"]
}}
"""
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional hairstylist specializing in event looks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=700,
                response_format={"type": "json_object"}
            )

            return json.loads(response.choices[0].message.content)

        except Exception as e:
            logger.error(f"Hair style suggestion error: {str(e)}")
            raise
    async def parse_product_label(self, text: str) -> dict:
            """Extract brand, product name, shade, category, ingredients, etc. from OCR text."""
            prompt = f"""
    You are a cosmetic product label parser.
    From the following OCR text, extract structured information.

    Text:
    {text}

    Return JSON:
    {{
    "brand": "",
    "product_name": "",
    "shade": "",
    "category": "",
    "description": "",
    "tags": [],
    "price": null,
    "ingredients": []
    }}
    """
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a product information extraction assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=600,
                    response_format={"type": "json_object"}
                )

                return json.loads(response.choices[0].message.content)
            except Exception as e:
                logger.error(f"❌ LLM label parsing failed: {e}")
                raise

    async def check_product_safety(self, product_name: str, product_ingredients: list[str], user_profile: dict) -> dict:
            """Evaluate whether a product is safe for the user."""
            try:
                allergies = user_profile.get("allergies", [])
                skin_concerns = user_profile.get("skin_concerns", [])
                skin_type = user_profile.get("skin_type", "unknown")

                prompt = f"""
    Analyze whether this product is safe for the given user.

    Product: {product_name}
    Ingredients: {', '.join(product_ingredients)}

    User:
    - Allergies: {', '.join(allergies) or 'None'}
    - Skin Type: {skin_type}
    - Skin Concerns: {', '.join(skin_concerns) or 'None'}

    Return JSON:
    {{
    "is_safe": true|false,
    "warnings": [],
    "allergens_found": [],
    "concern_conflicts": [],
    "recommendation": "safe_to_use|use_with_caution|avoid"
    }}
    """
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a dermatologist evaluating product safety."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=500,
                    response_format={"type": "json_object"}
                )

                return json.loads(response.choices[0].message.content)
            except Exception as e:
                logger.error(f"❌ LLM safety analysis failed: {e}")
                raise

    # ------------------------------------------------------------
    # 🧴 PRODUCT SAFETY & FINAL LOOK FEEDBACK
    # ------------------------------------------------------------
    async def check_product_safety(
            self,
            product_name: str,
            product_ingredients: List[str],
            user_profile: Dict[str, Any]
        ) -> Dict[str, Any]:
            """
            🧴 Smart safety check for a cosmetic product using AI reasoning + user personalization.

            Args:
                product_name: Name of the product being checked.
                product_ingredients: List of extracted ingredients.
                user_profile: Dict with user's skin_tone, allergies, concerns, and skin_type.

            Returns:
                Dict with safety analysis (is_safe, warnings, conflicts, recommendation, etc.)
            """

            try:
                allergies = user_profile.get("allergies", [])
                skin_concerns = user_profile.get("skin_concerns", [])
                skin_type = user_profile.get("skin_type", "unknown")
                skin_tone = user_profile.get("skin_tone", "unknown")

                prompt = f"""
        You are an expert cosmetic dermatologist and ingredient analyst.
        Evaluate the following product for skin safety based on the user's profile.

        ### Product:
        - Name: {product_name}
        - Ingredients: {', '.join(product_ingredients) or 'Not provided'}

        ### User Profile:
        - Skin Type: {skin_type}
        - Skin Tone: {skin_tone}
        - Allergies: {', '.join(allergies) or 'None'}
        - Skin Concerns: {', '.join(skin_concerns) or 'None'}

        Provide your analysis in JSON format:
        {{
        "is_safe": true|false,
        "safety_score": 0.0-1.0,
        "warnings": ["e.g., Contains alcohol which may irritate dry skin"],
        "allergens_found": ["Fragrance", "Parabens"],
        "concern_conflicts": ["Contains comedogenic ingredients"],
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
                            "content": "You are a board-certified dermatologist and cosmetic chemist analyzing ingredient safety."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.4,
                    max_tokens=600,
                    response_format={"type": "json_object"}
                )

                safety_data = json.loads(response.choices[0].message.content)

                # 🧠 Add fallback defaults if fields are missing
                enriched_result = {
                    "is_safe": safety_data.get("is_safe", True),
                    "safety_score": safety_data.get("safety_score", 0.9),
                    "warnings": safety_data.get("warnings", []),
                    "allergens_found": safety_data.get("allergens_found", []),
                    "concern_conflicts": safety_data.get("concern_conflicts", []),
                    "severity": safety_data.get("severity", "low"),
                    "recommendation": safety_data.get("recommendation", "safe_to_use"),
                    "confidence": safety_data.get("confidence", 0.85)
                }

                logger.info(f"🧴 Safety check completed for {product_name} | Safe: {enriched_result['is_safe']}")
                return enriched_result

            except Exception as e:
                logger.error(f"❌ Product safety check error for {product_name}: {str(e)}")
                raise

    async def get_structured_response(self, prompt: str, system_role: str, max_tokens: int = 400):
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

        

    async def get_text_completion(self, prompt: str, system_role: str = "assistant", max_tokens: int = 300):
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

# Singleton instance
llm_service = LLMService()

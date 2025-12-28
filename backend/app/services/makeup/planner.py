"""
GlamAI - Makeup Planning Service
Business logic for makeup plan generation and recommendations
"""

from typing import Dict, Any, List, Optional
from loguru import logger


class MakeupPlanner:
    """Service for makeup planning logic"""
    
    def __init__(self):
        self.difficulty_levels = {
            "beginner": {"steps": 5, "duration": 15},
            "intermediate": {"steps": 8, "duration": 25},
            "advanced": {"steps": 12, "duration": 40}
        }
    
    def calculate_difficulty(self, occasion: str, scope: str) -> str:
        """
        Calculate difficulty level based on occasion and scope
        """
        if scope == "touch_up" or scope == "lips_only":
            return "beginner"
        elif occasion in ["daily", "office"]:
            return "beginner"
        elif occasion in ["party", "date_night"]:
            return "intermediate"
        elif occasion in ["wedding", "festive", "photoshoot"]:
            return "advanced"
        else:
            return "intermediate"
    
    def estimate_duration(self, difficulty: str, scope: str) -> int:
        """
        Estimate makeup duration in minutes
        """
        base_duration = self.difficulty_levels.get(difficulty, {}).get("duration", 20)
        
        if scope == "touch_up":
            return 5
        elif scope == "lips_only":
            return 8
        elif scope == "eyes_only":
            return 15
        elif scope == "no_makeup_look":
            return 12
        else:
            return base_duration
    
    def categorize_steps(self, makeup_plan: Dict[str, Any]) -> Dict[str, List[Dict]]:
        """
        Categorize steps by area (base, eyes, cheeks, lips)
        """
        categorized = {
            "base": [],
            "eyes": [],
            "cheeks": [],
            "lips": []
        }
        
        for step in makeup_plan.get("steps", []):
            category = step.get("category", "").lower()
            
            if category in ["foundation", "concealer", "powder", "primer"]:
                categorized["base"].append(step)
            elif category in ["eyeshadow", "eyeliner", "kajal", "mascara", "eyebrow"]:
                categorized["eyes"].append(step)
            elif category in ["blush", "bronzer", "highlighter"]:
                categorized["cheeks"].append(step)
            elif category in ["lipstick", "lip_gloss", "lip_liner"]:
                categorized["lips"].append(step)
        
        return categorized
    
    def validate_product_compatibility(
        self,
        product_list: List[Dict[str, Any]],
        skin_concerns: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Validate if products are compatible with skin concerns
        """
        validated_products = []
        
        concern_incompatible_ingredients = {
            "acne": ["coconut oil", "mineral oil", "dimethicone", "heavy oils"],
            "sensitive": ["fragrance", "alcohol", "parfum", "essential oils"],
            "oily": ["heavy oils", "butter", "petroleum"],
            "dry": ["alcohol", "sulfates"]
        }
        
        for product in product_list:
            warnings = []
            ingredients = product.get("ingredients", [])
            
            for concern in skin_concerns:
                if concern in concern_incompatible_ingredients:
                    bad_ingredients = concern_incompatible_ingredients[concern]
                    
                    for bad_ing in bad_ingredients:
                        if any(bad_ing.lower() in ing.lower() for ing in ingredients):
                            warnings.append(f"May worsen {concern}: contains {bad_ing}")
            
            product["compatibility_warnings"] = warnings
            product["is_compatible"] = len(warnings) == 0
            validated_products.append(product)
        
        return validated_products
    
    def generate_quick_tips(
        self,
        skin_type: str,
        occasion: str,
        skin_concerns: List[str]
    ) -> List[str]:
        """
        Generate personalized quick tips
        """
        tips = []
        
        # Skin type tips
        if skin_type == "Oily":
            tips.append("Use oil-free products and set with powder")
            tips.append("Blot excess oil before applying makeup")
        elif skin_type == "Dry":
            tips.append("Moisturize 10 minutes before makeup")
            tips.append("Use cream-based products for hydration")
        elif skin_type == "Combination":
            tips.append("Use powder on T-zone, cream on cheeks")
        
        # Skin concern tips
        if "acne" in [c.lower() for c in skin_concerns]:
            tips.append("Avoid touching face during application")
            tips.append("Use non-comedogenic products only")
        
        if "pigmentation" in [c.lower() for c in skin_concerns]:
            tips.append("Use color-correcting primer")
            tips.append("Build coverage gradually")
        
        # Occasion tips
        if occasion in ["wedding", "festive"]:
            tips.append("Use setting spray for long-lasting makeup")
            tips.append("Take photos in natural light to check")
        elif occasion in ["daily", "office"]:
            tips.append("Keep it natural and minimal")
        
        return tips
    
    def analyze_color_harmony(
        self,
        outfit_colors: List[str],
        accessories_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze color harmony and suggest makeup colors
        """
        jewelry_type = accessories_data.get("jewelry_type", "none")
        dominant_outfit = outfit_colors[0] if outfit_colors else "neutral"
        
        suggestions = {
            "eyeshadow": [],
            "lips": [],
            "blush": []
        }
        
        # Color complementary logic
        color_complements = {
            "red": {
                "eyeshadow": ["gold", "bronze", "brown"],
                "lips": ["nude", "pink", "berry"],
                "blush": ["peach", "coral"]
            },
            "blue": {
                "eyeshadow": ["silver", "gray", "purple"],
                "lips": ["red", "pink", "coral"],
                "blush": ["pink", "rose"]
            },
            "green": {
                "eyeshadow": ["purple", "brown", "bronze"],
                "lips": ["berry", "pink"],
                "blush": ["rose", "peach"]
            },
            "gold": {
                "eyeshadow": ["brown", "bronze", "copper"],
                "lips": ["nude", "brown"],
                "blush": ["bronze", "peach"]
            },
            "black": {
                "eyeshadow": ["any color"],
                "lips": ["red", "nude", "berry"],
                "blush": ["any color"]
            },
            "white": {
                "eyeshadow": ["any color"],
                "lips": ["pink", "red"],
                "blush": ["pink", "peach"]
            }
        }
        
        if dominant_outfit in color_complements:
            suggestions = color_complements[dominant_outfit]
        
        # Adjust for jewelry
        if jewelry_type == "gold":
            suggestions["eyeshadow"] = ["gold", "bronze", "brown", "warm tones"]
        elif jewelry_type == "silver":
            suggestions["eyeshadow"] = ["silver", "gray", "cool tones"]
        
        return {
            "recommended_colors": suggestions,
            "reasoning": f"Colors chosen to complement {dominant_outfit} outfit and {jewelry_type} jewelry",
            "intensity": self._calculate_intensity(accessories_data)
        }
    
    def _calculate_intensity(self, accessories_data: Dict[str, Any]) -> str:
        """Calculate makeup intensity based on accessories"""
        jewelry_intensity = accessories_data.get("jewelry_intensity", "light")
        
        if jewelry_intensity == "heavy":
            return "subtle"
        elif jewelry_intensity == "medium":
            return "moderate"
        else:
            return "moderate"
    
    def suggest_product_alternatives(
        self,
        missing_category: str,
        budget: str = "medium"
    ) -> List[Dict[str, str]]:
        """
        Suggest alternatives when product is missing
        """
        alternatives = {
            "foundation": [
                {"budget": "low", "suggestion": "BB cream or tinted moisturizer"},
                {"budget": "medium", "suggestion": "Drugstore foundation"},
                {"budget": "skip", "suggestion": "Use concealer on problem areas only"}
            ],
            "eyeshadow": [
                {"budget": "low", "suggestion": "Use kajal as cream eyeshadow"},
                {"budget": "medium", "suggestion": "Single shimmer shade"},
                {"budget": "skip", "suggestion": "Focus on kajal and mascara"}
            ],
            "blush": [
                {"budget": "low", "suggestion": "Use lipstick as cream blush"},
                {"budget": "medium", "suggestion": "Drugstore powder blush"},
                {"budget": "skip", "suggestion": "Pinch cheeks for natural flush"}
            ],
            "lipstick": [
                {"budget": "low", "suggestion": "Tinted lip balm"},
                {"budget": "medium", "suggestion": "Drugstore lipstick"},
                {"budget": "skip", "suggestion": "Use lip balm for natural look"}
            ]
        }
        
        return alternatives.get(missing_category, [
            {"budget": "skip", "suggestion": f"You can skip {missing_category} for this look"}
        ])
    
    def create_step_breakdown(
        self,
        plan: Dict[str, Any],
        user_skill_level: str = "beginner"
    ) -> List[Dict[str, Any]]:
        """
        Create detailed step breakdown with timing
        """
        steps = plan.get("steps", [])
        enhanced_steps = []
        
        cumulative_time = 0
        
        for i, step in enumerate(steps):
            # Estimate time per step
            step_duration = self._estimate_step_duration(
                step.get("category", ""),
                user_skill_level
            )
            
            enhanced_step = {
                **step,
                "estimated_minutes": step_duration,
                "cumulative_time": cumulative_time + step_duration,
                "progress_percent": ((i + 1) / len(steps)) * 100,
                "skill_tips": self._get_skill_tips(step.get("category", ""), user_skill_level)
            }
            
            cumulative_time += step_duration
            enhanced_steps.append(enhanced_step)
        
        return enhanced_steps
    
    def _estimate_step_duration(self, category: str, skill_level: str) -> int:
        """Estimate duration for a step based on category and skill"""
        base_durations = {
            "foundation": 3,
            "concealer": 2,
            "powder": 2,
            "eyeshadow": 5,
            "eyeliner": 3,
            "kajal": 2,
            "mascara": 2,
            "blush": 2,
            "lipstick": 2
        }
        
        duration = base_durations.get(category, 3)
        
        # Adjust for skill level
        if skill_level == "beginner":
            duration = int(duration * 1.5)
        elif skill_level == "advanced":
            duration = int(duration * 0.7)
        
        return duration
    
    def _get_skill_tips(self, category: str, skill_level: str) -> List[str]:
        """Get skill-specific tips for a step"""
        tips = {
            "beginner": {
                "foundation": [
                    "Start with clean, moisturized skin",
                    "Use your fingers or a damp sponge",
                    "Blend in circular motions"
                ],
                "eyeshadow": [
                    "Start with lighter colors",
                    "Use your finger for easier application",
                    "Blend the edges well"
                ],
                "eyeliner": [
                    "Rest your elbow on a table for stability",
                    "Draw small dashes instead of one line",
                    "Start thin, you can always add more"
                ]
            },
            "intermediate": {
                "foundation": [
                    "Apply in thin layers",
                    "Use different tools for different areas"
                ],
                "eyeshadow": [
                    "Build color gradually",
                    "Use transition shades"
                ]
            }
        }
        
        return tips.get(skill_level, {}).get(category, [])


# Singleton instance
makeup_planner = MakeupPlanner()
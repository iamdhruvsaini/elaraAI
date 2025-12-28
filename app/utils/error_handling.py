"""
GlamAI - Error Handling Utilities
Comprehensive error handling and validation helpers
"""

from typing import Any, Dict, List, Optional, Union
from loguru import logger
import json


def safe_get(data: Any, key: str, default: Any = None) -> Any:
    """
    Safely get value from dict-like object or object attribute.
    Handles None, dicts, and objects with __dict__.
    """
    if data is None:
        return default
    
    try:
        # Try dict access first
        if isinstance(data, dict):
            return data.get(key, default)
        
        # Try attribute access
        if hasattr(data, key):
            return getattr(data, key, default)
        
        # Try __dict__ for SQLAlchemy objects
        if hasattr(data, "__dict__"):
            return data.__dict__.get(key, default)
        
        return default
    except Exception as e:
        logger.warning(f"safe_get error for key '{key}': {e}")
        return default


def normalize_list(data: Any, item_type: type = str) -> List[Any]:
    """
    Normalize various input types to a clean list.
    Handles: None, single values, lists of dicts, lists of strings, etc.
    """
    if not data:
        return []
    
    # Already a list
    if isinstance(data, list):
        result = []
        for item in data:
            # Handle dict items (e.g., [{"type": "acne"}, ...])
            if isinstance(item, dict):
                # Try common keys
                for key in ["type", "name", "value", "id"]:
                    if key in item and item[key]:
                        result.append(item_type(item[key]))
                        break
            elif item:  # Skip None/empty
                result.append(item_type(item))
        return result
    
    # Single value
    try:
        return [item_type(data)]
    except:
        return []


def safe_dict_from_object(obj: Any, default: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Convert any object to a safe dictionary.
    Handles SQLAlchemy models, Pydantic models, dicts, etc.
    """
    if obj is None:
        return default or {}
    
    if isinstance(obj, dict):
        return obj
    
    try:
        # Try Pydantic model
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        
        # Try dict() conversion
        if hasattr(obj, "__dict__"):
            result = {}
            for key, value in obj.__dict__.items():
                # Skip SQLAlchemy internal attributes
                if not key.startswith("_"):
                    result[key] = value
            return result
        
        return default or {}
    except Exception as e:
        logger.warning(f"safe_dict_from_object error: {e}")
        return default or {}


def safe_json_loads(data: Union[str, bytes, dict], default: Any = None) -> Any:
    """
    Safely parse JSON from string, bytes, or return dict as-is.
    """
    if data is None:
        return default
    
    if isinstance(data, dict):
        return data
    
    try:
        if isinstance(data, bytes):
            data = data.decode("utf-8")
        return json.loads(data)
    except Exception as e:
        logger.warning(f"safe_json_loads error: {e}")
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert to float"""
    try:
        return float(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert to int"""
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def safe_str(value: Any, default: str = "") -> str:
    """Safely convert to string"""
    try:
        return str(value) if value is not None else default
    except:
        return default


def safe_bool(value: Any, default: bool = False) -> bool:
    """Safely convert to bool"""
    if value is None:
        return default
    
    if isinstance(value, bool):
        return value
    
    if isinstance(value, str):
        return value.lower() in ("true", "1", "yes", "on")
    
    try:
        return bool(value)
    except:
        return default


def build_user_profile_dict(user_profile: Any) -> Dict[str, Any]:
    """
    Build a safe user profile dictionary from any input type.
    Handles None, SQLAlchemy models, dicts, etc.
    """
    if user_profile is None:
        logger.warning("User profile is None, returning defaults")
        return {
            "allergies": [],
            "skin_concerns": [],
            "skin_type": "unknown",
            "skin_tone": "unknown",
            "undertone": "neutral",
        }
    
    # Convert to dict if needed
    profile_dict = safe_dict_from_object(user_profile)
    
    # Normalize allergies
    allergies = normalize_list(
        safe_get(profile_dict, "allergies", []),
        item_type=str
    )
    
    # Normalize skin concerns
    skin_concerns_raw = safe_get(profile_dict, "skin_concerns", [])
    skin_concerns = normalize_list(skin_concerns_raw, item_type=str)
    
    return {
        "allergies": [a.strip() for a in allergies if a and a.strip()],
        "skin_concerns": [c.strip() for c in skin_concerns if c and c.strip()],
        "skin_type": safe_str(safe_get(profile_dict, "skin_type"), "unknown"),
        "skin_tone": safe_str(safe_get(profile_dict, "skin_tone"), "unknown"),
        "undertone": safe_str(safe_get(profile_dict, "undertone"), "neutral"),
    }


def validate_ingredients(ingredients: Any) -> List[str]:
    """
    Validate and normalize ingredient list from various formats.
    """
    if not ingredients:
        return []
    
    result = []
    
    # Handle list input
    if isinstance(ingredients, list):
        for item in ingredients:
            if isinstance(item, dict):
                # Try to extract ingredient name from dict
                name = (
                    item.get("name") or 
                    item.get("ingredient") or 
                    item.get("value") or
                    ""
                )
                if name:
                    result.append(str(name).strip())
            elif item:
                result.append(str(item).strip())
    
    # Handle string input (comma-separated)
    elif isinstance(ingredients, str):
        result = [i.strip() for i in ingredients.split(",") if i.strip()]
    
    # Filter out empty strings and duplicates
    return list(dict.fromkeys(filter(None, result)))


def sanitize_for_db(value: str, max_length: int) -> str:
    """
    Sanitize string for database insertion.
    Truncates to max_length and strips whitespace.
    """
    if not value:
        return ""
    
    value = str(value).strip()
    if len(value) > max_length:
        value = value[:max_length-3] + "..."
    
    return value


def log_operation(operation: str, details: Dict[str, Any], level: str = "info"):
    """
    Structured logging helper.
    """
    message = f"🔧 {operation}"
    
    if level == "info":
        logger.info(message, extra=details)
    elif level == "warning":
        logger.warning(message, extra=details)
    elif level == "error":
        logger.error(message, extra=details)
    elif level == "success":
        logger.success(message, extra=details)


# Example usage in your scan endpoint:
"""
from app.utils.error_handling import (
    build_user_profile_dict,
    validate_ingredients,
    sanitize_for_db,
    log_operation
)

# Build safe user profile
user_profile_dict = build_user_profile_dict(user_profile)

# Validate ingredients
ingredients = validate_ingredients(structured_data.get("ingredients"))

# Sanitize strings for DB
brand = sanitize_for_db(structured_data.get("brand", ""), 100)
product_name = sanitize_for_db(structured_data.get("product_name", "Unknown"), 200)

# Log operations
log_operation(
    "product_scan",
    {
        "user_id": current_user.id,
        "product": product_name,
        "ingredients_count": len(ingredients)
    },
    level="success"
)
"""
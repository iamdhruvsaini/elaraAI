"""
GlamAI - LLM-based Outfit & Accessory Parser
Extracts structured data from free-text outfit descriptions.
Handles typos, synonyms, and color normalization.
"""

import re
from typing import Dict, Any, List

# Normalization maps
COLOR_MAP = {
    "peachish": "peach",
    "golden": "gold",
    "silvery": "silver",
    "cream": "beige",
    "sky blue": "blue",
    "maroon": "red",
    "violet": "purple",
    "off white": "white",
    "greyish": "grey",
}

OUTFIT_TYPES = [
    "lehenga", "saree", "gown", "anarkali", "kurti",
    "salwar", "sharara", "dress", "top", "skirt"
]

ACCESSORY_PARTS = {
    "ear": ["earring", "jhumka", "studs"],
    "neck": ["necklace", "choker", "chain"],
    "nose": ["nose ring", "nath"],
    "hand": ["bangle", "bracelet", "ring"],
    "hair": ["clip", "tiara", "band"],
}

MATERIALS = ["gold", "silver", "artificial", "metal", "diamond", "pearl"]


async def extract_outfit_and_accessories(text: str) -> Dict[str, Any]:
    text = text.lower().strip()
    refined = text

    # Correct common color misspellings / variants
    for wrong, correct in COLOR_MAP.items():
        if wrong in refined:
            refined = refined.replace(wrong, correct)

    result: Dict[str, Any] = {
        "refined_description": refined,
        "outfit_type": "unknown",
        "dominant_color": "unknown",
        "colors": [],
        "accessories": {},
        "confidence": 0.95
    }

    # Detect outfit type
    for t in OUTFIT_TYPES:
        if re.search(rf"\b{t}\b", refined):
            result["outfit_type"] = t
            break

    # Detect colors
    detected_colors = [c for c in COLOR_MAP.values() if c in refined]
    if not detected_colors:
        # try direct words
        common_colors = ["red", "pink", "blue", "green", "yellow", "peach", "gold", "silver", "white", "black", "purple"]
        detected_colors = [c for c in common_colors if c in refined]
    result["colors"] = detected_colors
    if detected_colors:
        result["dominant_color"] = detected_colors[0]

    # Detect accessories by part
    for part, keywords in ACCESSORY_PARTS.items():
        for kw in keywords:
            if kw in refined:
                nearby = refined[max(0, refined.find(kw) - 25): refined.find(kw) + len(kw) + 25]
                material = next((m for m in MATERIALS if m in nearby), None)
                result["accessories"][part] = {
                    "item": kw,
                    "material": material or "unknown"
                }
                break

    return result

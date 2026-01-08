from fastapi import APIRouter, UploadFile, File, HTTPException, Response
from app.services.azure.speech_service import speech_service

router = APIRouter()

# --------------------------------------------------
# 1️⃣ TEXT → SPEECH
# POST /api/speech/tts
# -----------------------------------------------x---
@router.post("/tts")
async def text_to_speech(payload: dict):
    audio = await speech_service.text_to_speech(
        text=payload["text"],
        language=payload.get("language", "en-IN"),
        voice_name=payload.get("voice_name")
    )

    return Response(content=audio, media_type="audio/mpeg")


# --------------------------------------------------
# 2️⃣ SPEECH → TEXT
# POST /api/speech/stt
# --------------------------------------------------
@router.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = "en-IN"
):
    audio_bytes = await audio.read()

    text = await speech_service.speech_to_text(
        audio_bytes=audio_bytes,
        language=language
    )

    return {
        "text": text,
        "language": language
    }


# --------------------------------------------------
# 3️⃣ MAKEUP STEP READER
# POST /api/speech/makeup-step
# --------------------------------------------------
@router.post("/makeup-step")
async def makeup_step_voice(payload: dict):
    audio = await speech_service.generate_makeup_step_audio(
        step_number=payload["step_number"],
        step_instruction=payload["step_instruction"],
        tool=payload.get("tool"),
        tips=payload.get("tips"),
        language=payload.get("language", "en-IN")
    )

    return Response(content=audio, media_type="audio/mpeg")


# --------------------------------------------------
# 4️⃣ TEXT TRANSLATION (APP-WIDE)
# POST /api/speech/translate
# --------------------------------------------------
@router.post("/translate")
async def translate_text(payload: dict):
    translated = await speech_service.translate_text(
        text=payload["text"],
        source_language=payload["source_language"],
        target_language=payload["target_language"]
    )

    return {
        "translated_text": translated,
        "target_language": payload["target_language"]
    }


# --------------------------------------------------
# 5️⃣ TRANSLATE + SPEAK
# POST /api/speech/translate-and-speak
# --------------------------------------------------
@router.post("/translate-and-speak")
async def translate_and_speak(payload: dict):
    audio = await speech_service.translate_and_speak(
        text=payload["text"],
        source_language=payload["source_language"],
        target_language=payload["target_language"]
    )

    return Response(content=audio, media_type="audio/mpeg")


# --------------------------------------------------
# 6️⃣ GREETING VOICE
# POST /api/speech/greeting
# --------------------------------------------------
@router.post("/greeting")
async def greeting_voice(payload: dict):
    audio = await speech_service.generate_greeting_audio(
        user_name=payload["user_name"],
        occasion=payload["occasion"],
        language=payload.get("language", "en-IN")
    )

    return Response(content=audio, media_type="audio/mpeg")


# --------------------------------------------------
# 7️⃣ ENCOURAGEMENT VOICE
# POST /api/speech/encouragement
# --------------------------------------------------
@router.post("/encouragement")
async def encouragement_voice(payload: dict = {}):
    audio = await speech_service.generate_encouragement_audio(
        language=payload.get("language", "en-IN")
    )

    return Response(content=audio, media_type="audio/mpeg")

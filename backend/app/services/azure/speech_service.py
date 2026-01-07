# """
# GlamAI - Azure Speech Service
# Text-to-Speech for voice guidance during makeup steps
# """

# import azure.cognitiveservices.speech as speechsdk
# from app.core.config import settings
# from typing import Optional
# from loguru import logger
# import base64


# class SpeechService:
#     """Azure Speech Services for voice guidance"""
    
#     def __init__(self):
#         self.speech_config = speechsdk.SpeechConfig(
#             subscription=settings.AZURE_SPEECH_KEY,
#             region=settings.AZURE_SPEECH_REGION
#         )
        
#         # Set default voice (Indian English female)
#         self.speech_config.speech_synthesis_voice_name = "en-IN-NeerjaNeural"
        
#         # Output format
#         self.speech_config.set_speech_synthesis_output_format(
#             speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
#         )
    
#     async def text_to_speech(
#         self, 
#         text: str, 
#         language: str = "en-IN",
#         voice_name: Optional[str] = None
#     ) -> bytes:
#         """
#         Convert text to speech audio
#         Returns: MP3 audio bytes
#         """
#         try:
#             # Set voice based on language
#             if voice_name:
#                 self.speech_config.speech_synthesis_voice_name = voice_name
#             elif language == "hi-IN":
#                 self.speech_config.speech_synthesis_voice_name = "hi-IN-SwaraNeural"
#             elif language == "ta-IN":
#                 self.speech_config.speech_synthesis_voice_name = "ta-IN-PallaviNeural"
#             else:
#                 self.speech_config.speech_synthesis_voice_name = "en-IN-NeerjaNeural"
            
#             # Create synthesizer
#             synthesizer = speechsdk.SpeechSynthesizer(
#                 speech_config=self.speech_config,
#                 audio_config=None
#             )
            
#             # Synthesize
#             result = synthesizer.speak_text_async(text).get()
            
#             if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
#                 return result.audio_data
#             else:
#                 logger.error(f"Speech synthesis failed: {result.reason}")
#                 raise Exception(f"Speech synthesis failed: {result.reason}")
                
#         except Exception as e:
#             logger.error(f"Text-to-speech error: {str(e)}")
#             raise
    
#     async def generate_makeup_step_audio(
#         self,
#         step_instruction: str,
#         tool: Optional[str] = None,
#         tips: Optional[str] = None,
#         language: str = "en-IN"
#     ) -> bytes:
#         """
#         Generate complete audio guidance for a makeup step
#         """
#         # Build complete narration
#         narration = step_instruction
        
#         if tool:
#             narration += f" Use your {tool} for this step."
        
#         if tips:
#             narration += f" Pro tip: {tips}"
        
#         return await self.text_to_speech(narration, language)
    
#     async def generate_greeting_audio(
#         self,
#         user_name: str,
#         occasion: str,
#         language: str = "en-IN"
#     ) -> bytes:
#         """Generate personalized greeting"""
#         greeting = f"Hi {user_name}! Let's create a beautiful {occasion} look today. I'll guide you through each step. Ready? Let's begin!"
#         return await self.text_to_speech(greeting, language)
    
#     async def generate_encouragement_audio(self, language: str = "en-IN") -> bytes:
#         """Generate encouraging message"""
#         messages = [
#             "You're doing great! Keep going!",
#             "Perfect! Let's move to the next step.",
#             "Excellent work! Your makeup is looking beautiful.",
#             "Well done! Almost there!"
#         ]
#         import random
#         message = random.choice(messages)
#         return await self.text_to_speech(message, language)


# # Singleton instance
# speech_service = SpeechService()



"""
GlamAI - Advanced Azure Speech + Language Service
Features:
- Text to Speech (TTS)
- Speech to Text (STT)
- Makeup Step Reader
- App-wide Language Translation
- Multi-language Voice Control
"""

import azure.cognitiveservices.speech as speechsdk
from app.core.config import settings
from typing import Optional, Dict
from loguru import logger
import tempfile
import os
import random


class SpeechService:
    """Advanced Azure Speech + Language Service"""

    # --------------------------------------------------
    # Language → Voice Mapping
    # --------------------------------------------------
    VOICE_MAP: Dict[str, str] = {
        "en-IN": "en-IN-NeerjaNeural",
        "hi-IN": "hi-IN-SwaraNeural",
        "ta-IN": "ta-IN-PallaviNeural",
        "te-IN": "te-IN-ShrutiNeural",
        "ml-IN": "ml-IN-SobhanaNeural"
    }

    def __init__(self):
        # Speech config
        self.speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION
        )

        self.speech_config.set_speech_synthesis_output_format(
            speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
        )

        # Translation config
        self.translation_config = speechsdk.translation.SpeechTranslationConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION
        )

    # ==================================================
    # 1️⃣ TEXT → SPEECH
    # ==================================================
    async def text_to_speech(
        self,
        text: str,
        language: str = "en-IN",
        voice_name: Optional[str] = None
    ) -> bytes:
        try:
            voice = voice_name or self.VOICE_MAP.get(language, "en-IN-NeerjaNeural")
            self.speech_config.speech_synthesis_voice_name = voice

            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=self.speech_config,
                audio_config=None
            )

            result = synthesizer.speak_text_async(text).get()

            if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
                raise RuntimeError("Text-to-Speech failed")

            return result.audio_data

        except Exception as e:
            logger.exception("TTS error")
            raise RuntimeError("Text to speech failed") from e

    # ==================================================
    # 2️⃣ SPEECH → TEXT (AUDIO TO TEXT)
    # ==================================================
    async def speech_to_text(
        self,
        audio_bytes: bytes,
        language: str = "en-IN"
    ) -> str:
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
                f.write(audio_bytes)
                audio_path = f.name

            audio_config = speechsdk.AudioConfig(filename=audio_path)
            self.speech_config.speech_recognition_language = language

            recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )

            result = recognizer.recognize_once()

            os.remove(audio_path)

            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                return result.text

            raise RuntimeError("Speech recognition failed")

        except Exception as e:
            logger.exception("STT error")
            raise RuntimeError("Speech to text failed") from e

    # ==================================================
    # 3️⃣ MAKEUP STEP READER (STRUCTURED VOICE)
    # ==================================================
    async def generate_makeup_step_audio(
        self,
        step_number: int,
        step_instruction: str,
        tool: Optional[str] = None,
        tips: Optional[str] = None,
        language: str = "en-IN"
    ) -> bytes:
        narration = f"Step {step_number}. {step_instruction}."

        if tool:
            narration += f" Use your {tool}."

        if tips:
            narration += f" Pro tip. {tips}."

        return await self.text_to_speech(narration, language)

    # ==================================================
    # 4️⃣ APP-WIDE LANGUAGE TRANSLATION (TEXT)
    # ==================================================
    async def translate_text(
        self,
        text: str,
        source_language: str,
        target_language: str
    ) -> str:
        try:
            self.translation_config.speech_recognition_language = source_language
            self.translation_config.add_target_language(target_language)

            translator = speechsdk.translation.TranslationRecognizer(
                translation_config=self.translation_config,
                audio_config=None
            )

            result = translator.recognize_once_async().get()

            if result.reason == speechsdk.ResultReason.TranslatedSpeech:
                return result.translations[target_language]

            raise RuntimeError("Translation failed")

        except Exception as e:
            logger.exception("Translation error")
            raise RuntimeError("Text translation failed") from e

    # ==================================================
    # 5️⃣ TRANSLATE + SPEAK (FULL APP LOCALIZATION)
    # ==================================================
    async def translate_and_speak(
        self,
        text: str,
        source_language: str,
        target_language: str
    ) -> bytes:
        translated_text = await self.translate_text(
            text,
            source_language,
            target_language
        )

        return await self.text_to_speech(
            translated_text,
            language=target_language
        )

    # ==================================================
    # 6️⃣ GREETING VOICE
    # ==================================================
    async def generate_greeting_audio(
        self,
        user_name: str,
        occasion: str,
        language: str = "en-IN"
    ) -> bytes:
        greeting = (
            f"Hi {user_name}! Welcome to GlamAI. "
            f"Let's create a beautiful {occasion} look together."
        )
        return await self.text_to_speech(greeting, language)

    # ==================================================
    # 7️⃣ ENCOURAGEMENT VOICE
    # ==================================================
    async def generate_encouragement_audio(
        self,
        language: str = "en-IN"
    ) -> bytes:
        messages = [
            "You're doing great. Keep going.",
            "Perfect. Let's move to the next step.",
            "Excellent work. Your makeup looks amazing.",
            "Almost there. You're doing wonderful."
        ]

        return await self.text_to_speech(
            random.choice(messages),
            language
        )


# --------------------------------------------------
# Singleton Instance
# --------------------------------------------------
speech_service = SpeechService()

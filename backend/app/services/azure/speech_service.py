"""
GlamAI - Azure Speech Service
Text-to-Speech for voice guidance during makeup steps
"""

import azure.cognitiveservices.speech as speechsdk
from app.core.config import settings
from typing import Optional
from loguru import logger
import base64


class SpeechService:
    """Azure Speech Services for voice guidance"""
    
    def __init__(self):
        self.speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION
        )
        
        # Set default voice (Indian English female)
        self.speech_config.speech_synthesis_voice_name = "en-IN-NeerjaNeural"
        
        # Output format
        self.speech_config.set_speech_synthesis_output_format(
            speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
        )
    
    async def text_to_speech(
        self, 
        text: str, 
        language: str = "en-IN",
        voice_name: Optional[str] = None
    ) -> bytes:
        """
        Convert text to speech audio
        Returns: MP3 audio bytes
        """
        try:
            # Set voice based on language
            if voice_name:
                self.speech_config.speech_synthesis_voice_name = voice_name
            elif language == "hi-IN":
                self.speech_config.speech_synthesis_voice_name = "hi-IN-SwaraNeural"
            elif language == "ta-IN":
                self.speech_config.speech_synthesis_voice_name = "ta-IN-PallaviNeural"
            else:
                self.speech_config.speech_synthesis_voice_name = "en-IN-NeerjaNeural"
            
            # Create synthesizer
            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=self.speech_config,
                audio_config=None
            )
            
            # Synthesize
            result = synthesizer.speak_text_async(text).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                return result.audio_data
            else:
                logger.error(f"Speech synthesis failed: {result.reason}")
                raise Exception(f"Speech synthesis failed: {result.reason}")
                
        except Exception as e:
            logger.error(f"Text-to-speech error: {str(e)}")
            raise
    
    async def generate_makeup_step_audio(
        self,
        step_instruction: str,
        tool: Optional[str] = None,
        tips: Optional[str] = None,
        language: str = "en-IN"
    ) -> bytes:
        """
        Generate complete audio guidance for a makeup step
        """
        # Build complete narration
        narration = step_instruction
        
        if tool:
            narration += f" Use your {tool} for this step."
        
        if tips:
            narration += f" Pro tip: {tips}"
        
        return await self.text_to_speech(narration, language)
    
    async def generate_greeting_audio(
        self,
        user_name: str,
        occasion: str,
        language: str = "en-IN"
    ) -> bytes:
        """Generate personalized greeting"""
        greeting = f"Hi {user_name}! Let's create a beautiful {occasion} look today. I'll guide you through each step. Ready? Let's begin!"
        return await self.text_to_speech(greeting, language)
    
    async def generate_encouragement_audio(self, language: str = "en-IN") -> bytes:
        """Generate encouraging message"""
        messages = [
            "You're doing great! Keep going!",
            "Perfect! Let's move to the next step.",
            "Excellent work! Your makeup is looking beautiful.",
            "Well done! Almost there!"
        ]
        import random
        message = random.choice(messages)
        return await self.text_to_speech(message, language)


# Singleton instance
speech_service = SpeechService()
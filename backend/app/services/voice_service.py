"""
Madhyastha — Voice Service
Text-to-Speech (TTS) using gTTS and ElevenLabs
"""

import os
import logging
from typing import Optional
from gtts import gTTS
from elevenlabs.client import ElevenLabs
from app.core.config import settings

logger = logging.getLogger("madhyastha.voice")

class VoiceService:
    """Service for Text-to-Speech conversion"""

    def __init__(self):
        self.eleven_client = None
        if settings.ELEVENLABS_API_KEY:
            try:
                self.eleven_client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
                logger.info("ElevenLabs client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize ElevenLabs: {e}")

    async def text_to_speech(self, text: str, output_path: str, use_elevenlabs: bool = True) -> bool:
        """Convert text to speech and save as MP3"""
        if use_elevenlabs and self.eleven_client:
            return await self._elevenlabs_tts(text, output_path)
        else:
            return await self._gtts_tts(text, output_path)

    async def _elevenlabs_tts(self, text: str, output_path: str) -> bool:
        """ElevenLabs TTS implementation"""
        try:
            # Modern SDK (v1.0+) syntax
            audio_gen = self.eleven_client.text_to_speech.convert(
                text=text,
                voice_id=settings.ELEVENLABS_VOICE_ID,
                model_id="eleven_multilingual_v2"
            )
            
            # elevenlabs returns a generator of bytes
            with open(output_path, "wb") as f:
                for chunk in audio_gen:
                    if chunk:
                        f.write(chunk)
            
            logger.info(f"ElevenLabs TTS generated: {output_path}")
            return True
        except Exception as e:
            logger.error(f"ElevenLabs TTS failed: {e}. Falling back to gTTS.")
            return await self._gtts_tts(text, output_path)

    async def _gtts_tts(self, text: str, output_path: str) -> bool:
        """gTTS implementation (Google Translate TTS)"""
        try:
            # We can detect language or default to English
            # For now, keeping it simple with English/detected
            tts = gTTS(text=text, lang='en', slow=False)
            tts.save(output_path)
            logger.info(f"gTTS generated: {output_path}")
            return True
        except Exception as e:
            logger.error(f"gTTS failed: {e}")
            return False

# Global instance
voice_service = VoiceService()

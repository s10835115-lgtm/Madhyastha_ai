"""
Madhyastha — Voice Routes
Endpoints for Text-to-Speech
"""

import os
import uuid
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.voice_service import voice_service

logger = logging.getLogger("madhyastha.api.voice")
router = APIRouter(prefix="/voice", tags=["Voice"])

# Ensure temp directory for audio exists
AUDIO_TEMP_DIR = "data/temp_audio"
os.makedirs(AUDIO_TEMP_DIR, exist_ok=True)

class TTSRequest(BaseModel):
    text: str
    use_elevenlabs: bool = True

@router.post("/tts")
async def get_tts(request: TTSRequest, background_tasks: BackgroundTasks):
    """Generate TTS audio for given text and return as MP3"""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Limit text length to prevent abuse
    safe_text = request.text[:1000]
    
    file_id = str(uuid.uuid4())
    output_path = os.path.join(AUDIO_TEMP_DIR, f"{file_id}.mp3")
    
    success = await voice_service.text_to_speech(safe_text, output_path, use_elevenlabs=request.use_elevenlabs)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to generate audio")

    # Cleanup file after sending
    def cleanup():
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
                logger.info(f"Cleaned up audio file: {output_path}")
            except Exception as e:
                logger.error(f"Failed to cleanup audio: {e}")

    background_tasks.add_task(cleanup)
    
    return FileResponse(
        path=output_path,
        media_type="audio/mpeg",
        filename="speech.mp3"
    )

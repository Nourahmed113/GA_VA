"""
FastAPI Main Application
ChatterBox Multi-Dialect TTS API
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import logging
from typing import List, Dict

from .models import (
    TTSRequest, 
    SamplesResponse, 
    CompareRequest, 
    HealthResponse,
    SampleInfo
)
from ..services.tts_service import tts_service
from ..services.model_loader import model_loader

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ChatterBox Multi-Dialect TTS API",
    description="Text-to-Speech API for Arabic dialects (Egyptian, Emirates, KSA, Kuwaiti)",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:5174",  # Alternative Vite port
        "http://localhost:3000",  # Alternative port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load metadata
METADATA_PATH = Path(__file__).parent.parent.parent / "training_samples" / "metadata.json"
TRAINING_SAMPLES_DIR = Path(__file__).parent.parent.parent / "training_samples"

def load_metadata() -> Dict:
    """Load training samples metadata"""
    with open(METADATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    logger.info("Starting ChatterBox TTS API...")
    logger.info(f"Device: {model_loader.device}")
    
    # Preload all models (optional - comment out if you want lazy loading)
    try:
        logger.info("Preloading models...")
        model_loader.load_all_models()
        logger.info("All models loaded successfully!")
    except Exception as e:
        logger.warning(f"Could not preload all models: {str(e)}")
        logger.info("Models will be loaded on-demand")

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    loaded_models = list(model_loader._models.keys())
    return HealthResponse(
        status="healthy",
        models_loaded=loaded_models,
        device=model_loader.device
    )

@app.get("/health", response_model=HealthResponse)
async def health():
    """Detailed health check"""
    loaded_models = list(model_loader._models.keys())
    return HealthResponse(
        status="healthy",
        models_loaded=loaded_models,
        device=model_loader.device
    )

# Directory for temporary reference audio uploads
TEMP_REFERENCE_DIR = Path("temp_reference_audio")
TEMP_REFERENCE_DIR.mkdir(exist_ok=True)

@app.post("/api/upload-reference")
async def upload_reference_audio(file: UploadFile = File(...)):
    """
    Upload a reference audio file for voice conditioning
    
    Args:
        file: WAV audio file
        
    Returns:
        Path to uploaded file
    """
    try:
        # Validate file type
        if not file.filename.endswith('.wav'):
            raise HTTPException(status_code=400, detail="Only WAV files are supported")
        
        # Save file temporarily
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        filename = f"reference_{unique_id}.wav"
        file_path = TEMP_REFERENCE_DIR / filename
        
        # Write file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Reference audio uploaded: {file_path}")
        
        return {
            "status": "success",
            "filename": filename,
            "path": str(file_path)
        }
    except Exception as e:
        logger.error(f"Error uploading reference audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@app.post("/api/generate")
async def generate_tts(request: TTSRequest):
    """
    Generate TTS audio from text
    
    Args:
        request: TTSRequest with text, dialect, generation parameters, and optional reference audio
        
    Returns:
        Audio file (WAV format)
    """
    try:
        logger.info(f"TTS request received - Dialect: {request.dialect}, Text: {request.text}")
        
        # Handle reference audio from uploaded file
        reference_audio_path = None
        if request.reference_audio_file:
            temp_ref_path = TEMP_REFERENCE_DIR / request.reference_audio_file
            if temp_ref_path.exists():
                reference_audio_path = temp_ref_path
                logger.info(f"Using uploaded reference audio: {reference_audio_path}")
            else:
                logger.warning(f"Reference audio file not found: {request.reference_audio_file}")
        
        # Generate audio with custom parameters and optional reference
        audio_path = tts_service.generate_audio(
            text=request.text,
            dialect=request.dialect,
            temperature=request.temperature,
            repetition_penalty=request.repetition_penalty,
            top_p=request.top_p,
            min_p=request.min_p,
            cfg_weight=request.cfg_weight,
            reference_audio_path=reference_audio_path
        )
        
        # Return audio file
        return FileResponse(
            path=audio_path,
            media_type="audio/wav",
            filename=f"{request.dialect}_generated.wav"
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        logger.error(f"Model not found: {str(e)}")
        raise HTTPException(
            status_code=404, 
            detail=f"Model not found. Please ensure models are downloaded."
        )
    except Exception as e:
        logger.error(f"Error generating TTS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")

@app.get("/api/samples", response_model=SamplesResponse)
async def get_samples():
    """
    Get list of all training samples
    
    Returns:
        Dictionary of samples by dialect
    """
    try:
        metadata = load_metadata()
        
        # Convert to SampleInfo objects
        response = {}
        for dialect, samples in metadata.items():
            response[dialect] = [SampleInfo(**sample) for sample in samples]
        
        return SamplesResponse(**response)
        
    except Exception as e:
        logger.error(f"Error loading samples: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading samples: {str(e)}")

@app.get("/api/samples/{dialect}/{sample_id}")
async def get_sample_audio(dialect: str, sample_id: str):
    """
    Get the original training sample audio
    
    Args:
        dialect: Dialect name (egyptian, emirates, ksa, kuwaiti)
        sample_id: Sample ID (e.g., sample1)
        
    Returns:
        Audio file (WAV format)
    """
    try:
        # Load metadata to get filename
        metadata = load_metadata()
        
        if dialect not in metadata:
            raise HTTPException(status_code=404, detail=f"Dialect '{dialect}' not found")
        
        # Find sample
        sample = next((s for s in metadata[dialect] if s['id'] == sample_id), None)
        if not sample:
            raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found")
        
        # Get audio file path
        audio_path = TRAINING_SAMPLES_DIR / dialect / sample['filename']
        
        if not audio_path.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Audio file not found: {sample['filename']}"
            )
        
        return FileResponse(
            path=audio_path,
            media_type="audio/wav",
            filename=sample['filename']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving sample: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving sample: {str(e)}")

@app.post("/api/compare")
async def compare_with_sample(request: CompareRequest):
    """
    Generate TTS for the same text as a training sample for comparison
    
    Args:
        request: CompareRequest with dialect, sample_id, generation parameters, and reference option
        
    Returns:
        Generated audio file (WAV format)
    """
    try:
        # Load metadata to get sample text
        metadata = load_metadata()
        
        if request.dialect not in metadata:
            raise HTTPException(status_code=404, detail=f"Dialect '{request.dialect}' not found")
        
        # Find sample
        sample = next((s for s in metadata[request.dialect] if s['id'] == request.sample_id), None)
        if not sample:
            raise HTTPException(status_code=404, detail=f"Sample '{request.sample_id}' not found")
        
        # Use selected sample as reference audio if requested
        reference_audio_path = None
        if request.use_sample_as_reference:
            reference_audio_path = TRAINING_SAMPLES_DIR / request.dialect / sample['filename']
            logger.info(f"Using sample audio as reference: {reference_audio_path}")
        
        # Generate TTS using the sample text with custom parameters and reference
        audio_path = tts_service.generate_audio(
            text=sample['text'],
            dialect=request.dialect,
            temperature=request.temperature,
            repetition_penalty=request.repetition_penalty,
            top_p=request.top_p,
            min_p=request.min_p,
            cfg_weight=request.cfg_weight,
            reference_audio_path=reference_audio_path
        )
        
        return FileResponse(
            path=audio_path,
            media_type="audio/wav",
            filename=f"{request.dialect}_{request.sample_id}_generated.wav"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating comparison: {str(e)}")

@app.get("/api/dialects")
async def get_dialects():
    """Get list of available dialects"""
    return {
        "dialects": ["egyptian", "emirates", "ksa", "kuwaiti"],
        "display_names": {
            "egyptian": "Egyptian Arabic (مصري)",
            "emirates": "Emirati Arabic (إماراتي)",
            "ksa": "Saudi Arabic (سعودي)",
            "kuwaiti": "Kuwaiti Arabic (كويتي)"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

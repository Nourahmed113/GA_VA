"""
Pydantic models for API requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List

class TTSRequest(BaseModel):
    """Request model for TTS generation"""
    text: str = Field(..., description="Arabic text to convert to speech", min_length=1)
    dialect: str = Field(..., description="Dialect to use (egyptian, emirates, ksa, kuwaiti)")
    
    # Generation parameters (optional, with defaults)
    temperature: Optional[float] = Field(0.8, description="Controls randomness (lower = more conservative, higher = more creative)")
    repetition_penalty: Optional[float] = Field(2.0, description="Prevents repetition (higher = less repetition)")
    top_p: Optional[float] = Field(1.0, description="Nucleus sampling threshold (lower = more focused)")
    min_p: Optional[float] = Field(0.05, description="Minimum probability threshold")
    cfg_weight: Optional[float] = Field(0.5, description="Classifier-free guidance weight")
    
    # Reference audio for voice conditioning (optional)
    reference_audio_file: Optional[str] = Field(None, description="Filename of uploaded reference audio")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "مرحبا بك",
                "dialect": "egyptian",
                "temperature": 0.8,
                "repetition_penalty": 2.0,
                "use_training_sample": True,
                "training_sample_id": "sample1"
            }
        }

class SampleInfo(BaseModel):
    """Information about a training sample"""
    id: str
    text: str
    filename: str
    description: str

class SamplesResponse(BaseModel):
    """Response model for training samples"""
    egyptian: List[SampleInfo]
    emirates: List[SampleInfo]
    ksa: List[SampleInfo]
    kuwaiti: List[SampleInfo]

class CompareRequest(BaseModel):
    """Request model for comparing generated TTS with training sample"""
    dialect: str = Field(..., description="Dialect to use")
    sample_id: str = Field(..., description="ID of the training sample")
    
    # Generation parameters (optional, with defaults)
    temperature: Optional[float] = Field(0.8, description="Controls randomness")
    repetition_penalty: Optional[float] = Field(2.0, description="Prevents repetition")
    top_p: Optional[float] = Field(1.0, description="Nucleus sampling threshold")
    min_p: Optional[float] = Field(0.05, description="Minimum probability threshold")
    cfg_weight: Optional[float] = Field(0.5, description="Classifier-free guidance weight")
    
    # Reference audio (optional) - defaults to using selected sample as reference
    use_sample_as_reference: Optional[bool] = Field(True, description="Use the selected sample as voice reference")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dialect": "egyptian",
                "sample_id": "sample1",
                "use_sample_as_reference": True
            }
        }

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    models_loaded: List[str]
    device: str

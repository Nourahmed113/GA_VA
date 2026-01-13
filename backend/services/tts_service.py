"""
TTS Service for ChatterBox Models
Handles text-to-speech generation for different Arabic dialects
"""

import torch
import torchaudio
import numpy as np
from pathlib import Path
from typing import Optional, Dict, Any
import logging
from .model_loader import model_loader

logger = logging.getLogger(__name__)

class TTSService:
    """Service for generating speech from text using ChatterBox models"""
    
    def __init__(self):
        self.model_loader = model_loader
        self.output_dir = Path(__file__).parent.parent.parent / "generated_audio"
        self.output_dir.mkdir(exist_ok=True)
        logger.info(f"TTS Service initialized. Output dir: {self.output_dir}")
    
    def preprocess_text(self, text: str) -> str:
        """Preprocess Arabic text for TTS"""
        # Remove extra whitespace
        text = " ".join(text.split())
        # Add any other preprocessing needed for ChatterBox
        return text
    
    def generate_audio(
        self, 
        text: str, 
        dialect: str,
        temperature: float = 0.8,
        repetition_penalty: float = 2.0,
        top_p: float = 1.0,
        min_p: float = 0.05,
        cfg_weight: float = 0.5,
        reference_audio_path: Optional[Path] = None,
        output_path: Optional[Path] = None
    ) -> Path:
        """
        Generate audio from text using specified dialect model
        
        Args:
            text: Input text in Arabic
            dialect: Dialect to use (egyptian, emirates, ksa, kuwaiti)
            temperature: Controls randomness (lower = more conservative)
            repetition_penalty: Prevents repetition (higher = less repetition)
            top_p: Nucleus sampling threshold
            min_p: Minimum probability threshold
            cfg_weight: Classifier-free guidance weight
            reference_audio_path: Optional path to reference audio for voice conditioning
            output_path: Optional custom output path
            
        Returns:
            Path to generated audio file
        """
        logger.info(f"Generating audio for dialect: {dialect}")
        logger.info(f"Input text: {text}")
        logger.info(f"Parameters: temp={temperature}, rep_pen={repetition_penalty}, top_p={top_p}, min_p={min_p}, cfg={cfg_weight}")
        if reference_audio_path:
            logger.info(f"Using reference audio: {reference_audio_path}")
        
        # Validate dialect
        valid_dialects = ['egyptian', 'emirates', 'ksa', 'kuwaiti']
        if dialect not in valid_dialects:
            raise ValueError(f"Invalid dialect. Must be one of: {valid_dialects}")
        
        # Preprocess text
        processed_text = self.preprocess_text(text)
        
        try:
            # Load model
            model = self.model_loader.get_model(dialect)
            
            # Generate audio using ChatterBox with custom parameters
            logger.info(f"Generating audio with ChatterBox model...")
            
            import time
            start_time = time.time()
            
            # OPTIMIZATION: Use inference_mode for better performance than no_grad
            with torch.inference_mode():
                # Prepare generation kwargs
                gen_kwargs = {
                    "language_id": "ar",
                    "temperature": temperature,
                    "repetition_penalty": repetition_penalty,
                    "top_p": top_p,
                    "min_p": min_p,
                    "cfg_weight": cfg_weight
                }
                
                # Add reference audio path if provided
                if reference_audio_path and reference_audio_path.exists():
                    gen_kwargs["audio_prompt_path"] = str(reference_audio_path)
                    logger.info(f"✅ Using reference audio for voice cloning: {reference_audio_path}")
                
                wav = model.generate(processed_text, **gen_kwargs)
            
            inference_time = time.time() - start_time
            
            # Save audio
            if output_path is None:
                import hashlib
                text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
                output_path = self.output_dir / f"{dialect}_{text_hash}.wav"
            
            # Save as WAV file using the model's sample rate
            self._save_audio(wav, output_path, sample_rate=model.sr)
            
            audio_duration = wav.shape[-1] / model.sr
            logger.info(f"Audio saved to: {output_path}")
            logger.info(f"Audio generated successfully: {output_path}")
            logger.info(f"Audio duration: {audio_duration:.2f}s")
            logger.info(f"⏱️  Inference time: {inference_time:.2f}s")
            logger.info(f"⚡ Real-time factor: {audio_duration/inference_time:.2f}x")
            
            # Return both path and inference time
            return output_path, inference_time
            
        except Exception as e:
            logger.error(f"Error generating audio: {str(e)}")
            raise
    
    def _save_audio(self, audio: torch.Tensor, path: Path, sample_rate: int = 22050):
        """Save audio tensor to WAV file"""
        # Ensure audio is 2D (channels, samples)
        if audio.dim() == 1:
            audio = audio.unsqueeze(0)
        
        # Normalize audio to [-1, 1]
        audio = audio / torch.max(torch.abs(audio))
        
        # Save as WAV
        torchaudio.save(str(path), audio, sample_rate, format="wav")
        logger.info(f"Audio saved to: {path}")

# Global instance
tts_service = TTSService()

"""
Model Loader for ChatterBox TTS Models
Handles loading and caching of all 4 dialect models
"""

import os
import torch
from pathlib import Path
from typing import Dict, Optional
import logging
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

logger = logging.getLogger(__name__)

class ModelLoader:
    """Singleton class to manage ChatterBox model loading"""
    
    _instance = None
    _models: Dict[str, any] = {}
    
    # Device detection with MPS (Apple Silicon) support
    if torch.backends.mps.is_available():
        _device: str = "mps"
    elif torch.cuda.is_available():
        _device: str = "cuda"
    else:
        _device: str = "cpu"
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        self.models_dir = Path(__file__).parent.parent.parent / "models"
        logger.info(f"Model loader initialized. Device: {self._device}")
        logger.info(f"Models directory: {self.models_dir}")
    
    def load_model(self, dialect: str):
        """Load a specific dialect model from HuggingFace"""
        if dialect in self._models:
            logger.info(f"Model for {dialect} already loaded")
            return self._models[dialect]
        
        # Check if model was downloaded locally
        local_model_path = self.models_dir / dialect
        
        if not local_model_path.exists():
            raise FileNotFoundError(f"Model not found at {local_model_path}. Please download from HuggingFace first.")
        
        logger.info(f"Loading {dialect} model from local path: {local_model_path}...")
        logger.info(f"Using device: {self._device}")
        
        try:
            # MONKEY PATCH: Fix vocabulary size mismatch (2352 -> 2454)
            # The fine-tuned models use an expanded vocabulary of 2454 tokens
            from chatterbox.models.t3.modules.t3_config import T3Config
            
            # Patch the multilingual method to return config with 2454 tokens
            @classmethod
            def patched_multilingual(cls):
                # Force the correct vocabulary size
                return cls(text_tokens_dict_size=2454)
                
            T3Config.multilingual = patched_multilingual
            logger.info("PATCH APPLIED: T3Config.multilingual patched to use vocab size 2454")

            # VERIFY: Log which files will be loaded to confirm fine-tuned model
            logger.info("=" * 60)
            logger.info("LOADING FINE-TUNED MODEL FILES:")
            model_files = {
                "T3 (Text-to-Speech Transformer)": local_model_path / "t3_23lang.safetensors",
                "S3Gen (Speech Generator)": local_model_path / "s3gen.pt",
                "Voice Encoder": local_model_path / "ve.pt",
                "Conditionals (Voice/Style)": local_model_path / "conds.pt",
                "Tokenizer": local_model_path / "mtl_tokenizer.json"
            }
            
            for component, file_path in model_files.items():
                if file_path.exists():
                    # Check if it's a symlink
                    if file_path.is_symlink():
                        target = file_path.readlink()
                        resolved = (local_model_path / target).resolve()
                        size_mb = resolved.stat().st_size / (1024**2)
                        logger.info(f"  ✓ {component}")
                        logger.info(f"    Symlink: {file_path.name} -> {target}")
                        logger.info(f"    Actual: {resolved.name} ({size_mb:.1f} MB)")
                    else:
                        size_mb = file_path.stat().st_size / (1024**2)
                        logger.info(f"  ✓ {component}: {file_path.name} ({size_mb:.1f} MB)")
                else:
                    logger.warning(f"  ✗ {component}: NOT FOUND at {file_path.name}")
            
            logger.info("=" * 60)
            logger.info("NOTE: These are YOUR FINE-TUNED models from Genarabia-ai")
            logger.info("      NOT the pretrained ResembleAI/chatterbox base model")
            logger.info("=" * 60)

            # Load from local HuggingFace download 
            model = ChatterboxMultilingualTTS.from_local(
                str(local_model_path),
                device=self._device
            )
            
            # Wrapper class doesn't have eval(), sub-models are already set to eval() in from_local
            
            # OPTIMIZATION: Convert T3 to FP16 (Half Precision)
            # DISABLED: User reported hallucinations/quality degradation with FP16.
            # Reverting to FP32 for stability and quality.
            # try:
            #     logger.info("Optimizing: Converting T3 transformer to Float16...")
            #     model.t3.half()
            #     
            #     # Also convert conditionals if they exist
            #     if hasattr(model, 'conds') and model.conds and hasattr(model.conds, 't3'):
            #          c = model.conds.t3
            #          if hasattr(c, 'speaker_emb') and isinstance(c.speaker_emb, torch.Tensor):
            #              c.speaker_emb = c.speaker_emb.half()
            #          if hasattr(c, 'emotion_adv') and isinstance(c.emotion_adv, torch.Tensor):
            #              c.emotion_adv = c.emotion_adv.half()
            #     
            #     logger.info("✅ Optimization successful: T3 model converted to FP16")
            # except Exception as e:
            #     logger.warning(f"Optimization warning: Could not convert to FP16: {e}")
            #     logger.warning("Continuing with default precision (FP32)")

            self._models[dialect] = model
            logger.info(f"✅ Successfully loaded {dialect} model")
            try:
                logger.info(f"Model sample rate: {model.sr} Hz")
            except:
                pass
            
            return model
            
        except Exception as e:
            import traceback
            logger.error(f"Error loading {dialect} from HuggingFace: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    def load_all_models(self):
        """Preload all dialect models for faster inference"""
        dialects = ['egyptian', 'emirates', 'ksa', 'kuwaiti']
        
        for dialect in dialects:
            try:
                self.load_model(dialect)
            except FileNotFoundError as e:
                logger.warning(f"Skipping {dialect}: {str(e)}")
            except Exception as e:
                logger.error(f"Failed to load {dialect}: {str(e)}")
    
    def get_model(self, dialect: str):
        """Get a loaded model or load it if not cached"""
        if dialect not in self._models:
            return self.load_model(dialect)
        return self._models[dialect]
    
    @property
    def device(self):
        return self._device
    
    def clear_cache(self):
        """Clear all loaded models from memory"""
        self._models.clear()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("Model cache cleared")

# Global instance
model_loader = ModelLoader()

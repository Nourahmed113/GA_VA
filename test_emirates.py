"""
Test script for Emirates model
Purpose: Test the current Emirates TTS model to diagnose hallucination issues
"""

import torch
import torchaudio
from pathlib import Path
import logging
from backend.services.model_loader import model_loader
from backend.services.tts_service import tts_service

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_emirates_model():
    """Test Emirates model with various text inputs"""
    
    # Test texts (from simple to complex)
    test_texts = [
        "مرحبا",  # Hello
        "كيف حالك",  # How are you
        "مرحبا بك في دولة الإمارات",  # Welcome to the Emirates
        "الطقس اليوم جميل في دبي",  # The weather today is beautiful in Dubai
    ]
    
    logger.info("=" * 80)
    logger.info("EMIRATES MODEL HALLUCINATION DIAGNOSTIC TEST")
    logger.info("=" * 80)
    logger.info(f"Device: {model_loader.device}")
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    logger.info(f"MPS available: {torch.backends.mps.is_available()}")
    logger.info("")
    
    # Load model
    logger.info("Loading Emirates model...")
    model = model_loader.get_model("emirates")
    logger.info(f"Model loaded successfully")
    logger.info(f"Model sample rate: {model.sr}")
    logger.info("")
    
    # Test each text
    output_dir = Path("test_outputs")
    output_dir.mkdir(exist_ok=True)
    
    for i, text in enumerate(test_texts, 1):
        logger.info("-" * 80)
        logger.info(f"TEST {i}/{len(test_texts)}")
        logger.info(f"Text: {text}")
        logger.info("-" * 80)
        
        try:
            # Generate with CURRENT settings
            logger.info("Generating with CURRENT settings (temp=0.4, rep_penalty=1.2)...")
            audio_path = tts_service.generate_audio(
                text=text,
                dialect="emirates"
            )
            logger.info(f"✅ Current version generated: {audio_path}")
            
            # Also try with OFFICIAL CHATTERBOX DEFAULTS for comparison
            logger.info("\nGenerating with OFFICIAL CHATTERBOX DEFAULTS (temp=0.8, rep_pen=2.0)...")
            with torch.no_grad():
                wav_official = model.generate(
                    text,
                    language_id="ar",
                    temperature=0.8,        # Official default
                    repetition_penalty=2.0,  # Official default (CRITICAL!)
                    top_p=1.0,              # Official default
                    min_p=0.05,             # Official default
                    cfg_weight=0.5          # Official default
                )
            
            official_path = output_dir / f"test_{i}_official_defaults.wav"
            # Save official defaults version
            if wav_official.dim() == 1:
                wav_official = wav_official.unsqueeze(0)
            wav_official = wav_official / torch.max(torch.abs(wav_official))
            torchaudio.save(str(official_path), wav_official, model.sr, format="wav")
            logger.info(f"✅ Official defaults version generated: {official_path}")
            
            logger.info(f"\n📊 Generated 2 versions for comparison:")
            logger.info(f"   1. CURRENT (temp=0.4, rep_pen=1.2): {audio_path}")
            logger.info(f"   2. OFFICIAL DEFAULTS (temp=0.8, rep_pen=2.0): {official_path}")
            logger.info("")
            
        except Exception as e:
            logger.error(f"❌ Error: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            logger.info("")
    
    logger.info("=" * 80)
    logger.info("TEST COMPLETE")
    logger.info("=" * 80)
    logger.info(f"All outputs saved to: {output_dir.absolute()}")
    logger.info("\nPlease listen to the generated files and compare:")
    logger.info("- CURRENT version likely has hallucinations (repetitive/extra sounds)")
    logger.info("- OFFICIAL DEFAULTS version should sound natural and clean")
    logger.info("- If official defaults sound better, we'll apply the fix!")
    logger.info("\nExpected finding: Official defaults (temp=0.8, rep_pen=2.0) should fix hallucinations")

if __name__ == "__main__":
    test_emirates_model()

"""Quick test to verify Kuwaiti model loads correctly"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from services.model_loader import model_loader

print("=" * 60)
print("Testing Kuwaiti Model Loading")
print("=" * 60)

try:
    print("\n🔄 Loading Kuwaiti model...")
    model = model_loader.load_model('kuwaiti')
    print("✅ Kuwaiti model loaded successfully!")
    print(f"📊 Device: {model_loader.device}")
    print(f"🎵 Sample rate: {model.sr} Hz")
    
    print("\n🎤 Testing basic text generation...")
    import torch
    with torch.no_grad():
        test_text = "مرحبا بك في الكويت"
        print(f"📝 Test text: {test_text}")
        wav = model.generate(
            test_text,
            language_id="ar",
            temperature=0.8,
            repetition_penalty=2.0
        )
    print(f"✅ Generation successful! Audio shape: {wav.shape}")
    print(f"⏱️  Duration: {wav.shape[-1] / model.sr:.2f} seconds")
    
    print("\n" + "=" * 60)
    print("✨ All tests passed! Kuwaiti model is ready to use.")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

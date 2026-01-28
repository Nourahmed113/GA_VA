"""
GenArabia Voice Agent - Modal Deployment
Multi-Dialect Arabic TTS API with Hugging Face Model Loading
"""

import modal
import os
import json
import time
from pathlib import Path
from typing import Optional, Dict

# Create Modal app
app = modal.App("genarabia-voice-agent")

# Define container image with all dependencies
# Install in two stages to handle pkuseg's numpy dependency
image = (
    modal.Image.debian_slim(python_version="3.10")
    # First install numpy (required by pkuseg)
    .pip_install("numpy==1.26.4")
    # Then install all other dependencies
    .pip_install(
        # Core dependencies
        "fastapi==0.109.0",
        "torch==2.6.0",
        "torchaudio==2.6.0",
        "huggingface-hub==0.36.0",
        "python-multipart==0.0.6",
        "pydantic==2.5.0",
        "scipy==1.11.4",
        
        # ChatterBox and related
        "chatterbox-tts==0.1.3",
        "safetensors==0.5.3",
        "transformers==4.46.3",
        "diffusers==0.29.0",
        "resemble-perth==1.0.1",
        "conformer==0.3.2",
        
        # Tokenization (pkuseg now after numpy)
        "s3tokenizer==0.3.0",
        "pykakasi==2.3.0",
        "pkuseg==0.0.25",
        "regex==2025.11.3",
        "tokenizers==0.20.3",
        
        # Audio processing
        "librosa==0.11.0",
        "soundfile==0.13.1",
        "audioread==3.1.0",
        
        # Utilities
        "einops==0.8.1",
        "Pillow==11.3.0",
        "importlib_metadata==8.7.1",
    )
)

# Create Modal Volume for temporary files (reference audio)
temp_volume = modal.Volume.from_name("genarabia-temp", create_if_missing=True)

# Hugging Face model repositories
HF_REPOS = {
    "egyptian": "Genarabia-ai/Chatterbox_Egyptian",
    "emirates": "Genarabia-ai/Chatterbox_Emirates",
    "ksa": "Genarabia-ai/Chatterbox_KSA",
    "kuwaiti": "Genarabia-ai/Chatterbox_Kuwaiti"
}

# Training samples metadata (embedded)
TRAINING_SAMPLES_METADATA = {
    "egyptian": [
        {"id": "eg_sample_1", "filename": "egyptian_sample1.wav", "text": "مرحبا بكم في GenArabia"},
        {"id": "eg_sample_2", "filename": "egyptian_sample2.wav", "text": "نظام توليد الصوت بالعربية"}
    ],
    "emirates": [
        {"id": "em_sample_1", "filename": "emirates_sample1.wav", "text": "أهلا وسهلا في GenArabia"},
        {"id": "em_sample_2", "filename": "emirates_sample2.wav", "text": "تقنية تحويل النص إلى صوت"}
    ],
    "ksa": [
        {"id": "ksa_sample_1", "filename": "ksa_sample1.wav", "text": "مرحبا في GenArabia"},
        {"id": "ksa_sample_2", "filename": "ksa_sample2.wav", "text": "نظام ذكي للصوت العربي"}
    ],
    "kuwaiti": [
        {"id": "kw_sample_1", "filename": "kuwaiti_sample1.wav", "text": "هلا والله في GenArabia"},
        {"id": "kw_sample_2", "filename": "kuwaiti_sample2.wav", "text": "برنامج تحويل النص لصوت"}
    ]
}


@app.cls(
    gpu="a10g",  # A10G GPU for inference
    image=image,
    secrets=[modal.Secret.from_name("huggingface-secret")],  # HF_TOKEN
    volumes={"/temp": temp_volume},
    timeout=600,  # 10 minute timeout
    scaledown_window=300,  # Keep warm for 5 minutes after last request
    min_containers=1,  # Keep 1 container warm for instant responses
)
class ChatterboxAPI:
    """
    Multi-dialect Arabic TTS API class
    Loads all 4 dialect models on startup for instant generation
    """
    
    @modal.enter()
    def load_models(self):
        """Load all dialect models on container startup"""
        import torch
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        from huggingface_hub import snapshot_download
        
        print("=" * 60)
        print("INITIALIZING GENARABIA VOICE AGENT")
        print("=" * 60)
        
        # Get HF token from environment
        self.hf_token = os.environ.get("HF_TOKEN")
        if not self.hf_token:
            raise ValueError("HF_TOKEN not found in secrets!")
        
        print(f"✅ HuggingFace token loaded")
        
        # Detect device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🖥️  Device: {self.device}")
        
        # Download and load all 4 models
        self.models = {}
        
        for dialect, repo_id in HF_REPOS.items():
            print(f"\n{'='*60}")
            print(f"Loading {dialect.upper()} model from {repo_id}")
            print(f"{'='*60}")
            
            try:
                # Download model from HuggingFace
                model_path = snapshot_download(
                    repo_id=repo_id,
                    token=self.hf_token,
                    cache_dir="/cache/hf"
                )
                print(f"📦 Model downloaded to: {model_path}")
                
                # Create symlinks if needed
                self._create_symlinks(Path(model_path))
                
                # Apply vocab size patch
                self._apply_vocab_patch()
                
                # Patch torch.load for device mapping
                original_torch_load = torch.load
                
                def patched_torch_load(f, *args, **kwargs):
                    kwargs['map_location'] = self.device
                    return original_torch_load(f, *args, **kwargs)
                
                torch.load = patched_torch_load
                
                # Load model
                model = ChatterboxMultilingualTTS.from_local(
                    model_path,
                    device=self.device
                )
                
                # Restore torch.load
                torch.load = original_torch_load
                
                # Compile T3 transformer for performance
                try:
                    print(f"🔧 Compiling T3 transformer...")
                    model.t3 = torch.compile(model.t3, mode="reduce-overhead")
                    print(f"✅ T3 compiled successfully")
                except Exception as e:
                    print(f"⚠️  Could not compile T3: {e}")
                
                self.models[dialect] = model
                print(f"✅ {dialect.upper()} model loaded successfully!")
                
            except Exception as e:
                print(f"❌ Error loading {dialect}: {str(e)}")
                raise
        
        print("\n" + "=" * 60)
        print(f"✅ ALL {len(self.models)} MODELS LOADED AND READY!")
        print("=" * 60)
    
    def _create_symlinks(self, model_path: Path):
        """Create symlinks for expected file names"""
        symlinks = [
            ("t3_mtl23ls_v2.safetensors", "t3_23lang.safetensors"),
            ("grapheme_mtl_merged_expanded_v1.json", "mtl_tokenizer.json"),
        ]
        
        for source, target in symlinks:
            source_path = model_path / source
            target_path = model_path / target
            
            if source_path.exists() and not target_path.exists():
                try:
                    import os
                    os.symlink(source, target_path)
                    print(f"✅ Created symlink: {target} -> {source}")
                except Exception as e:
                    print(f"⚠️  Symlink warning: {e}")
    
    def _apply_vocab_patch(self):
        """Apply vocabulary size patch for T3Config"""
        from chatterbox.models.t3.modules.t3_config import T3Config
        
        @classmethod
        def patched_multilingual(cls):
            return cls(text_tokens_dict_size=2454)
        
        T3Config.multilingual = patched_multilingual
        print("🔧 Applied T3Config vocab patch (2454 tokens)")
    
    @modal.method()
    def generate(
        self,
        text: str,
        dialect: str,
        temperature: float = 0.8,
        repetition_penalty: float = 2.0,
        top_p: float = 1.0,
        min_p: float = 0.05,
        cfg_weight: float = 0.5,
        reference_audio_path: Optional[str] = None
    ) -> tuple[bytes, float]:
        """
        Generate TTS audio for given text and dialect
        
        Returns:
            Tuple of (audio_bytes, inference_time)
        """
        import torch
        import torchaudio
        import io
        
        print(f"\n🎙️  TTS Request: {dialect} - {text[:50]}...")
        
        if dialect not in self.models:
            raise ValueError(f"Unknown dialect: {dialect}")
        
        model = self.models[dialect]
        
        # Generate audio
        start_time = time.time()
        
        with torch.inference_mode():
            gen_kwargs = {
                "language_id": "ar",
                "temperature": temperature,
                "repetition_penalty": repetition_penalty,
                "top_p": top_p,
                "min_p": min_p,
                "cfg_weight": cfg_weight
            }
            
            if reference_audio_path:
                gen_kwargs["audio_prompt_path"] = reference_audio_path
                print(f"🎵 Using reference audio: {reference_audio_path}")
            
            wav = model.generate(text, **gen_kwargs)
        
        inference_time = time.time() - start_time
        
        # Convert to bytes
        buffer = io.BytesIO()
        
        # Ensure correct shape
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)
        
        # Normalize
        wav = wav / torch.max(torch.abs(wav))
        
        # Save to buffer
        torchaudio.save(buffer, wav, model.sr, format="wav")
        buffer.seek(0)
        
        audio_duration = wav.shape[-1] / model.sr
        rtf = audio_duration / inference_time
        
        print(f"✅ Generated {audio_duration:.2f}s audio in {inference_time:.2f}s (RTF: {rtf:.2f}x)")
        
        return buffer.read(), inference_time
    
    @modal.method()
    def upload_reference(self, filename: str, audio_data: bytes) -> str:
        """Upload reference audio to temp volume"""
        ref_path = f"/temp/{filename}"
        with open(ref_path, "wb") as f:
            f.write(audio_data)
        print(f"📤 Reference audio uploaded: {ref_path}")
        return ref_path
    
    @modal.fastapi_endpoint(method="POST", docs=True)
    def api_generate(self, item: Dict):
        """
        FastAPI endpoint for TTS generation
        
        Request body:
        {
            "text": str,
            "dialect": str,
            "temperature": float (optional),
            "repetition_penalty": float (optional),
            ...
        }
        """
        from fastapi.responses import Response
        
        # Extract parameters
        text = item.get("text")
        dialect = item.get("dialect")
        
        if not text or not dialect:
            return {"error": "Missing required fields: text, dialect"}
        
        # Optional parameters with defaults
        params = {
            "temperature": item.get("temperature", 0.8),
            "repetition_penalty": item.get("repetition_penalty", 2.0),
            "top_p": item.get("top_p", 1.0),
            "min_p": item.get("min_p", 0.05),
            "cfg_weight": item.get("cfg_weight", 0.5),
        }
        
        # Generate audio
        audio_bytes, inference_time = self.generate.local(
            text=text,
            dialect=dialect,
            **params
        )
        
        # Return audio with inference time header
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "X-Inference-Time": str(inference_time),
                "Content-Disposition": f'attachment; filename="{dialect}_generated.wav"'
            }
        )
    
    @modal.fastapi_endpoint(method="GET")
    def health(self):
        """Health check endpoint"""
        return {
            "status": "healthy",
            "models_loaded": list(self.models.keys()),
            "device": self.device,
            "num_models": len(self.models)
        }
    
    @modal.fastapi_endpoint(method="GET")
    def api_samples(self):
        """Get training samples metadata"""
        return TRAINING_SAMPLES_METADATA
    
    @modal.fastapi_endpoint(method="GET")
    def api_dialects(self):
        """Get available dialects"""
        return {
            "dialects": ["egyptian", "emirates", "ksa", "kuwaiti"],
            "display_names": {
                "egyptian": "Egyptian Arabic (مصري)",
                "emirates": "Emirati Arabic (إماراتي)",
                "ksa": "Saudi Arabic (سعودي)",
                "kuwaiti": "Kuwaiti Arabic (كويتي)"
            }
        }


@app.local_entrypoint()
def test():
    """Test the API locally before deployment"""
    api = ChatterboxAPI()
    
    # Test generation
    test_text = "مرحبا بكم في GenArabia"
    print(f"\n🧪 Testing generation with text: {test_text}")
    
    audio_bytes, inference_time = api.generate.remote(
        text=test_text,
        dialect="egyptian"
    )
    
    print(f"\n✅ Test successful!")
    print(f"   Audio size: {len(audio_bytes)} bytes")
    print(f"   Inference time: {inference_time:.2f}s")
    print(f"\n💡 Deploy with: modal deploy modal_api.py")

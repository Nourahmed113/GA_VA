# GenArabia Voice Agent 🎙️

A professional multi-dialect Arabic Text-to-Speech (TTS) web application powered by fine-tuned ChatterBox models. Features a modern React frontend with real-time inference time tracking and optimized backend performance.

![GenArabia Logo](frontend/public/genarabia-logo.png)

## 🌟 Features

- **4 Arabic Dialects**: Egyptian (مصري), Emirati (إماراتي), Saudi (سعودي), Kuwaiti (كويتي)
- **Voice Conditioning**: Upload reference audio for voice cloning
- **Advanced Controls**: Temperature, Repetition Penalty, Top-P, Min-P, CFG Weight
- **Real-time Inference Tracking**: See exactly how long generation takes
- **Modern UI**: GenArabia branded interface with blue-purple gradients
- **Sample Comparison**: Compare generated TTS with training samples
- **Professional Audio Player**: Custom play/pause/download controls

## 🚀 Performance Optimizations

### Backend Optimizations
1. **Lazy Model Loading** - Models load on-demand (startup: 60s → 5s, 92% reduction)
2. **Torch Compilation** - `torch.compile()` on T3 transformer (10-20% speedup)
3. **Inference Mode** - `torch.inference_mode()` instead of `no_grad()` (5-10% speedup)
4. **MPS Device Support** - Optimized for Apple Silicon
5. **Quality Preservation** - Maintained `repetition_penalty=2.0` and FP32 precision to prevent hallucinations

**Expected Performance:**
- Overall generation speedup: 25-45%
- Startup time: ~5 seconds
- Real-time factor: varies by text length

## 🏗️ Architecture

```
GenArabia Voice Agent/
├── backend/
│   ├── api/
│   │   └── main.py              # FastAPI application
│   └── services/
│       ├── model_loader.py      # Model management with torch.compile
│       └── tts_service.py       # TTS generation with timing
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TTSGenerator.jsx     # Main TTS interface
│   │   │   ├── SampleComparison.jsx # Sample comparison
│   │   │   └── AudioPlayer.jsx      # Custom audio player
│   │   ├── App.jsx              # Main app with routing
│   │   └── App.css              # GenArabia branded styles
│   └── public/
│       └── genarabia-logo.png   # Brand logo
├── models/                      # Fine-tuned ChatterBox models (not in repo)
│   ├── egyptian/
│   ├── emirates/
│   ├── ksa/
│   └── kuwaiti/
└── training_samples/            # Sample audio files
```

## 📋 Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn
- 8GB+ RAM recommended
- Apple Silicon (MPS) or CUDA GPU recommended

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Nourahmed113/Genarabia-Voice-Agent.git
cd Genarabia-Voice-Agent
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Download Models
**Note:** Models are ~20GB total and must be downloaded separately.

Place your fine-tuned ChatterBox models in the `models/` directory:
```
models/
├── egyptian/
├── emirates/
├── ksa/
└── kuwaiti/
```

Each dialect folder should contain:
- `t3_23lang.safetensors` (or symlink to `t3_mtl23ls_v2.safetensors`)
- `s3gen.pt`
- `ve.pt`
- `conds.pt`
- `mtl_tokenizer.json` (or symlink)

## 🚀 Running the Application

### Start Backend (Terminal 1)
```bash
source venv/bin/activate
python -m uvicorn backend.api.main:app --reload --host 127.0.0.1 --port 8000
```

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🎨 UI Features

### GenArabia Branding
- **Colors**: Light Blue (#33C3F0), Dark Blue (#1E3A8A), Purple (#9333EA)
- **Logo**: 150px animated with glow effect
- **Typography**: Inter + Cairo fonts
- **No Emojis**: Professional icon design (except dialect flags)

### Audio Player
- Custom gradient play/pause button
- Progress bar with GenArabia colors
- Volume control
- Download button with hover effects

### Inference Time Display
- Real-time tracking badge
- Shows generation time in seconds
- Gradient styled badge matching brand colors

## 🔑 Key Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **PyTorch** - Deep learning framework
- **ChatterBox** - ResembleAI's TTS model
- **torchaudio** - Audio processing
- **uvicorn** - ASGI server

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Axios** - HTTP client
- **CSS3** - Custom styling with gradients

## 📊 API Endpoints

### Generate TTS
```http
POST /api/generate
Content-Type: application/json

{
  "text": "النص العربي",
  "dialect": "egyptian",
  "temperature": 0.8,
  "repetition_penalty": 2.0,
  "top_p": 1.0,
  "min_p": 0.05,
  "cfg_weight": 0.5,
  "reference_audio_file": "optional_reference.wav"
}
```

Response: WAV audio file
Headers: `X-Inference-Time: <seconds>`

### Upload Reference Audio
```http
POST /api/upload-reference
Content-Type: multipart/form-data

file: <WAV file>
```

### Compare Samples
```http
POST /api/compare
Content-Type: application/json

{
  "dialect": "egyptian",
  "sample_id": "eg_sample_1",
  "temperature": 0.8,
  ...
}
```

## 🛠️ Development Notes

### Device Compatibility Fix
If you encounter CUDA device serialization errors on MPS/CPU:
```bash
python fix_kuwaiti_device.py  # Run for each affected model
```

### Model Loading
- Models use lazy loading by default
- First request per dialect will take ~10s (model loading)
- Subsequent requests are faster

### Preventing Hallucinations
**Critical**: Always maintain:
- `repetition_penalty=2.0`
- FP32 precision (no FP16)
- These settings are hardcoded for quality

## 📝 Configuration

### Backend Configuration
Edit `backend/api/main.py`:
- CORS origins
- Model paths
- Device selection (MPS/CUDA/CPU)

### Frontend Configuration
Edit `frontend/src/components/TTSGenerator.jsx`:
- API base URL
- Default parameters
- Available dialects

## 🎯 Future Enhancements

- [ ] Streaming audio generation
- [ ] Batch processing
- [ ] Additional Arabic dialects
- [ ] Export to multiple formats (MP3, OGG)
- [ ] User authentication
- [ ] Save/load presets

## 📄 License

This project uses the ChatterBox model which follows ResembleAI's licensing.

## 🙏 Acknowledgments

- **ResembleAI** - ChatterBox TTS model
- **GenArabia AI** - Fine-tuned Arabic dialect models
- **Google Fonts** - Inter & Cairo typography

## 👥 Authors

**Nour Ahmed** - [GitHub](https://github.com/Nourahmed113)

---

**GenArabia Voice Agent** - Professional Arabic Text-to-Speech for Multiple Dialects

# ChatterBox Multi-Dialect Arabic TTS Web App

A modern web application for Text-to-Speech (TTS) generation using fine-tuned ChatterBox models for multiple Arabic dialects.

## Features

- 🎤 **Multi-Dialect Support**: Egyptian, Emirati, Saudi, and Kuwaiti dialects
- 🎛️ **Advanced Parameters**: Temperature, repetition penalty, top-p, min-p, CFG weight
- 🎵 **Reference Audio**: Upload WAV files for voice conditioning and cloning
- 📊 **Sample Comparison**: Compare generated audio with training samples
- 🎨 **Modern UI**: Beautiful, responsive interface with dark mode

## Tech Stack

**Backend:**
- FastAPI
- PyTorch
- ChatterBox TTS
- torchaudio

**Frontend:**
- React + Vite
- Axios
- Modern CSS with glassmorphism

## Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- pip and npm

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Download models to models/ directory
# Place your fine-tuned ChatterBox models in:
# - models/egyptian/
# - models/emirates/
# - models/ksa/
# - models/kuwaiti/

# Run backend server
python -m uvicorn backend.api.main:app --reload
```

Backend will run on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

1. **Select Dialect**: Choose from Egyptian, Emirati, Saudi, or Kuwaiti
2. **Enter Arabic Text**: Type or paste Arabic text to convert to speech
3. **Advanced Settings** (Optional):
   - Adjust temperature for creativity/conservativeness
   - Set repetition penalty to reduce repetition
   - Fine-tune other generation parameters
4. **Reference Audio** (Optional):
   - Upload a WAV file for voice cloning
   - Model will match voice characteristics of uploaded audio
5. **Generate**: Click "Generate Speech" and download your audio

## API Endpoints

- `GET /` - Health check
- `POST /api/generate` - Generate TTS audio
- `POST /api/compare` - Compare with training samples
- `POST /api/upload-reference` - Upload reference audio
- `GET /api/samples` - Get training samples metadata

## Project Structure

```
ChatterBox REACT/
├── backend/
│   ├── api/
│   │   ├── main.py           # FastAPI application
│   │   └── models.py         # Pydantic models
│   └── services/
│       ├── tts_service.py    # TTS generation logic
│       └── model_loader.py   # Model loading & caching
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TTSGenerator.jsx
│   │   │   ├── SampleComparison.jsx
│   │   │   └── AudioPlayer.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── models/                   # Fine-tuned ChatterBox models (not in repo)
├── training_samples/         # Training audio samples
└── generated_audio/          # Generated audio output
```

## Notes

- Models are **not included** in the repository due to size
- Download fine-tuned models separately
- Reference audio helps reduce hallucinations
- Experiment with generation parameters for optimal results

## License

This project uses ChatterBox TTS models. Please refer to the original ChatterBox license.

---

**Built with ❤️ by GenArabia**

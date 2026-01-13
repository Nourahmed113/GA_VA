import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './TTSGenerator.css'
import AudioPlayer from './AudioPlayer'

const API_BASE = 'http://localhost:8000'

const DIALECTS = [
    { value: 'egyptian', label: 'Egyptian (مصري)', flag: '🇪🇬' },
    { value: 'emirates', label: 'Emirati (إماراتي)', flag: '🇦🇪' },
    { value: 'ksa', label: 'Saudi (سعودي)', flag: '🇸🇦' },
    { value: 'kuwaiti', label: 'Kuwaiti (كويتي)', flag: '🇰🇼' }
]

const DEFAULT_PARAMS = {
    temperature: 0.8,
    repetition_penalty: 2.0,
    top_p: 1.0,
    min_p: 0.05,
    cfg_weight: 0.5
}

function TTSGenerator() {
    const [dialect, setDialect] = useState('emirates')  // Changed to emirates (only model available)
    const [text, setText] = useState('')
    const [audioUrl, setAudioUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [inferenceTime, setInferenceTime] = useState(null)
    const audioRef = useRef(null)

    // Generation parameters
    const [temperature, setTemperature] = useState(DEFAULT_PARAMS.temperature)
    const [repetitionPenalty, setRepetitionPenalty] = useState(DEFAULT_PARAMS.repetition_penalty)
    const [topP, setTopP] = useState(DEFAULT_PARAMS.top_p)
    const [minP, setMinP] = useState(DEFAULT_PARAMS.min_p)
    const [cfgWeight, setCfgWeight] = useState(DEFAULT_PARAMS.cfg_weight)

    // Reference audio state
    const [useReference, setUseReference] = useState(false)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [uploadedFileName, setUploadedFileName] = useState(null)
    const [uploadedFileUrl, setUploadedFileUrl] = useState(null)

    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        // Check if it's a WAV file by extension or MIME type
        const isWav = file.name.toLowerCase().endsWith('.wav') ||
            file.type.includes('wav') ||
            file.type === 'audio/x-wav' ||
            file.type === 'audio/wave'

        if (isWav) {
            try {
                // Upload to backend
                const formData = new FormData()
                formData.append('file', file)

                const response = await axios.post(`${API_BASE}/api/upload-reference`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                setUploadedFile(file)
                setUploadedFileName(response.data.filename)
                const url = URL.createObjectURL(file)
                setUploadedFileUrl(url)
                setError(null)
            } catch (err) {
                setError(`Error uploading file: ${err.message}`)
            }
        } else {
            setError('Please upload a WAV file')
        }
    }

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('Please enter some text')
            return
        }

        setLoading(true)
        setError(null)
        setAudioUrl(null)

        try {
            const response = await axios.post(
                `${API_BASE}/api/generate`,
                {
                    text,
                    dialect,
                    temperature,
                    repetition_penalty: repetitionPenalty,
                    top_p: topP,
                    min_p: minP,
                    cfg_weight: cfgWeight,
                    reference_audio_file: uploadedFileName
                },
                {
                    responseType: 'blob',
                    timeout: 300000 // 5 minutes timeout
                }
            )

            // Extract inference time from response headers
            const inferenceTimeHeader = response.headers['x-inference-time']
            if (inferenceTimeHeader) {
                setInferenceTime(parseFloat(inferenceTimeHeader))
            }

            // Create blob URL for audio
            const audioBlob = new Blob([response.data], { type: 'audio/wav' })
            const url = URL.createObjectURL(audioBlob)
            setAudioUrl(url)
        } catch (err) {
            console.error('Error generating TTS:', err)
            setError(err.response?.data?.detail || 'Failed to generate audio. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!audioUrl) return

        const a = document.createElement('a')
        a.href = audioUrl
        a.download = `genarabia_${dialect}_${Date.now()}.wav`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    const resetToDefaults = () => {
        setTemperature(DEFAULT_PARAMS.temperature)
        setRepetitionPenalty(DEFAULT_PARAMS.repetition_penalty)
        setTopP(DEFAULT_PARAMS.top_p)
        setMinP(DEFAULT_PARAMS.min_p)
        setCfgWeight(DEFAULT_PARAMS.cfg_weight)
    }

    return (
        <div className="tts-generator">
            <div className="generator-card">
                <h2 className="card-title">Generate Speech</h2>

                {/* Dialect Selector */}
                <div className="form-group">
                    <label className="form-label">Select Dialect</label>
                    <div className="dialect-grid">
                        {DIALECTS.map((d) => (
                            <button
                                key={d.value}
                                className={`dialect-btn ${dialect === d.value ? 'active' : ''}`}
                                onClick={() => setDialect(d.value)}
                            >
                                <span className="dialect-flag">{d.flag}</span>
                                <span className="dialect-label">{d.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Text Input */}
                <div className="form-group">
                    <label className="form-label">
                        Arabic Text
                        <span className="char-count">{text.length} characters</span>
                    </label>
                    <textarea
                        className="text-input"
                        placeholder="اكتب النص هنا..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={5}
                        dir="rtl"
                    />
                </div>

                {/* Advanced Settings */}
                <div className="advanced-section">
                    <button
                        className="advanced-toggle"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        <span className="toggle-icon">{showAdvanced ? '▼' : '▶'}</span>
                        Advanced Settings
                    </button>

                    {showAdvanced && (
                        <div className="advanced-panel">
                            <div className="params-header">
                                <h4>Generation Parameters</h4>
                                <button className="reset-btn" onClick={resetToDefaults}>
                                    Reset to Defaults
                                </button>
                            </div>

                            {/* Temperature */}
                            <div className="param-control">
                                <div className="param-header">
                                    <label className="param-label">Temperature</label>
                                    <span className="param-value">{temperature.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.5"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className="param-slider"
                                />
                                <p className="param-desc">Controls randomness. Lower = more conservative, Higher = more creative</p>
                            </div>

                            {/* Repetition Penalty */}
                            <div className="param-control">
                                <div className="param-header">
                                    <label className="param-label">Repetition Penalty</label>
                                    <span className="param-value">{repetitionPenalty.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1.0"
                                    max="3.0"
                                    step="0.1"
                                    value={repetitionPenalty}
                                    onChange={(e) => setRepetitionPenalty(parseFloat(e.target.value))}
                                    className="param-slider"
                                />
                                <p className="param-desc">Prevents repetition and hallucinations. Higher = less repetition</p>
                            </div>

                            {/* Top P */}
                            <div className="param-control">
                                <div className="param-header">
                                    <label className="param-label">Top P (Nucleus Sampling)</label>
                                    <span className="param-value">{topP.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={topP}
                                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                                    className="param-slider"
                                />
                                <p className="param-desc">Cumulative probability threshold. Lower = more focused output</p>
                            </div>

                            {/* Min P */}
                            <div className="param-control">
                                <div className="param-header">
                                    <label className="param-label">Min P</label>
                                    <span className="param-value">{minP.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.0"
                                    max="0.2"
                                    step="0.01"
                                    value={minP}
                                    onChange={(e) => setMinP(parseFloat(e.target.value))}
                                    className="param-slider"
                                />
                                <p className="param-desc">Minimum probability threshold for token selection</p>
                            </div>

                            {/* CFG Weight */}
                            <div className="param-control">
                                <div className="param-header">
                                    <label className="param-label">CFG Weight</label>
                                    <span className="param-value">{cfgWeight.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.0"
                                    max="1.0"
                                    step="0.1"
                                    value={cfgWeight}
                                    onChange={(e) => setCfgWeight(parseFloat(e.target.value))}
                                    className="param-slider"
                                />
                                <p className="param-desc">Classifier-free guidance weight for style control</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reference Audio Section */}
                <div className="reference-section">
                    <button
                        className="reference-toggle"
                        onClick={() => setUseReference(!useReference)}
                    >
                        <span className="toggle-checkbox">{useReference ? '☑' : '☐'}</span>
                        Use Reference Audio (Voice Conditioning)
                    </button>

                    {useReference && (
                        <div className="reference-panel">
                            <label className="reference-label">Upload Reference Audio (WAV file):</label>
                            <div className="file-upload-zone">
                                <input
                                    type="file"
                                    accept=".wav,audio/wav"
                                    onChange={handleFileUpload}
                                    id="file-upload"
                                    className="file-input"
                                />
                                <label htmlFor="file-upload" className="file-upload-label">
                                    Click to upload WAV file
                                </label>
                            </div>
                            {uploadedFile && (
                                <div className="reference-selected">
                                    <span className="reference-selected-label">Uploaded:</span>
                                    <span className="reference-selected-text">{uploadedFile.name}</span>
                                    {uploadedFileUrl && (
                                        <audio controls src={uploadedFileUrl} className="reference-audio-preview" />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Generate Button */}
                <button
                    className="generate-btn"
                    onClick={handleGenerate}
                    disabled={loading || !text.trim()}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Generating...
                        </>
                    ) : (
                        <>
                            Generate Speech
                        </>
                    )}
                </button>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <span className="error-icon">Error:</span>
                        {error}
                    </div>
                )}

                {/* Audio Player */}
                {audioUrl && !loading && (
                    <div className="audio-section">
                        <div className="section-header">
                            <h3 className="section-title">Generated Audio</h3>
                            {inferenceTime && (
                                <div className="inference-time-badge">
                                    <span className="badge-label">Inference Time:</span>
                                    <span className="badge-value">{inferenceTime.toFixed(2)}s</span>
                                </div>
                            )}
                        </div>
                        <AudioPlayer
                            ref={audioRef}
                            src={audioUrl}
                            onDownload={handleDownload}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default TTSGenerator

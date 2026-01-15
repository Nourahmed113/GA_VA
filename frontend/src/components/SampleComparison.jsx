import { useState, useRef } from 'react'
import axios from 'axios'
import './SampleComparison.css'
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

function SampleComparison() {
    const [dialect, setDialect] = useState('egyptian')
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

    const resetToDefaults = () => {
        setTemperature(DEFAULT_PARAMS.temperature)
        setRepetitionPenalty(DEFAULT_PARAMS.repetition_penalty)
        setTopP(DEFAULT_PARAMS.top_p)
        setMinP(DEFAULT_PARAMS.min_p)
        setCfgWeight(DEFAULT_PARAMS.cfg_weight)
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
                    cfg_weight: cfgWeight
                },
                {
                    responseType: 'blob',
                    timeout: 300000
                }
            )

            // Extract inference time from response headers
            const inferenceTimeHeader = response.headers['x-inference-time']
            if (inferenceTimeHeader) {
                setInferenceTime(parseFloat(inferenceTimeHeader))
            }

            const audioBlob = new Blob([response.data], { type: 'audio/wav' })
            const url = URL.createObjectURL(audioBlob)
            setAudioUrl(url)
        } catch (err) {
            console.error('Error generating audio:', err)
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


    return (
        <div className="sample-comparison">
            <div className="comparison-card">
                <h2 className="card-title">Generate with Training Sample Voice</h2>

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
                <>
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
                </>
            </div>
        </div>
    )
}

export default SampleComparison

import { useState, useRef } from 'react'
import axios from 'axios'
import './SampleComparison.css'
import AudioPlayer from './AudioPlayer'
import API_CONFIG from '../config'

const DIALECTS = [
    { value: 'egyptian', label: 'Egyptian (مصري)', flag: '🇪🇬' },
    { value: 'emirates', label: 'Emirati (إماراتي)', flag: '🇦🇪' },
    { value: 'ksa', label: 'Saudi (سعودي)', flag: '🇸🇦' },
    { value: 'kuwaiti', label: 'Kuwaiti (كويتي)', flag: '🇰🇼' }
]

// Hardcoded generation parameters (not shown in UI)
const GENERATION_PARAMS = {
    temperature: 0.8,
    repetition_penalty: 2.0,
    top_p: 1.0,
    min_p: 0.05,
    cfg_weight: 0.5
}

// API endpoint - using Modal backend
const getGenerateEndpoint = () => API_CONFIG.MODAL_ENDPOINTS.GENERATE


function SampleComparison() {
    const [dialect, setDialect] = useState('egyptian')
    const [text, setText] = useState('')
    const [audioUrl, setAudioUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [inferenceTime, setInferenceTime] = useState(null)
    const audioRef = useRef(null)

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('Please enter some text')
            return
        }

        setLoading(true)
        setError(null)
        setAudioUrl(null)
        setInferenceTime(null)

        try {
            const response = await axios.post(
                getGenerateEndpoint(),
                {
                    text,
                    dialect,
                    ...GENERATION_PARAMS
                },
                {
                    responseType: 'blob',
                    timeout: 120000
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
                <h2 className="card-title">Compare Dialects</h2>

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

export default SampleComparison

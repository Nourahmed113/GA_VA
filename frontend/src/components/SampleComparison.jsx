import { useState, useEffect } from 'react'
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
    const [samples, setSamples] = useState({})
    const [selectedSample, setSelectedSample] = useState(null)
    const [originalAudioUrl, setOriginalAudioUrl] = useState(null)
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Generation parameters
    const [temperature, setTemperature] = useState(DEFAULT_PARAMS.temperature)
    const [repetitionPenalty, setRepetitionPenalty] = useState(DEFAULT_PARAMS.repetition_penalty)
    const [topP, setTopP] = useState(DEFAULT_PARAMS.top_p)
    const [minP, setMinP] = useState(DEFAULT_PARAMS.min_p)
    const [cfgWeight, setCfgWeight] = useState(DEFAULT_PARAMS.cfg_weight)

    // Reference audio - default to true for comparison
    const [useReference, setUseReference] = useState(true)

    // Load samples on mount
    useEffect(() => {
        fetchSamples()
    }, [])

    // Reset selection when dialect changes
    useEffect(() => {
        setSelectedSample(null)
        setOriginalAudioUrl(null)
        setGeneratedAudioUrl(null)
    }, [dialect])

    const fetchSamples = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/samples`)
            setSamples(response.data)
        } catch (err) {
            console.error('Error fetching samples:', err)
            setError('Failed to load samples')
        }
    }

    const handleSampleSelect = async (sample) => {
        setSelectedSample(sample)
        setGeneratedAudioUrl(null)

        // Load original audio
        try {
            const response = await axios.get(
                `${API_BASE}/api/samples/${dialect}/${sample.id}`,
                { responseType: 'blob' }
            )
            const audioBlob = new Blob([response.data], { type: 'audio/wav' })
            const url = URL.createObjectURL(audioBlob)
            setOriginalAudioUrl(url)
        } catch (err) {
            console.error('Error loading original audio:', err)
            setError('Failed to load original audio')
        }
    }

    const resetToDefaults = () => {
        setTemperature(DEFAULT_PARAMS.temperature)
        setRepetitionPenalty(DEFAULT_PARAMS.repetition_penalty)
        setTopP(DEFAULT_PARAMS.top_p)
        setMinP(DEFAULT_PARAMS.min_p)
        setCfgWeight(DEFAULT_PARAMS.cfg_weight)
    }

    const handleGenerateComparison = async () => {
        if (!selectedSample) return

        setLoading(true)
        setError(null)

        try {
            const response = await axios.post(
                `${API_BASE}/api/compare`,
                {
                    dialect,
                    sample_id: selectedSample.id,
                    temperature,
                    repetition_penalty: repetitionPenalty,
                    top_p: topP,
                    min_p: minP,
                    cfg_weight: cfgWeight,
                    use_sample_as_reference: useReference
                },
                { responseType: 'blob', timeout: 30000 }
            )

            const audioBlob = new Blob([response.data], { type: 'audio/wav' })
            const url = URL.createObjectURL(audioBlob)
            setGeneratedAudioUrl(url)
        } catch (err) {
            console.error('Error generating comparison:', err)
            setError('Failed to generate comparison audio')
        } finally {
            setLoading(false)
        }
    }

    const currentDialectSamples = samples[dialect] || []

    return (
        <div className="sample-comparison">
            <div className="comparison-card">
                <h2 className="card-title">Compare Training Samples</h2>

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

                {/* Sample Selector */}
                <div className="form-group">
                    <label className="form-label">Select Training Sample</label>
                    <div className="sample-list">
                        {currentDialectSamples.map((sample) => (
                            <button
                                key={sample.id}
                                className={`sample-btn ${selectedSample?.id === sample.id ? 'active' : ''}`}
                                onClick={() => handleSampleSelect(sample)}
                            >
                                <div className="sample-info">
                                    <span className="sample-text" dir="rtl">{sample.text}</span>
                                    <span className="sample-desc">{sample.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Sample Display */}
                {selectedSample && (
                    <>
                        <div className="selected-sample-info">
                            <h3 className="section-title">Selected Sample</h3>
                            <p className="sample-text-large" dir="rtl">{selectedSample.text}</p>
                            <p className="sample-desc">{selectedSample.description}</p>
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

                        {/* Reference Audio Option */}
                        <div className="reference-section">
                            <button
                                className="reference-toggle"
                                onClick={() => setUseReference(!useReference)}
                            >
                                <span className="toggle-checkbox">{useReference ? '☑' : '☐'}</span>
                                Use selected sample as voice reference
                            </button>
                            <p className="reference-hint">
                                When enabled, the model will try to match the voice characteristics of the selected sample
                            </p>
                        </div>

                        {/* Generate Comparison Button */}
                        <button
                            className="generate-btn"
                            onClick={handleGenerateComparison}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">🔄</span>
                                    Generate TTS for Comparison
                                </>
                            )}
                        </button>

                        {/* Error Message */}
                        {error && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                {error}
                            </div>
                        )}

                        {/* Comparison View */}
                        <div className="comparison-grid">
                            {/* Original Audio */}
                            <div className="audio-section">
                                <h3 className="section-title">
                                    <span className="title-icon">🎵</span>
                                    Original Training Sample
                                </h3>
                                {originalAudioUrl ? (
                                    <AudioPlayer src={originalAudioUrl} />
                                ) : (
                                    <div className="loading-placeholder">Loading...</div>
                                )}
                            </div>

                            {/* Generated Audio */}
                            <div className="audio-section">
                                <h3 className="section-title">
                                    <span className="title-icon">🤖</span>
                                    Generated TTS
                                </h3>
                                {generatedAudioUrl ? (
                                    <AudioPlayer src={generatedAudioUrl} />
                                ) : (
                                    <div className="placeholder">
                                        Click "Generate TTS" to compare
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* No Sample Selected */}
                {!selectedSample && (
                    <div className="empty-state">
                        <span className="empty-icon">🎧</span>
                        <p>Select a training sample to start comparing</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SampleComparison

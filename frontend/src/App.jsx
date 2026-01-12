import { useState } from 'react'
import './App.css'
import TTSGenerator from './components/TTSGenerator'
import SampleComparison from './components/SampleComparison'

function App() {
  const [activeTab, setActiveTab] = useState('generate')

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">
          <span className="icon">🎙️</span>
          ChatterBox TTS
        </h1>
        <p className="app-subtitle">Multi-Dialect Arabic Text-to-Speech</p>
      </header>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <span className="tab-icon">✨</span>
          Generate TTS
        </button>
        <button
          className={`tab ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          <span className="tab-icon">🎵</span>
          Compare Samples
        </button>
      </div>

      {/* Tab Content */}
      <main className="tab-content">
        {activeTab === 'generate' && <TTSGenerator />}
        {activeTab === 'compare' && <SampleComparison />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Powered by ChatterBox • GenArabia AI</p>
      </footer>
    </div>
  )
}

export default App

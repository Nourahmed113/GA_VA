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
        <div className="header-content">
          <img src="/genarabia-logo.png" alt="GenArabia" className="app-logo" />
          <div className="header-text">
            <h1 className="app-title">GenArabia Voice Agent</h1>
            <p className="app-subtitle">Multi-Dialect Arabic Text-to-Speech</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate TTS
        </button>
        <button
          className={`tab ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
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
        <p>Powered by GenArabia AI</p>
      </footer>
    </div>
  )
}

export default App

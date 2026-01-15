import './App.css'
import TTSGenerator from './components/TTSGenerator'

function App() {
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

      {/* Main Content */}
      <main className="tab-content">
        <TTSGenerator />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Powered by GenArabia AI</p>
      </footer>
    </div>
  )
}

export default App

import { forwardRef, useRef, useState, useEffect } from 'react'
import './AudioPlayer.css'

const AudioPlayer = forwardRef(({ src, onDownload }, ref) => {
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleDurationChange = () => setDuration(audio.duration)
        const handleEnded = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('durationchange', handleDurationChange)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('durationchange', handleDurationChange)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const togglePlay = () => {
        const audio = audioRef.current
        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleSeek = (e) => {
        const audio = audioRef.current
        const newTime = parseFloat(e.target.value)
        audio.currentTime = newTime
        setCurrentTime(newTime)
    }

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value)
        audioRef.current.volume = newVolume
        setVolume(newVolume)
    }

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="audio-player">
            <audio ref={audioRef} src={src} />

            <div className="player-controls">
                {/* Play/Pause Button */}
                <button className="play-btn" onClick={togglePlay}>
                    {isPlaying ? (
                        <span className="icon">⏸️</span>
                    ) : (
                        <span className="icon">▶️</span>
                    )}
                </button>

                {/* Progress Bar */}
                <div className="progress-section">
                    <span className="time">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        className="progress-bar"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                    />
                    <span className="time">{formatTime(duration)}</span>
                </div>

                {/* Volume Control */}
                <div className="volume-section">
                    <span className="icon">🔊</span>
                    <input
                        type="range"
                        className="volume-bar"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                    />
                </div>

                {/* Download Button */}
                {onDownload && (
                    <button className="download-btn" onClick={onDownload} title="Download">
                        <span className="icon">⬇️</span>
                    </button>
                )}
            </div>
        </div>
    )
})

AudioPlayer.displayName = 'AudioPlayer'

export default AudioPlayer

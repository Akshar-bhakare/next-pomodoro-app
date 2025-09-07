'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Settings, Play, Pause, Square } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function PomodoroTimer({ onComplete, onQuit, onRefresh, user }) {
  const [focusTime, setFocusTime] = useState(25)
  const [breakTime, setBreakTime] = useState(5)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedFocusTime = localStorage.getItem('pomodoro-focus-time')
    const savedBreakTime = localStorage.getItem('pomodoro-break-time')
    
    if (savedFocusTime) {
      const focus = parseInt(savedFocusTime)
      setFocusTime(focus)
      setTimeLeft(focus * 60)
    }
    if (savedBreakTime) {
      setBreakTime(parseInt(savedBreakTime))
    }
  }, [])

  const [timeLeft, setTimeLeft] = useState(focusTime * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showControls, setShowControls] = useState(true)
  
  const hideTimeoutRef = useRef(null)
  const intervalRef = useRef(null)
  const sessionSavedRef = useRef(false)

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = setTimeout(() => {
        if (isRunning) setShowControls(false)
      }, 3000)
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(hideTimeoutRef.current)
    }
  }, [isRunning])

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const saveSession = async () => {
    try {
      console.log('Attempting to save session...')
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: focusTime,
          type: 'focus',
          completed: true
        })
      })
      if (response.ok) {
        console.log('Session saved successfully')
        onRefresh() // Refresh sessions immediately after saving
      } else {
        const errorData = await response.json()
        console.error('Failed to save session:', response.status, errorData)
      }
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  const handleTimerComplete = async () => {
    // Prevent double execution
    if (sessionSavedRef.current) return
    
    // Play beep sound for 3 seconds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    const playBeep = (startTime, duration = 0.3) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, startTime)
      gainNode.gain.setValueAtTime(0.3, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    }
    
    // Play beeps every 0.5 seconds for 3 seconds
    for (let i = 0; i < 6; i++) {
      playBeep(audioContext.currentTime + (i * 0.5))
    }
    
    // Confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
    
    setShowCompletion(true)
    
    // Save session to database only once
    if (!isBreak) {
      sessionSavedRef.current = true
      await saveSession()
    }
  }

  const startTimer = () => {
    setIsRunning(true)
    setShowCompletion(false)
    sessionSavedRef.current = false
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(isBreak ? breakTime * 60 : focusTime * 60)
    setShowCompletion(false)
    sessionSavedRef.current = false
  }

  const handleSettingsChange = (newFocusTime, newBreakTime) => {
    setFocusTime(newFocusTime)
    setBreakTime(newBreakTime)
    
    // Save to localStorage
    localStorage.setItem('pomodoro-focus-time', newFocusTime.toString())
    localStorage.setItem('pomodoro-break-time', newBreakTime.toString())
    
    if (!isRunning) {
      setTimeLeft(isBreak ? newBreakTime * 60 : newFocusTime * 60)
    }
    setShowSettings(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = isBreak 
    ? ((breakTime * 60 - timeLeft) / (breakTime * 60)) * 100
    : ((focusTime * 60 - timeLeft) / (focusTime * 60)) * 100

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      {/* Header */}
      <div className={`absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-lg sm:text-2xl font-light text-gray-400 tracking-wide">
          {isBreak ? 'Break Time' : 'Focus'}
        </h1>
      </div>

      {/* Close button */}
      <button
        onClick={onQuit}
        className={`absolute top-4 sm:top-8 left-4 sm:left-8 p-2 text-gray-400 hover:text-white transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <X size={20} className="sm:w-6 sm:h-6" />
      </button>

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(true)}
        className={`absolute top-4 sm:top-8 right-4 sm:right-8 p-2 text-gray-400 hover:text-white transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <Settings size={20} className="sm:w-6 sm:h-6" />
      </button>

      {/* Main Timer */}
      <div className="relative z-10 text-center">
        <div className="relative">
          {/* Progress Ring */}
          <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 320 320">
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 140}`}
              strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl font-mono font-bold text-white tracking-wider">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`absolute bottom-12 sm:bottom-20 flex space-x-4 sm:space-x-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 sm:p-4 text-white hover:bg-white/20 transition-all duration-200"
          >
            <Play size={24} fill="white" className="sm:w-8 sm:h-8" />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 sm:p-4 text-white hover:bg-white/20 transition-all duration-200"
          >
            <Pause size={24} fill="white" className="sm:w-8 sm:h-8" />
          </button>
        )}
        
        <button
          onClick={resetTimer}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 sm:p-4 text-white hover:bg-white/20 transition-all duration-200"
        >
          <Square size={24} className="sm:w-8 sm:h-8" />
        </button>
        
        {isBreak && (
          <button
            onClick={() => {
              setIsBreak(false)
              setTimeLeft(focusTime * 60)
              setIsRunning(false)
            }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 sm:p-4 text-white hover:bg-white/20 transition-all duration-200"
            title="Skip Break"
          >
            <X size={24} className="sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletion && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-4xl sm:text-6xl font-mono font-bold text-white mb-6 tracking-wider">
              {isBreak ? 'Break Complete!' : 'Session Complete!'}
            </h2>
            <p className="text-xl sm:text-2xl font-mono text-gray-400 mb-12">
              {isBreak ? 'Ready for another focus session?' : 'Time for a well-deserved break!'}
            </p>
            
            <div className="space-y-6">
              {!isBreak ? (
                <>
                  <button
                    onClick={() => {
                      setIsBreak(true)
                      setTimeLeft(breakTime * 60)
                      setShowCompletion(false)
                      setIsRunning(true)
                    }}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 font-mono text-xl hover:bg-white/20 transition-all duration-200 block mx-auto mb-4"
                  >
                    Start Break
                  </button>
                  <button
                    onClick={() => {
                      setIsBreak(false)
                      setTimeLeft(focusTime * 60)
                      setShowCompletion(false)
                      sessionSavedRef.current = false
                    }}
                    className="text-gray-500 hover:text-gray-400 font-mono text-lg transition-colors"
                  >
                    Skip Break
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsBreak(false)
                    setTimeLeft(focusTime * 60)
                    setShowCompletion(false)
                  }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 font-mono text-xl hover:bg-white/20 transition-all duration-200"
                >
                  Start New Session
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          focusTime={focusTime}
          breakTime={breakTime}
          onSave={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function SettingsModal({ focusTime, breakTime, onSave, onClose }) {
  const [newFocusTime, setNewFocusTime] = useState(focusTime)
  const [newBreakTime, setNewBreakTime] = useState(breakTime)

  const handleSave = () => {
    onSave(newFocusTime, newBreakTime)
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-50">
      <div className="text-center max-w-md mx-4">
        <h2 className="text-3xl sm:text-4xl font-mono font-bold text-white mb-12 tracking-wider">Settings</h2>
        
        <div className="space-y-12">
          <div>
            <label className="block text-gray-400 font-mono mb-6 text-xl">Focus Duration</label>
            <div className="flex items-center justify-center space-x-6">
              <span className="text-2xl font-mono text-gray-500 w-8">1</span>
              <input
                type="range"
                min="1"
                max="90"
                step="1"
                value={newFocusTime}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  let adjustedValue
                  if (value <= 5) adjustedValue = value
                  else adjustedValue = Math.round(value / 5) * 5
                  setNewFocusTime(adjustedValue)
                }}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer max-w-xs slider-white"
              />
              <span className="text-2xl font-mono text-gray-500 w-8">90</span>
            </div>
            <div className="text-4xl font-mono font-bold text-white mt-4">{newFocusTime} min</div>
          </div>
          
          <div>
            <label className="block text-gray-400 font-mono mb-6 text-xl">Break Duration</label>
            <div className="flex items-center justify-center space-x-6">
              <span className="text-2xl font-mono text-gray-500 w-8">1</span>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={newBreakTime}
                onChange={(e) => setNewBreakTime(parseInt(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer max-w-xs slider-white"
              />
              <span className="text-2xl font-mono text-gray-500 w-8">30</span>
            </div>
            <div className="text-4xl font-mono font-bold text-white mt-4">{newBreakTime} min</div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-6 mt-16">
          <button
            onClick={handleSave}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 font-mono text-xl hover:bg-white/20 transition-all duration-200"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-white/5 border border-white/10 text-gray-400 px-8 py-4 font-mono text-xl hover:bg-white/10 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
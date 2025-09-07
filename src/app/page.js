'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Dashboard from '../components/Dashboard'
import PomodoroTimer from '../components/PomodoroTimer'
import AuthForm from '../components/AuthForm'

export default function Home() {
  const { data: session, status } = useSession()
  const [currentView, setCurrentView] = useState('dashboard')
  const [sessions, setSessions] = useState([])
  const router = useRouter()

  useEffect(() => {
    if (session) {
      fetchSessions()
    }
  }, [session])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const handleStartFocus = () => {
    setCurrentView('timer')
  }

  const handleTimerComplete = () => {
    fetchSessions() // Refresh sessions data
    setCurrentView('dashboard')
  }

  const handleQuitTimer = () => {
    fetchSessions()
    setCurrentView('dashboard')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="relative z-10 text-center">
          <div className="animate-pulse text-2xl font-mono font-bold text-gray-200 mb-4 tracking-wider">Loading...</div>
          <div className="w-16 h-1 bg-white/20 mx-auto">
            <div className="h-full bg-white/60 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthForm />
  }

  return (
    <>
      {currentView === 'dashboard' && (
        <Dashboard
          user={session.user}
          sessions={sessions}
          onStartFocus={handleStartFocus}
        />
      )}
      
      {currentView === 'timer' && (
        <div className="opacity-0 animate-zoom-in">
          <PomodoroTimer
            onComplete={handleTimerComplete}
            onQuit={handleQuitTimer}
            onRefresh={fetchSessions}
            user={session.user}
          />
        </div>
      )}
    </>
  )
}
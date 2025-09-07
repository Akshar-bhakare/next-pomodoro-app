'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Play, User, LogOut } from 'lucide-react'

export default function Dashboard({ user, sessions, onStartFocus }) {
  const [stats, setStats] = useState({
    totalSessions: 0,
    currentStreak: 0,
    maxStreak: 0
  })

  useEffect(() => {
    if (sessions.length > 0) {
      const completedSessions = sessions.filter(s => s.completed)
      
      // Calculate streaks
      const today = new Date()
      const dates = completedSessions.map(s => new Date(s.date).toDateString())
      const uniqueDates = [...new Set(dates)].sort()
      
      let currentStreak = 0
      let maxStreak = 0
      let tempStreak = 0
      
      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const date = new Date(uniqueDates[i])
        const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === currentStreak) {
          currentStreak++
          tempStreak++
        } else {
          break
        }
      }
      
      // Calculate max streak
      tempStreak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1])
        const currDate = new Date(uniqueDates[i])
        const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 1) {
          tempStreak++
          maxStreak = Math.max(maxStreak, tempStreak)
        } else {
          tempStreak = 1
        }
      }
      
      setStats({
        totalSessions: completedSessions.length,
        currentStreak,
        maxStreak: Math.max(maxStreak, tempStreak)
      })
    }
  }, [sessions])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      {/* Header */}
      <div className="relative z-10 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-mono font-bold text-gray-200 tracking-wider">Pomodoro Focus</h1>
              <p className="text-gray-400 font-mono text-sm sm:text-base">Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/5 backdrop-blur-sm border border-white/10 px-3 sm:px-4 py-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 flex items-center justify-center">
                  {user?.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  )}
                </div>
                <div className="text-xs sm:text-sm font-mono hidden sm:block">
                  <p className="text-gray-200">{user?.name}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-all duration-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-mono font-bold text-gray-200 mb-4 sm:mb-6 tracking-wider">Ready to Focus?</h2>
          <p className="text-lg sm:text-xl md:text-2xl font-mono text-gray-400 mb-8 sm:mb-12 px-4">Build better habits with focused work sessions</p>
          
          <button
            onClick={onStartFocus}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 sm:px-8 md:px-12 py-4 sm:py-6 font-mono text-lg sm:text-xl md:text-2xl hover:bg-white/20 transition-all duration-200 flex items-center space-x-3 sm:space-x-4 mx-auto"
          >
            <Play size={24} fill="white" className="sm:w-8 sm:h-8" />
            <span>Start Focus Session</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {user?.email === 'guest@pomodoro.app' ? (
            <div className="col-span-1 sm:col-span-3 bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 transition-all duration-300">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-gray-200 mb-4">Sign in to see total sessions & streaks</div>
                <p className="text-sm sm:text-base font-mono text-gray-400 mb-6">Create an account or sign in with Google to track your progress</p>
                <button
                  onClick={() => signOut()}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 font-mono hover:bg-white/20 transition-all duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold text-gray-200 mb-2">{stats.totalSessions}</div>
                  <div className="text-lg sm:text-xl font-mono text-gray-400">Total Sessions</div>
                  <div className="text-xs sm:text-sm font-mono text-gray-500 mt-2">Sessions completed successfully</div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold text-gray-200 mb-2">{stats.currentStreak}</div>
                  <div className="text-lg sm:text-xl font-mono text-gray-400">Current Streak</div>
                  <div className="text-xs sm:text-sm font-mono text-gray-500 mt-2">Days of consistent focus</div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 transition-all duration-300">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold text-gray-200 mb-2">{stats.maxStreak}</div>
                  <div className="text-lg sm:text-xl font-mono text-gray-400">Best Streak</div>
                  <div className="text-xs sm:text-sm font-mono text-gray-500 mt-2">Your longest streak record</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
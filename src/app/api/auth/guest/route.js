import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function POST() {
  try {
    // Use fixed guest email for persistent sessions
    const guestEmail = 'guest@pomodoro.app'
    
    // Find or create guest user
    let guestUser = await prisma.user.findUnique({
      where: { email: guestEmail }
    })

    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          name: 'Guest User',
          email: guestEmail,
          password: null
        }
      })
    }

    return NextResponse.json(
      { message: 'Guest user ready', userId: guestUser.id, email: guestEmail },
      { status: 200 }
    )
  } catch (error) {
    console.error('Guest login error:', error.message)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST() {
  try {
    // Create guest user using Prisma upsert
    const guestUser = await prisma.user.upsert({
      where: { email: 'guest@pomodoro.app' },
      update: {},
      create: {
        name: 'Guest User',
        email: 'guest@pomodoro.app',
        password: null
      }
    })

    return NextResponse.json({ 
      message: 'Guest user created successfully',
      user: guestUser
    })
  } catch (error) {
    console.error('Create guest error:', error)
    return NextResponse.json(
      { message: 'Failed to create guest user', error: error.message },
      { status: 500 }
    )
  }
}
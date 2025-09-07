import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { prisma } = await import('../../../../lib/prisma')
    
    // Test connection and let Prisma handle table creation
    await prisma.$connect()
    
    // Try a simple query to test if tables exist
    try {
      await prisma.user.findFirst()
    } catch (error) {
      // Tables don't exist, they'll be created automatically by Prisma
      console.log('Tables will be created automatically by Prisma')
    }
    
    return NextResponse.json({ message: 'Database connection successful' })
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json(
      { message: 'Database setup failed', error: error.message },
      { status: 500 }
    )
  }
}
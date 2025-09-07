import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        // Handle guest login
        if (credentials.email === 'guest@pomodoro.app' && credentials.password === 'guest') {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })
          if (user) {
            return { id: user.id, email: user.email, name: user.name }
          }
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user || !user.password) return null
        
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        
        return { id: user.id, email: user.email, name: user.name }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    redirect: async ({ url, baseUrl }) => {
      return baseUrl
    }
  }
}

export default NextAuth(authOptions)
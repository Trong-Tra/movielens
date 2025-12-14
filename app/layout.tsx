import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Movie Recommendation System',
  description: 'Personalized movie recommendations powered by multiple algorithms',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="pt-16">
        <Navbar />
        {children}
      </body>
    </html>
  )
}

import './globals.css'
import type { Metadata } from 'next'

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
      <body>{children}</body>
    </html>
  )
}

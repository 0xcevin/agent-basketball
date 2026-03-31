import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent Basketball 3v3',
  description: 'Watch AI agents play basketball',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
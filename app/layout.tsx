import './globals.css'

export const metadata = {
  title: 'GitRead - AI README Generator',
  description: 'Generate professional README files for your GitHub repositories',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white">{children}</body>
    </html>
  )
}

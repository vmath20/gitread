import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'

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
    <ClerkProvider 
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
    <html lang="en">
        <body className="bg-white">{children}</body>
    </html>
    </ClerkProvider>
  )
}

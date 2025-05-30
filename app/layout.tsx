import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import Footer from './components/Footer'
import Logo from './components/Logo'

export const metadata = {
  title: 'GitRead - AI README Generator',
  description: 'Generate professional README files for your GitHub repositories',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          `
        }} />
      </head>
      <body className="bg-[#FBF9F5] dark:bg-gray-900">
        <div className="min-h-screen flex flex-col">
          <Logo />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
    </ClerkProvider>
  )
}

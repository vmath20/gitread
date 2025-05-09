/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            h1: {
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
            },
            h2: {
              fontSize: '1.75rem',
              fontWeight: '600',
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            h3: {
              fontSize: '1.25rem',
              fontWeight: '600',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            p: {
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
              lineHeight: '1.6',
            },
            a: {
              color: '#7C3AED', // purple-600
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            code: {
              backgroundColor: '#F6F8FA', // GitHub's code background
              color: '#24292F', // GitHub's text color
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
            pre: {
              backgroundColor: '#F6F8FA', // GitHub's code background
              color: '#24292F', // GitHub's text color
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              padding: '0',
              fontWeight: '400',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.5rem',
            },
            'ul > li': {
              marginTop: '0.375rem',
              marginBottom: '0.375rem',
            },
          },
        },
        dark: {
          css: {
            color: '#fff',
            h1: { color: '#fff' },
            h2: { color: '#fff' },
            h3: { color: '#fff' },
            h4: { color: '#fff' },
            p: { color: '#e5e7eb' },
            strong: { color: '#fff' },
            a: { 
              color: '#a78bfa',
              '&:hover': {
                color: '#c4b5fd',
              },
            },
            code: {
              color: '#fff',
              backgroundColor: '#374151',
            },
            pre: {
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
            },
          },
        },
      },
      keyframes: {
        ellipsis: {
          '0%': { content: '.' },
          '33%': { content: '..' },
          '66%': { content: '...' },
          '100%': { content: '...' },
        }
      },
      animation: {
        'ellipsis': 'ellipsis 1.5s steps(4, jump-none) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 
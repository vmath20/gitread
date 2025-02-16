export const EXAMPLE_READMES = {
  'nextjs/next.js': `# Next.js

The React Framework for the Web

![Next.js](https://img.shields.io/github/stars/vercel/next.js?style=social)

## Overview

Next.js is a full-featured React framework for production. It provides a powerful solution for building modern web applications with features like:

- Hybrid Static & Server Rendering
- TypeScript Support
- Smart Bundling
- Route Pre-fetching
- Built-in CSS Support

## Key Features

- **Zero Config**: Automatic compilation and bundling
- **Hybrid Pages**: Pre-render pages at build time (SSG) or request time (SSR)
- **Fast Refresh**: Fast, reliable live-editing experience
- **API Routes**: Built-in API routes to build your API
- **Internationalization**: Built-in i18n support
- **Image Optimization**: Automatic image optimization with \`next/image\`

## Getting Started

\`\`\`bash
npx create-next-app@latest
# or
yarn create next-app
\`\`\`

Follow the prompts to set up your project.

## Documentation

Visit [nextjs.org/docs](https://nextjs.org/docs) to view the full documentation.

## Contributing

Please see our [contributing.md](https://github.com/vercel/next.js/blob/canary/contributing.md) for more details.

## License

MIT License - Copyright (c) 2024 Vercel, Inc.`,

  'vercel/ai': `# Vercel AI SDK

Build AI-powered applications with React and Next.js

![Vercel AI](https://img.shields.io/github/stars/vercel/ai?style=social)

## Overview

The Vercel AI SDK is a collection of tools and utilities to help you build AI-powered user interfaces. It provides streaming abstractions, React hooks, and utilities for building AI applications.

## Key Features

- **Streaming Support**: Built-in support for streaming AI responses
- **React Hooks**: Easy-to-use hooks for AI interactions
- **Framework Agnostic**: Works with any AI model or provider
- **TypeScript Support**: Full TypeScript support out of the box

## Installation

\`\`\`bash
npm install ai
# or
yarn add ai
\`\`\`

## Usage Example

\`\`\`typescript
import { useChat } from 'ai/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something..."
        />
      </form>
    </div>
  )
}
\`\`\`

## Documentation

For full documentation, visit [sdk.vercel.ai/docs](https://sdk.vercel.ai/docs)

## License

MIT License`,

  'shadcn/ui': `# shadcn/ui

Beautifully designed components built with Radix UI and Tailwind CSS.

![shadcn/ui](https://img.shields.io/github/stars/shadcn/ui?style=social)

## Overview

shadcn/ui is a collection of re-usable components that you can copy and paste into your apps. It's not a component library, but rather a collection of components that you can use as a starting point for your own components.

## Key Features

- **Copy & Paste**: Just copy the code you need
- **Tailwind CSS**: Styled with Tailwind CSS
- **Radix UI**: Built on top of Radix UI primitives
- **Customizable**: Fully customizable components
- **Dark Mode**: Built-in dark mode support
- **TypeScript**: Written in TypeScript

## Installation

\`\`\`bash
npx create-next-app@latest my-app --typescript --tailwind --eslint
cd my-app
npx shadcn-ui@latest init
\`\`\`

## Usage

Add a component:

\`\`\`bash
npx shadcn-ui@latest add button
\`\`\`

Use it in your app:

\`\`\`tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <Button>
      Click me
    </Button>
  )
}
\`\`\`

## Documentation

Visit [ui.shadcn.com](https://ui.shadcn.com) for full documentation.

## License

MIT License`,

  'tailwindlabs/tailwindcss': `# Tailwind CSS

A utility-first CSS framework for rapid UI development.

![Tailwind CSS](https://img.shields.io/github/stars/tailwindlabs/tailwindcss?style=social)

## Overview

Tailwind CSS is a highly customizable, low-level CSS framework that gives you all the building blocks you need to build bespoke designs without any annoying opinionated styles you have to fight to override.

## Key Features

- **Utility-First**: Build complex components from a constrained set of primitive utilities
- **Responsive Design**: Built-in responsive modifiers make it easy to build adaptive interfaces
- **Dark Mode**: Simple dark mode implementation
- **Custom Styling**: Easy customization through configuration
- **JIT Engine**: Lightning-fast build times with the JIT compiler

## Installation

\`\`\`bash
npm install -D tailwindcss
npx tailwindcss init
\`\`\`

Configure your template paths in \`tailwind.config.js\`:

\`\`\`javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
\`\`\`

Add Tailwind to your CSS:

\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

## Usage Example

\`\`\`html
<div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4">
  <div class="shrink-0">
    <img class="h-12 w-12" src="/img/logo.svg" alt="Logo">
  </div>
  <div>
    <div class="text-xl font-medium text-black">Tailwind CSS</div>
    <p class="text-slate-500">A utility-first CSS framework</p>
  </div>
</div>
\`\`\`

## Documentation

Visit [tailwindcss.com](https://tailwindcss.com) for full documentation.

## License

MIT License`,

  'prisma/prisma': `# Prisma

Next-generation Node.js and TypeScript ORM

![Prisma](https://img.shields.io/github/stars/prisma/prisma?style=social)

## Overview

Prisma is a next-generation ORM that consists of these tools:
- Prisma Client: Auto-generated and type-safe query builder for Node.js & TypeScript
- Prisma Migrate: Declarative data modeling & migration system
- Prisma Studio: GUI to view and edit data in your database

## Key Features

- **Type Safety**: Full TypeScript support with auto-generated types
- **Auto-completion**: IntelliSense works out of the box
- **Schema-First**: Intuitive data modeling with Prisma Schema
- **Query Builder**: Powerful and intuitive query API
- **Multi-Database**: Support for PostgreSQL, MySQL, SQLite, and more

## Installation

\`\`\`bash
npm install prisma --save-dev
npx prisma init
\`\`\`

## Usage Example

Define your schema in \`schema.prisma\`:

\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  Int
}
\`\`\`

Use Prisma Client in your code:

\`\`\`typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Create a new user
const user = await prisma.user.create({
  data: {
    email: 'alice@prisma.io',
    name: 'Alice',
  },
})

// Get all users
const users = await prisma.user.findMany()
\`\`\`

## Documentation

Visit [prisma.io/docs](https://www.prisma.io/docs) for full documentation.

## License

Apache 2.0 License`
} 
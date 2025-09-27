# Vercel AI SDK UI v5 & Elements Handbook

## 📚 Table of Contents
1. [AI SDK UI Overview](#ai-sdk-ui-overview)
2. [Core Hooks & Components](#core-hooks--components)
3. [AI Elements Library](#ai-elements-library)
4. [Implementation Patterns](#implementation-patterns)
5. [Best Practices](#best-practices)
6. [Quick Start Guide](#quick-start-guide)

---

## 🎯 AI SDK UI Overview

### Purpose
- Build AI-native applications with React/Next.js
- Streaming AI responses with built-in state management
- Multi-modal interactions (text, images, files)
- Real-time UI updates during generation

### Key Features
- **Streaming**: Real-time text/object generation
- **Persistence**: Message history management
- **Tool Integration**: Function calling support
- **Error Handling**: Built-in error states
- **Resumable Streams**: Continue interrupted generations

---

## 🔧 Core Hooks & Components

### Primary Hooks

#### `useChat()`
```tsx
import { useChat } from 'ai/react'

const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  initialMessages: [],
  onError: (error) => console.error(error)
})
```

**Key Properties:**
- `messages`: Array of conversation messages
- `input`: Current input value
- `handleSubmit`: Form submission handler
- `isLoading`: Loading state
- `append()`: Add message programmatically
- `reload()`: Regenerate last response
- `setMessages()`: Update messages array

#### `useCompletion()`
```tsx
import { useCompletion } from 'ai/react'

const { completion, complete, isLoading } = useCompletion({
  api: '/api/completion'
})
```

**Key Properties:**
- `completion`: Generated text
- `complete()`: Start completion
- `isLoading`: Generation state
- `stop()`: Stop generation

#### `useObject()`
```tsx
import { useObject } from 'ai/react'

const { object, submit, isLoading } = useObject({
  api: '/api/object',
  schema: z.object({ name: z.string() })
})
```

**Key Properties:**
- `object`: Parsed object result
- `submit()`: Start generation
- `isLoading`: Generation state

### Advanced Hooks

#### `useAssistant()`
- Stateful assistant conversations
- Thread management
- File attachments support

#### `useActions()`
- Server actions integration
- Form submission handling

---

## 🎨 AI Elements Library

### Installation
```bash
npx ai-elements@latest
```

### Core Components

#### 1. **Actions Component**
```tsx
import { Actions } from '@ai-elements/core'

<Actions>
  <Actions.Retry />
  <Actions.Like />
  <Actions.Dislike />
  <Actions.Copy />
  <Actions.Share />
</Actions>
```

**Use Cases:**
- Message interaction controls
- User feedback collection
- Content management

#### 2. **Branch Component**
```tsx
import { Branch } from '@ai-elements/core'

<Branch>
  <Branch.Option>Response 1</Branch.Option>
  <Branch.Option>Response 2</Branch.Option>
</Branch>
```

**Use Cases:**
- Multiple response variations
- A/B testing AI responses
- Comparative analysis

#### 3. **Code Block Component**
```tsx
import { CodeBlock } from '@ai-elements/core'

<CodeBlock 
  language="typescript"
  code={`console.log('Hello World')`}
  showLineNumbers={true}
  copyable={true}
/>
```

**Features:**
- Syntax highlighting
- Copy functionality
- Line numbers
- Language detection

#### 4. **Conversation Component**
```tsx
import { Conversation } from '@ai-elements/core'

<Conversation>
  <Conversation.Message role="user">Hello</Conversation.Message>
  <Conversation.Message role="assistant">Hi there!</Conversation.Message>
</Conversation>
```

**Features:**
- Multi-turn dialogue
- Role-based styling
- Streaming support

#### 5. **Image Component**
```tsx
import { Image } from '@ai-elements/core'

<Image 
  src="/generated-image.png"
  alt="AI Generated"
  loading="lazy"
/>
```

#### 6. **Additional Components**

- **Inline Citation**: Reference sources
- **Loader**: Loading states with animations
- **Message**: Individual chat messages
- **Prompt Input**: Enhanced input fields
- **Reasoning**: Show AI thinking process
- **Response**: Structured AI responses
- **Sources**: Citation management
- **Suggestion**: Quick action buttons
- **Task**: Progress tracking
- **Tool**: Function call results
- **Web Preview**: URL previews

---

## 🏗️ Implementation Patterns

### 1. **Basic Chat Interface**
```tsx
'use client'
import { useChat } from 'ai/react'
import { Message, PromptInput } from '@ai-elements/core'

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(message => (
          <Message 
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}
      </div>
      
      <PromptInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        loading={isLoading}
        placeholder="Type your message..."
      />
    </div>
  )
}
```

### 2. **Streaming Completion**
```tsx
'use client'
import { useCompletion } from 'ai/react'
import { CodeBlock, Actions } from '@ai-elements/core'

export default function CodeGenerator() {
  const { completion, complete, isLoading } = useCompletion()

  return (
    <div>
      <button onClick={() => complete('Generate a React component')}>
        Generate Code
      </button>
      
      {completion && (
        <>
          <CodeBlock code={completion} language="tsx" />
          <Actions>
            <Actions.Copy content={completion} />
            <Actions.Retry onRetry={() => complete('Generate a React component')} />
          </Actions>
        </>
      )}
    </div>
  )
}
```

### 3. **Object Generation with Schema**
```tsx
'use client'
import { useObject } from 'ai/react'
import { z } from 'zod'

const recipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string())
})

export default function RecipeGenerator() {
  const { object, submit, isLoading } = useObject({
    api: '/api/recipe',
    schema: recipeSchema
  })

  return (
    <div>
      <button onClick={() => submit('Generate a pasta recipe')}>
        Generate Recipe
      </button>
      
      {object && (
        <div>
          <h3>{object.name}</h3>
          <ul>
            {object.ingredients?.map(ingredient => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

---

## 🎯 Best Practices

### Performance
- Use `useMemo` for expensive computations
- Implement virtual scrolling for long conversations
- Debounce input changes
- Lazy load components

### State Management
- Centralize conversation state
- Use context for cross-component sharing
- Implement proper error boundaries
- Handle network failures gracefully

### User Experience
- Show loading states during generation
- Provide cancel/stop functionality
- Auto-save draft messages
- Implement retry mechanisms

### Security
- Validate all inputs
- Sanitize generated content
- Implement rate limiting
- Use proper authentication

---

## 🚀 Quick Start Guide

### 1. **Installation**
```bash
npm install ai @ai-elements/core
npx ai-elements@latest
```

### 2. **API Route Setup** (Next.js App Router)
```tsx
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4'),
    messages
  })

  return result.toAIStreamResponse()
}
```

### 3. **Basic Implementation**
```tsx
// app/chat/page.tsx
'use client'
import { useChat } from 'ai/react'
import { Conversation, PromptInput, Actions } from '@ai-elements/core'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  return (
    <div className="h-screen flex flex-col">
      <Conversation className="flex-1 overflow-auto">
        {messages.map(message => (
          <Conversation.Message 
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}
      </Conversation>
      
      <div className="p-4">
        <PromptInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={isLoading}
        />
      </div>
    </div>
  )
}
```

---

## 💡 Design Recommendations

### Component Architecture
- **Modular**: Break UI into small, reusable components
- **Composable**: Allow flexible component combinations
- **Accessible**: Follow WCAG guidelines
- **Responsive**: Mobile-first design approach

### Styling Strategy
- Use Tailwind CSS for rapid development
- Implement dark/light mode support
- Create consistent design tokens
- Use CSS modules for component isolation

### State Management
- Keep AI state separate from UI state
- Use React Query for server state
- Implement optimistic updates
- Handle offline scenarios

### Error Handling
- Show user-friendly error messages
- Implement retry mechanisms
- Log errors for debugging
- Graceful degradation

---

## 🎨 UI/UX Suggestions

### Chat Interface
- **Typing indicators** during generation
- **Message status** (sent, delivered, error)
- **Auto-scroll** to latest message
- **Message timestamps**
- **Avatar/role indicators**

### Code Generation
- **Syntax highlighting**
- **Copy to clipboard**
- **Download as file**
- **Side-by-side comparison**
- **Execution playground**

### Image Generation
- **Progressive loading**
- **Zoom/preview functionality**
- **Download options**
- **Generation parameters display**

### General Enhancements
- **Keyboard shortcuts**
- **Voice input support**
- **Export conversations**
- **Search/filter functionality**
- **Customizable themes**

---

*This handbook serves as a comprehensive reference for implementing AI SDK UI v5 and Elements in our application development.*
# Content Event Structure - Proper Implementation ✅

## Overview

Now properly implemented! The `content` field is:
- **String** during streaming (accumulated text)
- **Array of ContentEvent objects** when complete (from backend)

---

## 📋 Type Definitions

### ContentEvent Types

Based on `BACKEND_SSE_REQUIREMENTS.md`, we have:

```typescript
// 1. Reasoning Event
export type ReasoningEvent = {
    event: 'reasoning';
    data: {
        delta?: string;
        complete: boolean;
        duration?: number;
    };
}

// 2. Task Event
export type TaskEvent = {
    event: 'task';
    data: {
        action: 'create' | 'update' | 'complete';
        task: {
            id: string;
            title: string;
            status: 'pending' | 'running' | 'completed' | 'error';
            description?: string;
            files?: string[];
        };
    };
}

// 3. Tool Call Event
export type ToolCallEvent = {
    event: 'tool_call';
    data: {
        id: string;
        name?: string;
        state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
        input?: any;
        output?: {
            html?: string;
            css?: string;
            js?: string;
            title?: string;
        };
        errorText?: string;
    };
}

// 4. Delta Event
export type DeltaEvent = {
    event: 'delta';
    data: {
        delta: string;
        type?: 'text' | 'code';
        language?: string;
    };
}

// 5. Metadata Event
export type MetadataEvent = {
    event: 'metadata';
    data: {
        model?: string;
        tokens?: number;
        cost?: number;
        sources?: string[];
    };
}

// Union type for all events
export type ContentEvent = 
    | ReasoningEvent 
    | TaskEvent 
    | ToolCallEvent 
    | DeltaEvent 
    | MetadataEvent;
```

### Chat Type

```typescript
export type ChatType = {
    id: string;
    role: string;
    content: string | ContentEvent[];  // String OR array of events
}
```

---

## 🔄 How It Works

### During Streaming (Frontend)

```typescript
// Frontend accumulates delta events into string
assistantMessage.content = "Hello world..."  // string
```

### When Complete (Backend)

Backend buffers all events into array:

```typescript
assistantMessage.content = [
    {
        event: 'reasoning',
        data: { delta: 'Analyzing user query...', complete: false }
    },
    {
        event: 'reasoning',
        data: { delta: '', complete: true, duration: 1.5 }
    },
    {
        event: 'task',
        data: { 
            action: 'create',
            task: { id: 't1', title: 'Loading data', status: 'running' }
        }
    },
    {
        event: 'task',
        data: { 
            action: 'complete',
            task: { id: 't1', status: 'completed' }
        }
    },
    {
        event: 'tool_call',
        data: {
            id: 'tool-1',
            name: 'generate_preview',
            state: 'output-available',
            output: { html: '...', css: '...', js: '...', title: '...' }
        }
    },
    {
        event: 'delta',
        data: { delta: 'Hello world...' }
    }
]  // ContentEvent[]
```

---

## 🎯 Frontend Processing

### ChatMessageItem Component

The component detects content type and processes accordingly:

```typescript
if (typeof assistantMsg.content === 'string') {
    // STREAMING
    content = assistantMsg.content;
    isStreaming = true;
    
} else if (Array.isArray(assistantMsg.content)) {
    // COMPLETE - Process events
    const events = assistantMsg.content as ContentEvent[];
    
    // Extract reasoning
    reasoning = events
        .filter(e => e.event === 'reasoning' && e.data.delta)
        .map(e => e.data.delta)
        .join('');
    
    // Extract tasks (keeping latest state)
    const taskList = [];
    events.forEach(event => {
        if (event.event === 'task') {
            const existingIndex = taskList.findIndex(t => t.id === event.data.task.id);
            if (existingIndex >= 0) {
                taskList[existingIndex] = event.data.task;
            } else {
                taskList.push(event.data.task);
            }
        }
    });
    
    // Extract tool calls (keeping latest state)
    const toolCallList = [];
    events.forEach(event => {
        if (event.event === 'tool_call') {
            const existingIndex = toolCallList.findIndex(t => t.id === event.data.id);
            if (existingIndex >= 0) {
                toolCallList[existingIndex] = { ...toolCallList[existingIndex], ...event.data };
            } else {
                toolCallList.push(event.data);
            }
        }
    });
    
    // Extract text
    content = events
        .filter(e => e.event === 'delta')
        .map(e => e.data.delta)
        .join('');
}
```

---

## 📊 Example Flow

### 1. User Sends Message

```typescript
{
    id: "user-123",
    role: "user",
    content: "Generate a sales dashboard"
}
```

### 2. During Streaming

```typescript
{
    id: "assist-123",
    role: "assistant",
    content: "I'll create a sales dashboard for you..."  // string
}
```

### 3. When Complete (Backend Saves)

```typescript
{
    id: "assist-123",
    role: "assistant",
    content: [
        {
            event: 'reasoning',
            data: { delta: 'User wants a sales dashboard. ', complete: false }
        },
        {
            event: 'reasoning',
            data: { delta: 'I need to analyze their data first.', complete: false }
        },
        {
            event: 'reasoning',
            data: { delta: '', complete: true, duration: 1.2 }
        },
        {
            event: 'task',
            data: { 
                action: 'create',
                task: { id: 't1', title: 'Loading data', status: 'pending', files: ['sales.xlsx'] }
            }
        },
        {
            event: 'task',
            data: { 
                action: 'update',
                task: { id: 't1', status: 'running' }
            }
        },
        {
            event: 'task',
            data: { 
                action: 'complete',
                task: { id: 't1', status: 'completed' }
            }
        },
        {
            event: 'tool_call',
            data: {
                id: 'tool-1',
                name: 'generate_preview',
                state: 'input-streaming'
            }
        },
        {
            event: 'tool_call',
            data: {
                id: 'tool-1',
                state: 'input-available',
                input: { type: 'dashboard', data_source: 'sales.xlsx' }
            }
        },
        {
            event: 'tool_call',
            data: {
                id: 'tool-1',
                state: 'output-available',
                output: {
                    html: '<div>Dashboard HTML</div>',
                    css: 'body { margin: 0; }',
                    js: 'console.log("Ready");',
                    title: 'Sales Dashboard'
                }
            }
        },
        {
            event: 'delta',
            data: { delta: "I've created a sales dashboard for you. " }
        },
        {
            event: 'delta',
            data: { delta: "Here are the key insights..." }
        },
        {
            event: 'metadata',
            data: { model: 'gpt-4', tokens: 1250, cost: 0.0375 }
        }
    ]  // ContentEvent[]
}
```

### 4. Frontend Displays

From the event array, frontend extracts:
- **Reasoning**: "User wants a sales dashboard. I need to analyze their data first."
- **Duration**: 1.2 seconds
- **Tasks**: [{ id: 't1', title: 'Loading data', status: 'completed', files: ['sales.xlsx'] }]
- **Tool Calls**: [{ id: 'tool-1', name: 'generate_preview', state: 'output-available', output: {...} }]
- **Text Content**: "I've created a sales dashboard for you. Here are the key insights..."
- **Metadata**: { model: 'gpt-4', tokens: 1250, cost: 0.0375 }

---

## 🔧 Backend Implementation Guide

### For Chat History API

When returning previous messages, backend should:

```python
def get_chat_history(session_id: str):
    messages = []
    
    for db_message in database.get_messages(session_id):
        if db_message.role == 'user':
            messages.append({
                "id": db_message.id,
                "role": "user",
                "content": db_message.content  # string
            })
        else:  # assistant
            # Buffer all events into array
            content_events = []
            
            # Add reasoning events
            if db_message.reasoning:
                content_events.append({
                    "event": "reasoning",
                    "data": {
                        "delta": db_message.reasoning,
                        "complete": True,
                        "duration": db_message.reasoning_duration
                    }
                })
            
            # Add task events
            for task in db_message.tasks:
                content_events.append({
                    "event": "task",
                    "data": {
                        "action": "complete",
                        "task": task
                    }
                })
            
            # Add tool call events
            for tool_call in db_message.tool_calls:
                content_events.append({
                    "event": "tool_call",
                    "data": tool_call
                })
            
            # Add text delta events
            content_events.append({
                "event": "delta",
                "data": {
                    "delta": db_message.text
                }
            })
            
            # Add metadata if exists
            if db_message.metadata:
                content_events.append({
                    "event": "metadata",
                    "data": db_message.metadata
                })
            
            messages.append({
                "id": db_message.id,
                "role": "assistant",
                "content": content_events  # ContentEvent[]
            })
    
    return messages
```

### For SSE Streaming

Keep current implementation - frontend accumulates deltas into string.

---

## ✨ Benefits

### 1. **Type Safety**
```typescript
// TypeScript knows exactly what each event contains
events.forEach(event => {
    if (event.event === 'reasoning') {
        // TypeScript knows: event.data has delta, complete, duration
        console.log(event.data.duration);
    }
    if (event.event === 'tool_call') {
        // TypeScript knows: event.data has id, state, input, output
        console.log(event.data.output?.html);
    }
});
```

### 2. **Complete History**
```typescript
// Backend preserves EVERYTHING that happened
// - All reasoning steps
// - All task state changes
// - All tool call transitions
// - All text chunks
// - All metadata
```

### 3. **Easy to Extend**
```typescript
// Add new event type? Just add to union!
export type ContentEvent = 
    | ReasoningEvent 
    | TaskEvent 
    | ToolCallEvent 
    | DeltaEvent 
    | MetadataEvent
    | NewEventType;  // ← Add here
```

### 4. **Frontend Flexibility**
```typescript
// Frontend can choose what to display
// - Show all reasoning steps
// - Show only final tasks
// - Replay tool call progression
// - Whatever you want!
```

---

## 🎯 Summary

✅ **Streaming**: `content = "string"` (simple accumulation)  
✅ **Complete**: `content = ContentEvent[]` (full event history)  
✅ **Type-Safe**: Full TypeScript support for all event types  
✅ **Flexible**: Backend controls what events to include  
✅ **Extensible**: Easy to add new event types  
✅ **Clean**: Frontend extracts what it needs from events  

---

**This is the proper implementation of your smart approach!** 🎉

---

**Date:** October 22, 2025  
**Version:** 2.1 (Proper Event Types)  
**Status:** Complete ✅





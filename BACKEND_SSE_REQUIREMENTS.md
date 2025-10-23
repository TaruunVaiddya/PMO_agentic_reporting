# Backend SSE Requirements - Quick Reference

## 📋 Overview

This document provides **exactly** what the backend needs to implement for the SSE chat streaming to work with the frontend.

---

## 🔌 Endpoint

**URL:** `POST /chat`

**Headers Required:**
```
Content-Type: application/json
Accept: text/event-stream
```

**Request Body:**
```json
{
  "query": "user's question or message",
  "chat_id": "unique-chat-id-from-frontend",
  "session_id": "session-id-or-null",
  "selected_agent": "agent-name-or-null"
}
```

**Response:**
- Content-Type: `text/event-stream`
- Keep connection open
- Stream events as they occur
- Close when done

---

## 📤 Event Types (In Order)

### 1. START (Required)
**When:** Immediately when processing begins  
**Format:**
```
event: start
data: chat-123e4567-e89b-12d3-a456-426614174000

```

### 2. REASONING (Optional but Recommended)
**When:** To show AI's thinking process  
**Format:**
```
event: reasoning
data: {"delta": "text chunk", "complete": false}

event: reasoning
data: {"delta": "more text", "complete": false}

event: reasoning
data: {"delta": "", "complete": true, "duration": 2.5}

```

### 3. TASK (Optional)
**When:** For multi-step operations  
**Format:**
```
event: task
data: {"action": "create", "task": {"id": "t1", "title": "Task name", "status": "pending"}}

event: task
data: {"action": "update", "task": {"id": "t1", "status": "running"}}

event: task
data: {"action": "complete", "task": {"id": "t1", "status": "completed"}}

```

**Task Status:** `pending` | `running` | `completed` | `error`

### 4. TOOL_CALL (For Dashboard/Preview Generation)
**When:** Generating dashboards or using tools  
**Format:**
```
event: tool_call
data: {"id": "tool-1", "name": "generate_preview", "state": "input-streaming"}

event: tool_call
data: {"id": "tool-1", "state": "input-available", "input": {...}}

event: tool_call
data: {"id": "tool-1", "state": "output-available", "output": {"html": "...", "css": "...", "js": "...", "title": "..."}}

```

**Important for Dashboard Preview:**
```json
{
  "id": "unique-tool-id",
  "name": "generate_preview",
  "state": "output-available",
  "output": {
    "html": "<div>Your HTML here</div>",
    "css": "body { margin: 0; }",
    "js": "console.log('Your JS here');",
    "title": "Dashboard Title"
  }
}
```

### 5. DELTA (Required for Response Text)
**When:** Streaming the actual response  
**Format:**
```
event: delta
data: {"delta": "text chunk"}

event: delta
data: {"delta": "more text"}

```

**For Code Blocks:**
```
event: delta
data: {"delta": "```python\n"}

event: delta
data: {"delta": "def hello():\n    print('Hello')\n"}

event: delta
data: {"delta": "```\n"}

```

### 6. END (Required)
**When:** Processing complete  
**Format:**
```
event: end
data: {"chat_id": "chat-123", "status": "completed", "duration": 5.2}

```

### 7. ERROR (On Errors)
**When:** Any error occurs  
**Format:**
```
event: error
data: {"error": "Error message", "code": "ERROR_CODE", "retryable": true}

```

---

## ⚡ Minimal Working Example

```
event: start
data: chat-abc123

event: delta
data: {"delta": "Hello! "}

event: delta
data: {"delta": "How can I help you?"}

event: end
data: {"chat_id": "chat-abc123", "status": "completed", "duration": 1.0}

```

---

## 🎯 Complete Example (With Everything)

```
event: start
data: chat-abc123

event: reasoning
data: {"delta": "Analyzing user request for sales dashboard", "complete": false}

event: reasoning
data: {"delta": "", "complete": true, "duration": 1.5}

event: task
data: {"action": "create", "task": {"id": "t1", "title": "Loading data", "status": "running", "files": ["sales.xlsx"]}}

event: task
data: {"action": "complete", "task": {"id": "t1", "status": "completed"}}

event: task
data: {"action": "create", "task": {"id": "t2", "title": "Generating dashboard", "status": "running"}}

event: tool_call
data: {"id": "tool-1", "name": "generate_preview", "state": "input-streaming"}

event: tool_call
data: {"id": "tool-1", "state": "input-available", "input": {"type": "dashboard", "data_source": "sales.xlsx"}}

event: delta
data: {"delta": "I've analyzed your sales data. "}

event: delta
data: {"delta": "Here are the key findings:\n\n"}

event: delta
data: {"delta": "- Revenue: $125,000\n"}

event: delta
data: {"delta": "- Growth: +15%\n\n"}

event: tool_call
data: {"id": "tool-1", "state": "output-available", "output": {"html": "<div class=\"dashboard\"><h1>Sales Dashboard</h1></div>", "css": "body { margin: 0; }", "js": "console.log('Ready');", "title": "Sales Dashboard"}}

event: task
data: {"action": "complete", "task": {"id": "t2", "status": "completed"}}

event: delta
data: {"delta": "Click the preview to see your dashboard!"}

event: end
data: {"chat_id": "chat-abc123", "status": "completed", "duration": 6.5}

```

---

## 🔧 Technical Requirements

### Event Format
```
event: <event_type>
data: <payload>

```
**IMPORTANT:** Two newlines (`\n\n`) after each event!

### Flush Immediately
Don't buffer events. Send them as soon as they're ready.

### JSON Escaping
Properly escape quotes and special characters in JSON data.

### Connection Management
- Keep connection alive during streaming
- Close connection after `end` or `error` event
- Handle client disconnect gracefully

### Timing (Optional but Recommended)
Add 50-100ms delays between events for natural feel.

---

## 📊 Event Flow Diagrams

### Simple Flow
```
User Message
    ↓
[start] → [delta] → [delta] → [delta] → [end]
```

### With Reasoning
```
User Message
    ↓
[start] → [reasoning] → [delta] → [end]
```

### Complete Flow
```
User Message
    ↓
[start]
    ↓
[reasoning] (thinking)
    ↓
[task create] (start loading)
    ↓
[task complete] (done loading)
    ↓
[task create] (start processing)
    ↓
[tool_call input-streaming] (tool starting)
    ↓
[tool_call input-available] (tool running)
    ↓
[delta] (start response)
    ↓
[tool_call output-available] (tool done)
    ↓
[task complete] (processing done)
    ↓
[delta] (continue response)
    ↓
[end] (all done)
```

---

## 🎨 Dashboard Preview Requirements

When generating a dashboard/chart that should appear in the preview pane:

**Use tool_call with name `generate_preview`:**

```json
{
  "id": "unique-id",
  "name": "generate_preview",  // MUST be this exact name
  "state": "output-available",
  "output": {
    "html": "<div>Your complete HTML</div>",
    "css": "body { margin: 0; padding: 20px; } /* Your CSS */",
    "js": "console.log('Hello'); // Your JavaScript",
    "title": "Dashboard Title"  // Shows in preview header
  }
}
```

**All fields required:**
- `html` - Complete HTML (no <!DOCTYPE> needed)
- `css` - All styles
- `js` - All JavaScript (executed after DOM loads)
- `title` - Displayed in preview header

---

## ❌ Error Handling

### On Processing Error
```
event: error
data: {"error": "Failed to process file", "code": "PROCESSING_ERROR", "retryable": true}

```

### On Tool Error
```
event: tool_call
data: {"id": "tool-1", "state": "output-error", "errorText": "Failed to generate preview"}

```

### Error Codes (Suggested)
- `INVALID_INPUT` - Bad request data
- `FILE_NOT_FOUND` - Referenced file missing
- `PROCESSING_ERROR` - General processing failure
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `TIMEOUT` - Operation took too long

---

## ✅ Testing Checklist

### Basic
- [ ] Can receive POST request
- [ ] Returns SSE headers
- [ ] Sends `start` event
- [ ] Sends `delta` events
- [ ] Sends `end` event
- [ ] Handles errors gracefully

### Advanced
- [ ] Reasoning displays correctly
- [ ] Tasks show progress
- [ ] Tool calls work
- [ ] Dashboard preview appears
- [ ] Code blocks render
- [ ] Markdown formats correctly

### Edge Cases
- [ ] Long messages (10KB+)
- [ ] Special characters
- [ ] Emoji support
- [ ] Connection interruption
- [ ] Malformed data

---

## 🧪 Test with curl

```bash
curl -N \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test message",
    "chat_id": "test-123",
    "session_id": null,
    "selected_agent": null
  }' \
  http://your-api-url/chat
```

Expected output:
```
event: start
data: test-123

event: delta
data: {"delta": "Test response"}

event: end
data: {"chat_id": "test-123", "status": "completed", "duration": 1.0}
```

---

## 📝 Quick Reference Card

| Event | Required | Purpose | Example |
|-------|----------|---------|---------|
| `start` | ✅ Yes | Initialize chat | `data: chat-123` |
| `reasoning` | ⭐ Optional | Show AI thinking | `data: {"delta": "...", "complete": false}` |
| `task` | ⭐ Optional | Show progress | `data: {"action": "create", "task": {...}}` |
| `tool_call` | ⭐ Optional | Tool execution | `data: {"id": "...", "name": "...", "state": "..."}` |
| `delta` | ✅ Yes | Response text | `data: {"delta": "text"}` |
| `end` | ✅ Yes | Complete | `data: {"chat_id": "...", "status": "completed"}` |
| `error` | 🔴 On error | Error info | `data: {"error": "...", "code": "..."}` |

---

## 🚀 Implementation Priority

### Phase 1 - MVP (Must Have)
1. ✅ `start` event
2. ✅ `delta` events (text streaming)
3. ✅ `end` event
4. ✅ `error` event

### Phase 2 - Enhanced (Should Have)
5. ⭐ `reasoning` events
6. ⭐ Basic `task` events

### Phase 3 - Advanced (Nice to Have)
7. ⭐ `tool_call` for dashboards
8. ⭐ Complex multi-tool flows

---

## 💡 Tips for Backend Developers

1. **Start Simple:** Get basic text streaming working first (start → delta → end)

2. **Test Early:** Use curl or Postman to test SSE output

3. **Flush Events:** Most frameworks buffer output. Force flush after each event:
   - Python: `sys.stdout.flush()`
   - Node.js: `res.flush()`
   - Go: `w.(http.Flusher).Flush()`

4. **Handle Disconnect:** Client may close connection. Handle gracefully.

5. **Logging:** Log all events for debugging

6. **Timing:** Natural delays (50-200ms) make UX better

7. **Error Recovery:** Always send `end` or `error` to close stream

---

## 📞 Questions?

If you need clarification on:
- Event structure
- Data formats
- Tool outputs
- Error handling
- Specific use cases

Please refer to:
- `SSE_INTEGRATION_SPEC.md` - Complete specification
- `SSE_EVENT_EXAMPLES.md` - Copy/paste examples
- `INTEGRATION_ANALYSIS.md` - Frontend integration details

---

## 🎯 Success Criteria

Backend SSE implementation is complete when:

✅ Text streams smoothly in real-time  
✅ Reasoning shows AI's thought process  
✅ Tasks display progress updates  
✅ Dashboards appear in preview pane  
✅ Code blocks syntax highlight correctly  
✅ Errors display user-friendly messages  
✅ Connection handles interruptions  
✅ All events follow the specification  

---

**Last Updated:** 2025-10-22  
**Frontend Version:** See `package.json`  
**Contact:** Frontend team for integration questions


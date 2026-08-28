# ContextFlow — Project Plan

## 1. Project Vision

ContextFlow is a mobile-first, voice-first AI assistant designed for Android smartphones. It is inspired by the convenience of AI dictation tools such as Wispr Flow, but its core novelty is **context-aware voice interaction**.

The user should be able to speak naturally instead of learning rigid commands. ContextFlow combines:

- Voice input
- Speech-to-text
- Current app/context
- Clipboard or selected text where available
- User intent
- AI reasoning
- Mobile actions
- On-device AI where possible
- Cloud AI when necessary

The product goal is:

> **Voice → Understand → Context → Decide → Act**

It should feel less like a dictation keyboard and more like a voice layer over the smartphone.

---

## 2. Hackathon Objective

### Primary objective

Build a convincing Android prototype that demonstrates that a user can interact with a smartphone using natural speech while the system understands the user's current context.

### The prototype should prove three things

1. Natural speech can be converted into structured intent.
2. The same sentence can produce different results depending on mobile context.
3. Some AI functionality can work locally or with minimal network dependence.

### Recommended demo scope

Do not attempt to control every Android application.

Build 3 polished demonstrations:

#### Demo A — Context-aware messaging

User is in a messaging context and says:

> "Tell Rahul I'll reach in 15 minutes."

System:

```text
Voice
  ↓
Speech-to-text
  ↓
Intent detection
  ↓
Contact/context resolution
  ↓
Draft message
  ↓
User confirmation
```

#### Demo B — Voice Clipboard

User copies an error or paragraph and says:

> "Explain this and tell me how to fix it."

System uses the clipboard as context and sends only the relevant content to the AI engine.

#### Demo C — Offline/local intelligence

Disable the network and demonstrate a lightweight operation such as:

- punctuation cleanup
- shortening a sentence
- extracting an intent
- creating a local note
- local command recognition

The exact offline capability depends on the selected model/device.

---

## 3. Product Principles

### Principle 1 — Natural language first

The user should not need to memorize:

- "create reminder"
- "send message"
- "search web"

Instead:

> "Remind me tomorrow morning to call Rahul."

The system determines the intent.

### Principle 2 — Context is part of the command

The meaning of a command is:

```text
Meaning = Voice + Context + User State
```

For example:

> "Reply that I'll check it."

has different meaning depending on the active conversation.

### Principle 3 — Confirmation before risky actions

Actions such as sending messages, deleting data, publishing content, or making changes should normally require confirmation.

### Principle 4 — Privacy by design

Do not send unnecessary screen contents or personal data to a cloud model.

Use the smallest relevant context.

### Principle 5 — Local-first where practical

Simple operations should be handled locally where possible.

Complex reasoning can be routed to a cloud LLM.

---

## 4. MVP Scope

### Must have

- Android application
- React Native UI
- Voice capture
- Speech-to-text
- AI intent extraction
- Structured JSON output
- Context abstraction
- Clipboard integration
- At least 3 useful actions
- Confirmation UI
- Local history
- Error handling
- Clear demo flow

### Should have

- On-device/simple intent routing
- Current-app context
- Native Android bridge
- AccessibilityService prototype
- Contact resolution
- Offline fallback
- Streaming transcription/response where practical

### Nice to have

- Custom vocabulary
- Multilingual speech
- Marathi/Hindi/English mixed speech
- Voice editing commands
- Personalized vocabulary
- Smart suggestions
- Hardware-button/earphone trigger
- Lock-screen interaction where platform rules permit

### Avoid in the first version

- Full autonomous control of every app
- Large custom AI model training
- Building a new speech recognition model
- Complex distributed backend
- Huge database architecture
- Supporting dozens of apps
- Unsafe background automation

---

## 5. Development Phases

### Phase 0 — Project setup

Tasks:

- Create React Native Android project.
- Establish Git repository.
- Create environment configuration.
- Create basic navigation.
- Create a clean mobile UI.
- Establish Node.js backend if needed.

Deliverable:

> App launches and has a working microphone screen.

---

### Phase 1 — Voice pipeline

Build:

```text
Microphone
  ↓
Audio
  ↓
Speech-to-text
  ↓
Transcript
```

Do not add complex AI yet.

Deliverable:

> User speaks and sees accurate text.

---

### Phase 2 — Intent engine

Create a strict intent schema.

Example:

```json
{
  "intent": "send_message",
  "entities": {
    "recipient": "Rahul",
    "message": "I'll reach in 15 minutes."
  },
  "requires_confirmation": true
}
```

Supported initial intents:

- send_message
- create_reminder
- search
- rewrite
- summarize
- explain
- translate
- create_note
- unknown

Deliverable:

> Natural speech becomes reliable structured JSON.

---

### Phase 3 — Action engine

Create an action dispatcher.

```text
Intent
  ↓
Validator
  ↓
Permission check
  ↓
Confirmation if required
  ↓
Action adapter
```

Example:

```text
create_reminder
      ↓
ReminderAdapter
      ↓
Android reminder/notification
```

Deliverable:

> Intent produces a real mobile action.

---

### Phase 4 — Context engine

Create a standard context object:

```json
{
  "app": "unknown",
  "screen": "unknown",
  "selectedText": null,
  "clipboardText": null,
  "conversation": null,
  "timestamp": "..."
}
```

Then add supported sources one at a time.

Priority:

1. Clipboard
2. Current app
3. Selected text
4. Accessibility-derived UI context
5. Optional application-specific adapters

Deliverable:

> The AI receives relevant context in a predictable format.

---

### Phase 5 — Native Android integration

Use React Native native modules for capabilities that require Android APIs.

Potential native modules:

- ContextModule
- ClipboardModule
- AccessibilityContextModule
- VoiceModule if needed
- DeviceCapabilityModule

Do not write a huge native layer.

Keep native code small and expose simple APIs to JavaScript.

Example:

```ts
const context = await NativeContext.getContext();
```

---

### Phase 6 — Hybrid AI

Create a router:

```text
User request
    ↓
Complexity classifier
    ↓
 ┌───────────────┬────────────────┐
 ↓               ↓
Local           Cloud
AI              AI
 ↓               ↓
Fast/private    Strong reasoning
 └───────┬───────┘
         ↓
       Intent
```

Local AI candidates should be selected based on actual device support and benchmark results.

---

### Phase 7 — UX polish

Add:

- recording animation
- transcript preview
- context indicator
- action preview
- confirmation
- success/failure states
- offline indicator
- AI processing state
- history
- settings

The demo must be understandable without explaining the architecture.

---

### Phase 8 — Security and reliability

Implement:

- permission checks
- input validation
- action allowlist
- confirmation gates
- sensitive-data filtering
- network failure handling
- timeout handling
- model failure fallback
- logs that do not expose private content

---

### Phase 9 — Hackathon demo

Prepare one scripted flow.

Recommended flow:

```text
1. Open ContextFlow.
2. Demonstrate natural voice.
3. Show context-aware message generation.
4. Copy an error.
5. Ask ContextFlow to explain it.
6. Disable network.
7. Demonstrate a local operation.
8. Explain hybrid architecture.
9. Explain privacy.
```

Do not improvise the critical demo.

---

## 6. Suggested Milestone Order

### Milestone 1

Voice → Text

### Milestone 2

Voice → Intent JSON

### Milestone 3

Intent → Action

### Milestone 4

Clipboard → Context → AI

### Milestone 5

Current-app/context detection

### Milestone 6

Native Android bridge

### Milestone 7

Local AI / offline fallback

### Milestone 8

Polished demo

---

## 7. Success Criteria

The prototype is successful if:

- A user can speak naturally.
- The system produces a useful transcript.
- The LLM reliably returns a valid intent.
- The system can use context.
- At least 3 actions work end-to-end.
- Dangerous actions require confirmation.
- The application behaves sensibly when network/model calls fail.
- The demo can be completed in a few minutes.
- Judges can understand the novelty without reading the source code.

---

## 8. Stretch Features

### Multilingual ContextFlow

Support:

> English + Hindi + Marathi

and code-switching such as:

> "Rahul ko message kar ki main 10 minutes mein aa raha hoon."

### Personal vocabulary

Learn frequently used:

- names
- technical words
- project terms

### Voice editing

> "Make this professional."

> "Shorten this."

> "Translate this into Marathi."

### Smart context suggestions

If the user copies an error, ContextFlow could show:

> "Explain error"

> "Search solution"

> "Create issue"

without the user asking explicitly.

---

## 9. Product Positioning

Do not position the project as:

> "A mobile Wispr Flow clone."

Position it as:

> **A context-aware voice interaction layer for Android that understands what the user is doing and helps them complete actions with natural speech.**

Core differentiator:

```text
Traditional dictation:
Voice → Text

ContextFlow:
Voice + Context → Intent → Action
```

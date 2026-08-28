# ContextFlow — Architecture

## 1. Architecture Goal

The architecture must support:

- React Native development
- Android-native capabilities
- modular AI providers
- hybrid local/cloud inference
- context-aware processing
- safe action execution
- future expansion

The architecture should avoid coupling the UI directly to Android services or LLM providers.

---

## 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      USER           │
                         │  Voice / Touch      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ React Native UI     │
                         │ Expo/Bare RN        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Voice Controller    │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌──────────────────┐            ┌──────────────────┐
          │ Speech-to-Text   │            │ Context Engine   │
          └────────┬─────────┘            └────────┬─────────┘
                   │                               │
                   └──────────────┬────────────────┘
                                  ▼
                         ┌─────────────────────┐
                         │ Intent Router       │
                         └──────────┬──────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
            ┌────────────────┐            ┌────────────────┐
            │ Local AI       │            │ Cloud AI       │
            │ Provider       │            │ Provider       │
            └───────┬────────┘            └───────┬────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                         ┌─────────────────────┐
                         │ Intent Validator    │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Action Planner      │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Confirmation Gate   │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Action Executor     │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Android / App APIs  │
                         └─────────────────────┘
```

---

## 3. React Native Layer

Responsibilities:

- screens
- state management
- transcript rendering
- action preview
- settings
- history
- network state
- AI request orchestration
- user confirmation

React Native should not directly contain low-level Android logic.

---

## 4. Native Android Layer

Use native Android only where required.

Potential modules:

```text
NativeContextModule
NativeClipboardModule
NativeAccessibilityModule
NativeVoiceModule
NativeDeviceCapabilityModule
```

The JS side should expose clean APIs.

Example:

```ts
const context = await ContextBridge.getContext();
```

Instead of spreading Android implementation details throughout the app.

---

## 5. Context Engine

The context engine merges context sources.

```text
Clipboard ─────┐
Current App ───┤
Selected Text ─┤
Screen Text ───┤
Task State ────┤
               ▼
         Context Normalizer
               │
               ▼
         Context Relevance
               │
               ▼
         Minimal Context
```

---

## 6. Context Normalization

Raw Android data should never be sent directly to the LLM.

Normalize first.

Example:

```json
{
  "app": "Messaging",
  "screenType": "conversation",
  "participant": "Rahul",
  "selectedText": null,
  "clipboardText": null
}
```

Then remove irrelevant fields.

---

## 7. Context Relevance Filter

Example request:

> "Make this shorter."

If clipboard text exists:

```text
Voice:
Make this shorter.

Relevant context:
clipboardText

Ignore:
contacts
location
notifications
other apps
```

This reduces:

- token usage
- latency
- privacy exposure
- hallucination risk

---

## 8. AI Router

The router decides whether the request requires local or cloud AI.

Example:

```text
Input
 ↓
Is this a deterministic command?
 ├─ yes → local parser/action
 └─ no
      ↓
Can local model handle it?
 ├─ yes → local model
 └─ no → cloud model
```

Do not route everything to a large model.

---

## 9. LLM Adapter Architecture

Use an interface:

```ts
interface LLMProvider {
  generateIntent(input: IntentInput): Promise<IntentResult>;
}
```

Implement providers:

```text
LocalLLMProvider
CloudLLMProvider
MockLLMProvider
```

This makes testing possible without API calls.

---

## 10. Action Engine

Use an allowlisted action registry.

```ts
const actions = {
  create_note: createNote,
  create_reminder: createReminder,
  rewrite: rewriteText,
  summarize: summarizeText,
  search: searchWeb,
  prepare_message: prepareMessage
};
```

The model should never directly execute arbitrary code.

The model returns a structured intent.

The application decides what that intent is allowed to do.

---

## 11. Confirmation Architecture

```text
LLM intent
   ↓
Risk classifier
   ↓
 ┌──────────────┬──────────────┐
 │              │              │
Low risk     Medium risk     High risk
 │              │              │
Execute      Confirm         Strong confirm/
                             block
```

---

## 12. Backend Architecture

A backend is optional for the MVP.

If cloud AI is used:

```text
React Native
      ↓
Node.js API
      ↓
Provider Adapter
      ↓
LLM API
```

Recommended backend endpoints:

```text
POST /api/intent
POST /api/generate
GET  /api/health
```

Avoid exposing secret API keys in the mobile app.

---

## 13. Backend Request

Example:

```json
{
  "transcript": "Make this professional",
  "context": {
    "clipboardText": "hey send me the file asap"
  }
}
```

Response:

```json
{
  "intent": "rewrite",
  "result": "Please send me the file as soon as possible."
}
```

---

## 14. Data Flow — Message Demo

```text
User:
"Tell Rahul I'll reach in 15 minutes."

        ↓

Speech-to-text

        ↓

Transcript

        ↓

Context Engine
current context = messaging

        ↓

LLM

        ↓

{
  intent: "prepare_message",
  recipient: "Rahul",
  message: "I'll reach in 15 minutes."
}

        ↓

Validator

        ↓

Confirmation UI

        ↓

Android action

        ↓

Success feedback
```

---

## 15. Data Flow — Clipboard Demo

```text
Copy error
   ↓
ClipboardManager
   ↓
Context Engine
   ↓
User:
"Explain this"
   ↓
Relevant context = clipboard
   ↓
LLM
   ↓
Explanation
```

---

## 16. Offline Architecture

```text
                 USER
                   ↓
                STT
                   ↓
             Intent Router
              /          \
             /            \
        Local            Cloud
          │                │
          │          if network available
          │                │
          └───────┬────────┘
                  ↓
             Action Engine
```

The application should not require the cloud for every operation.

---

## 17. Storage

Use local storage for:

- settings
- recent actions
- user vocabulary
- cached intents
- feature flags
- local history

Avoid storing sensitive raw screen contents by default.

Possible choices:

- AsyncStorage for simple data
- SQLite/Room/native storage for structured data

---

## 18. Error Handling

Every external dependency can fail.

### STT failure

Show:

> "I couldn't hear that. Try again."

### LLM failure

Fallback to:

- local intent parser
- simple text operation
- retry

### Network failure

Show offline state and use local functionality.

### Android permission failure

Explain exactly which permission is needed and why.

---

## 19. Security Boundaries

Important rule:

> The LLM is not trusted code.

The LLM can suggest:

```text
intent = send_message
```

but cannot directly execute:

```text
send_message(...)
```

The Action Engine must validate it.

---

## 20. Future Architecture

Eventually:

```text
                  ContextFlow Core
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
   Android            iOS             Desktop
   Adapter            Adapter          Adapter
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                 Shared AI Core
```

React Native can keep most application logic shared while platform adapters handle OS-specific capabilities.

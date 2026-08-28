# ContextFlow — Technology Stack

## 1. Recommended Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile | React Native | Cross-platform UI/application |
| Language | TypeScript | Safer JS development |
| Android native | Java or Kotlin | Android-only APIs |
| UI | React Native + React | Mobile UI |
| Backend | Node.js + Express | Optional cloud gateway |
| STT | Android SpeechRecognizer / Whisper | Speech-to-text |
| LLM | Open model / cloud model | Intent and language reasoning |
| Local AI | Compatible small model/runtime | Offline/simple AI |
| Storage | AsyncStorage / SQLite | Local state/history |
| Android context | Accessibility APIs | Context where permitted |
| Clipboard | Android Clipboard APIs | Voice Clipboard |
| Actions | Android Intents / APIs | Mobile actions |
| Version control | Git + GitHub | Source control |

---

## 2. React Native

Recommended because the project owner already knows JavaScript/Node.js.

Benefits:

- rapid UI development
- reusable components
- large ecosystem
- shared business logic
- easier hackathon iteration

Potential limitation:

- advanced Android capabilities require native modules

---

## 3. TypeScript

Although JavaScript is sufficient, TypeScript is strongly recommended for this project because the system has many structured objects.

Example:

```ts
type IntentType =
  | "rewrite"
  | "summarize"
  | "create_note"
  | "create_reminder"
  | "prepare_message"
  | "send_message"
  | "search"
  | "explain"
  | "translate"
  | "unknown";
```

This reduces errors when connecting AI output to actions.

---

## 4. Android Native

Use native code only for platform-specific capabilities.

Possible native modules:

- AccessibilityContext
- Clipboard
- Device capabilities
- Background/foreground service where appropriate
- Notification integration
- Android intents

Do not rewrite the entire app natively.

---

## 5. Speech-to-Text

### First implementation

Use Android speech recognition or a React Native-compatible speech package.

Goal:

> Get the MVP working quickly.

### Later

Evaluate Whisper or a mobile-compatible Whisper runtime for offline transcription.

Consider:

- model size
- RAM usage
- latency
- battery
- supported languages

Do not choose a large model just because it is more accurate.

---

## 6. LLM Strategy

### Cloud

Use a provider through the backend.

The backend hides API credentials.

### Local

Use a small instruction-following model if the target device can handle it.

Potential model families to evaluate:

- Qwen
- Gemma
- Phi
- other compact instruction models

Do not lock the architecture to a single model.

---

## 7. Structured Output

The LLM should return machine-readable JSON.

Example:

```json
{
  "intent": "create_note",
  "confidence": 0.98,
  "entities": {
    "title": "Hackathon ideas",
    "content": "Build context-aware voice assistant."
  },
  "requiresConfirmation": false
}
```

Validate the output before using it.

---

## 8. Backend

Node.js + Express is enough for the prototype.

Backend responsibilities:

- model gateway
- API-key protection
- request validation
- prompt management
- provider selection
- rate limiting
- logging

The backend should not contain Android-specific logic.

---

## 9. Storage

### AsyncStorage

Use for:

- preferences
- small configuration
- feature flags

### SQLite

Use for:

- history
- actions
- cached metadata
- structured local records

Avoid storing raw sensitive screen data unless explicitly required.

---

## 10. Development Tools

Recommended:

- Android Studio
- VS Code
- Node.js LTS
- Git
- GitHub
- Android Emulator
- physical Android device

A physical Android device is strongly recommended for testing accessibility, microphone, battery, performance and OEM-specific behavior.

---

## 11. Suggested Project Structure

```text
contextflow/
├── android/
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   │   ├── speech/
│   │   ├── ai/
│   │   ├── context/
│   │   └── actions/
│   ├── native/
│   ├── store/
│   ├── types/
│   ├── utils/
│   └── config/
├── assets/
├── tests/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── providers/
│   │   └── middleware/
│   └── package.json
├── package.json
└── README.md
```

---

## 12. Environment Variables

Mobile:

```text
API_BASE_URL=
```

Backend:

```text
LLM_API_KEY=
LLM_PROVIDER=
PORT=
```

Never place private cloud API keys in the mobile source code.

---

## 13. Recommended MVP Technology Decisions

### UI

React Native + TypeScript

### AI orchestration

TypeScript

### Backend

Node.js + Express

### Speech

Android SpeechRecognizer first

### LLM

Cloud model for first working prototype

### Local AI

Add after the cloud pipeline works

### Native context

Start with Clipboard, then add AccessibilityService

This order minimizes risk.

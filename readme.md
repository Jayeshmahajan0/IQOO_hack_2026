# ContextFlow

> **A context-aware voice interaction layer for Android.**

ContextFlow is a mobile-first AI assistant that goes beyond speech-to-text.

Instead of:

```text
Voice → Text
```

ContextFlow aims for:

```text
Voice + Context → Intent → Action
```

---

## 🚀 Why ContextFlow?

Traditional dictation understands what you **say**.

ContextFlow tries to understand what you **mean in the context of what you're doing**.

Example:

> "Make this professional."

If the user just copied an informal message, ContextFlow can use the clipboard as context.

Another example:

> "Tell Rahul I'll reach in 15 minutes."

The system can understand that the user wants to prepare a message rather than simply type those words.

---

## 🎯 Hackathon Goal

The project is designed as an Android prototype for an iQOO-focused mobile hackathon.

The focus is:

- mobile-first interaction
- voice-first UX
- context awareness
- hybrid AI
- privacy
- low interaction overhead

---

## ✨ Core Features

### 1. Voice-first interaction

Speak naturally instead of typing.

### 2. Context awareness

Potential context sources:

- current application
- clipboard
- selected text
- relevant screen information
- current task state

### 3. Intent understanding

Convert natural language into structured actions.

### 4. Voice Clipboard

Copy something and ask the assistant to:

- explain it
- summarize it
- rewrite it
- translate it
- identify errors

### 5. Hybrid AI

Use:

```text
Local AI
+
Cloud AI
```

depending on task complexity and device capability.

### 6. Safe action execution

The LLM does not directly execute arbitrary operations.

It generates an intent which is validated by the application.

---

## 🧠 Example

User says:

> "Make this shorter."

Context:

```text
Clipboard:
"Hey, I just wanted to let you know that..."
```

AI:

```json
{
  "intent": "rewrite",
  "entities": {
    "operation": "shorten",
    "source": "clipboard"
  },
  "requiresConfirmation": false
}
```

Result:

```text
Hey, just wanted to let you know...
```

---

## 🏗️ Architecture

```text
                  USER
                   │
                   ▼
             React Native
                   │
          ┌────────┴────────┐
          ▼                 ▼
       Voice             Context
          │                 │
          ▼                 ▼
        STT          Clipboard/App/etc.
          └────────┬────────┘
                   ▼
             Intent Router
                   │
             ┌─────┴─────┐
             ▼           ▼
          Local        Cloud
            AI           AI
             └─────┬─────┘
                   ▼
             Intent Validator
                   │
                   ▼
             Action Engine
                   │
                   ▼
              Android APIs
```

---

## 🛠️ Technology Stack

### Mobile

- React Native
- TypeScript
- Android APIs
- React Navigation or equivalent

### AI

- Android SpeechRecognizer / Whisper
- Compact open models or cloud LLM
- Structured JSON output

### Backend

- Node.js
- Express
- HTTPS
- Schema validation

### Android Native

- Native Modules
- AccessibilityService where appropriate
- ClipboardManager
- Android Intents
- Notifications

### Storage

- AsyncStorage
- SQLite if structured history is needed

---

## 📂 Repository Structure

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
│   └── utils/
├── backend/
├── assets/
├── tests/
├── plan.md
├── ps.md
├── architecture.md
├── techstack.md
├── resources.md
├── dependency.md
└── README.md
```

---

## 🧪 Recommended MVP

Do not attempt to support every app.

Build these three demonstrations:

### Demo 1

Context-aware message preparation.

### Demo 2

Voice Clipboard.

### Demo 3

Offline/local AI operation.

These three demos provide a strong story without requiring a huge implementation.

---

## 🔐 Security Principles

ContextFlow follows these rules:

1. The LLM is not trusted code.
2. Model output must be validated.
3. Actions are allowlisted.
4. High-impact actions require confirmation.
5. Cloud APIs are accessed through a secure backend where secrets are required.
6. Only relevant context should be sent to AI.
7. Sensitive content should not be stored unnecessarily.

---

## 📱 Why React Native?

React Native allows rapid development of the application UI and most business logic.

Android-specific functionality can be implemented as small native modules.

Conceptually:

```text
React Native
     │
     ▼
Native Module
     │
     ▼
Android API
```

This allows the project to remain mostly JavaScript/TypeScript while still using Android capabilities that are not directly exposed through React Native.

---

## 🧭 Development Order

```text
1. React Native setup
2. Microphone UI
3. Speech-to-text
4. Intent extraction
5. Structured JSON validation
6. Action engine
7. Clipboard context
8. Current-app context
9. Native Android bridge
10. Local AI
11. Safety
12. Demo polish
```

---

## ⚠️ Important Technical Notes

### Accessibility

AccessibilityService is powerful but should be used responsibly and according to Android requirements.

Do not design the product around unrestricted automation of other apps.

### On-device AI

Do not assume that every Android device supports the same AI features.

Test the exact target device.

### Free AI

Open models can be used without model licensing fees in many cases, but:

- inference may require compute
- cloud providers can have quotas
- licenses differ by model
- free tiers can change

Always check current model/provider terms.

---

## 🏆 Pitch

### One-line pitch

> **ContextFlow turns natural speech into context-aware actions on your smartphone.**

### Traditional voice assistant

```text
"Search Kubernetes."
        ↓
Search
```

### ContextFlow

```text
User copies an error
        ↓
"Explain this and tell me how to fix it."
        ↓
Context = clipboard
        ↓
AI understands intent
        ↓
Useful answer
```

The key idea is:

> **The phone should understand not only what you say, but what you're doing.**

---

## 📌 Current Project Status

Planning stage.

Next implementation milestone:

> **React Native → Voice → Transcript → LLM → Structured Intent**

Do not start with AccessibilityService or local LLM deployment.

Get the basic end-to-end pipeline working first.

# ContextFlow

> **A context-aware voice interaction layer for mobile powered by React Native and Node.js.**

ContextFlow is a mobile-first AI assistant that goes beyond speech-to-text.

Instead of:
```text
Voice → Text
```

ContextFlow executes:
```text
Voice + Context → Intent Router (Node.js) → Action Engine (React Native)
```

---

## 🚀 Key Prototype Architecture

1. **Frontend**: React Native UI (`/mobile`) with dark glassmorphic interface, real-time context viewer, quick voice presets, intent visualization, and action execution buttons.
2. **Backend**: Node.js + Express server (`/server`) serving as the AI Intent Router that processes voice input alongside clipboard/app context into validated structured JSON.

---

## 🛠️ Quick Start Instructions

### 1. Start the Node.js Server

```bash
cd server
npm install
npm start
```
The server runs at `http://localhost:5000`.

### 2. Start the React Native App

```bash
cd mobile
npm install
npm start
```
Run on Android device, emulator, or Web browser (`npm run web`).

---

## 💡 Example Usage Flow

1. **Copy text to clipboard** (e.g. *"Hey bro see you tomorrow at 5"*).
2. **Select speech preset or record**: *"Make it formal"*.
3. **Node.js Server processes request** and returns structured JSON:
   ```json
   {
     "intent": "rewrite",
     "confidence": 0.95,
     "entities": {
       "operation": "make_formal",
       "processedContent": "Dear Sir/Madam, I am writing to inform you regarding: Hey bro see you tomorrow at 5..."
     },
     "actionPayload": {
       "type": "COPY_TO_CLIPBOARD"
     }
   }
   ```
4. **React Native UI executes action**: Overwrites clipboard with formal text ready to send.

---

## 📂 Repository Structure

```text
IQOO_hack_2026/
├── server/                    # Node.js + Express Backend Server
│   ├── server.js              # Intent API endpoints & AI routing
│   ├── package.json
│   └── .env.example
├── mobile/                    # React Native UI App
│   ├── App.js                 # Main App Screen
│   ├── src/
│   │   └── services/
│   │       ├── apiService.js  # Node.js API connection
│   │       ├── contextService.js # Clipboard & App context
│   │       └── actionEngine.js # Action execution module
│   └── package.json
├── architecture.md
├── dependency.md
├── plan.md
├── ps.md
├── resources.md
├── techstack.md
└── README.md
```

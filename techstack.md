# ContextFlow — Technology Stack

## 1. Primary Stack (Prototype & MVP)

| Layer | Technology | Purpose |
|---|---|---|
| **Mobile UI** | React Native (Expo / JS) | Cross-platform voice assistant UI |
| **Backend Server** | Node.js + Express (JavaScript) | Intent parser, AI router & API bridge |
| **Language** | JavaScript (ES6+) | Rapid iteration without transpilation overhead |
| **STT** | React Native Speech / Presets | Speech-to-text transcript handling |
| **LLM Gateway** | Node.js Router / Cloud Model | Structured JSON intent generation |
| **Context** | Clipboard & App Context Services | Context injection (`Voice + Context → Intent`) |
| **Storage** | Async Storage / Local Memory | History & preference tracking |
| **Version Control** | Git + GitHub | Source code management |

---

## 2. React Native Frontend

React Native is selected for the primary mobile UI layer:

- **Rapid UI Development**: Built using glassmorphic dark-theme components for mobile screens.
- **Cross-Platform**: Accessible via Android physical devices, Android Emulators, and Web view.
- **Context Integration**: Interacts directly with device clipboard and active screen context services.

---

## 3. Node.js JavaScript Backend

The backend server is implemented using **Node.js and Express**:

- **Port**: `5000` (default)
- **Endpoints**:
  - `GET /api/health` — Service status check.
  - `POST /api/process-intent` — Intent parsing engine (`speechText`, `clipboardContext`, `appContext`).
- **Structured JSON**: Guaranteed JSON payload output containing intent type (`rewrite`, `prepare_message`, `create_note`, `create_reminder`, `explain`), confidence score, extracted entities, and action payloads.

---

## 4. Repository Structure

```text
contextflow/
├── server/                    # Node.js + Express Backend Server
│   ├── server.js              # Intent parser & Express server
│   ├── package.json
│   └── .env.example
├── mobile/                    # React Native Mobile Application
│   ├── App.js                 # Main React Native UI screen
│   ├── src/
│   │   └── services/
│   │       ├── apiService.js  # Node.js backend client API
│   │       ├── contextService.js # Clipboard & App context manager
│   │       └── actionEngine.js # Intent action executor
│   └── package.json
├── architecture.md
├── dependency.md
├── plan.md
├── ps.md
├── readme.md
├── resources.md
└── techstack.md
```

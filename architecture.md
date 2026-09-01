# ContextFlow — Architecture Specification

## 1. High-Level Flow Diagram

```text
                  USER (Speech / Touch)
                            │
                            ▼
                   React Native App UI
                            │
           ┌────────────────┴────────────────┐
           ▼                                 ▼
      Voice Transcript                Clipboard / App Context
           │                                 │
           └────────────────┬────────────────┘
                            ▼
              Node.js Express Backend Server
                 (POST /api/process-intent)
                            │
                            ▼
                     AI Intent Router
                  (Structured JSON Output)
                            │
                            ▼
                   Action Engine (Client)
                            │
      ┌─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
Copy to Clipboard     Message Draft         Schedule Reminder
```

---

## 2. Component Specifications

### A. React Native Mobile App (`/mobile`)
- **App.js**: Central glassmorphic control dashboard.
- **Context Service**: Reads device clipboard and screen state.
- **API Service**: Sends payload to Node.js backend (`http://localhost:5000/api/process-intent`).
- **Action Engine**: Executes intents locally on device.

### B. Node.js Backend Server (`/server`)
- **Express.js API Router**: Handles `/api/health` and `/api/process-intent`.
- **Intent Classifier**: Parses natural language speech alongside context into validated JSON formats.
- **Payload Formatter**: Produces executable action contracts (`COPY_TO_CLIPBOARD`, `OPEN_MESSAGING_APP`, `SAVE_NOTE`, `CREATE_SYSTEM_REMINDER`).

# ContextFlow — System Architecture & Execution Loop

## 1. Core Execution Loop

```text
       USER INPUT (Voice / Text Prompt)
                     │
                     ▼
         React Native Mobile UI
                     │
                     ▼
    Context Fusion Drawer (Location, Calendar, Traffic, Clipboard)
                     │
                     ▼
        Node.js Backend Engine (Port 5000)
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
Local Ollama (llama3.2:1b)  Learned Memory Store
          └──────────┬──────────┘
                     ▼
        Proactive Decision Payload
                     │
                     ▼
  Responsible Agent Action Screen (React Native)
           (Single-Tap Confirmation)
                     │
           ┌─────────┴─────────┐
           ▼                   ▼
    Execute Action     Learning Feedback Loop
                           (Store New Preference)
```

---

## 2. Responsible Agent Safeguards

1. **User Verification**: High-impact actions (e.g. cab booking, payment, sending external messages) require explicit single-tap confirmation (`[Book Cab]`).
2. **Context Integrity**: The agent explicitly lists the context sources used to derive its recommendations.
3. **Local AI Privacy**: Runs locally on device hardware using Ollama `llama3.2:1b` without leaking user calendar or location data to external APIs.

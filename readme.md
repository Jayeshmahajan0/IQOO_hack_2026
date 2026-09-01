# ContextFlow — "Operate Your Life" Hackathon Prototype

> **An AI agent that operates your life, not just answers you.**

ContextFlow goes beyond speech-to-text or plain chat Q&A. It is an autonomous mobile assistant built around a complete execution loop:

```text
Intent → Context → Action → Verification → Learning
```

---

## 🏆 Hackathon Pitch & Demonstration Scenario

### Scenario: *"I'm getting late for college."*

Instead of returning text output or searching the web, ContextFlow fuses multi-modal context:
- **Location**: Home (Sector 62, Noida)
- **Calendar**: Mobile Computing Lecture @ 10:00 AM
- **Traffic**: Metro Blue Line delayed by 20 mins; Cab available & 11 mins faster
- **Learning Memory**: User preferences & past decision history

### Proactive Output:
> *"Your class starts at 10:00. You're 28 minutes away. You normally take the metro, but today's route is delayed by 20 minutes. A cab is 11 minutes faster. Should I book one?"*

### Actionable Buttons:
- `[🚕 Book Cab (11 mins faster)]`
- `[🚇 Take Metro Anyway]`

### Verification & Learning Loop:
When the user taps `[Book Cab]`, the system logs the decision and learns:
> *"User prefers Cab over Metro when Metro delay > 15 minutes."*

Next time a similar situation occurs, ContextFlow automatically adapts its recommendations based on this learned preference.

---

## 🛠️ Technology Stack

- **Mobile Frontend**: React Native UI (`/mobile`) with clean dark glassmorphism, voice input trigger, context fusion drawer, proactive action cards, and learning memory inspector.
- **Backend Server**: Node.js + Express (`/server`) managing intent classification, context fusion, and the learning store.
- **Local AI Engine**: Integrated with local **Ollama `llama3.2:1b`** model (`http://127.0.0.1:11434`) for offline, zero-latency inference on device hardware.

---

## 🚀 Quick Start Guide

### 1. Start Node.js Backend Server
```bash
cd server
npm start
```
Server runs at `http://127.0.0.1:5000`.

### 2. Start React Native App
```bash
cd mobile
npm start
```
Run on Android, iOS, or Web (`npm run web`).

---

## 📂 Repository Structure

```text
IQOO_hack_2026/
├── server/                    # Node.js + Express Backend
│   ├── server.js              # Ollama llama3.2:1b & life-assistant loop
│   ├── learningStore.js       # Memory store for learned rules
│   ├── package.json
│   └── .env.example
├── mobile/                    # React Native UI App
│   ├── App.js                 # Clean Actionable Agent UI
│   ├── src/
│   │   └── services/
│   │       ├── apiService.js  # Server & Ollama client API
│   │       ├── contextService.js # Fused Context Manager
│   │       └── actionEngine.js # Responsible Action Executor
│   └── package.json
├── architecture.md
├── dependency.md
├── plan.md
├── ps.md
├── techstack.md
└── README.md
```

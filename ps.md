# ContextFlow — Product Specification

## 1. Product Name

Working name:

> ContextFlow

Alternative naming can be explored later.

---

## 2. Product Summary

ContextFlow is a voice-first Android assistant that interprets natural speech together with available smartphone context.

The application is designed to reduce typing and navigation by allowing users to describe what they want naturally.

The product is not intended to be a general-purpose autonomous agent in the first version. It is a controlled action assistant with explicit safety boundaries.

---

## 3. Target Users

### Primary

- Students
- Developers
- Mobile-heavy users
- People who frequently send messages
- Users who perform repetitive text operations
- Users who prefer speaking to typing

### Secondary

- Professionals
- Accessibility-oriented users
- Multilingual users
- Users performing tasks while moving around

---

## 4. Core User Problem

Current voice input often assumes:

```text
Voice = text
```

But natural mobile interaction is more complicated.

The user often means:

> "Do something with this."

The missing information is often:

- what app is open
- what text is selected
- what was copied
- who the user is interacting with
- what task the user is performing

ContextFlow attempts to combine these signals.

---

## 5. Core Product Equation

```text
User Intent
=
Speech
+
Mobile Context
+
Relevant User Content
+
Task History
```

Only the minimum relevant information should be provided to the model.

---

## 6. Core User Journey

```text
User taps/activates voice
        ↓
User speaks naturally
        ↓
Speech-to-text
        ↓
Context collection
        ↓
Intent extraction
        ↓
Action validation
        ↓
Preview/confirmation
        ↓
Action execution
        ↓
Feedback
```

---

## 7. Functional Requirements

### FR-01 — Voice capture

The app must allow the user to start and stop voice input.

Acceptance:

- microphone permission is requested correctly
- recording state is visible
- cancellation is possible
- errors are handled

---

### FR-02 — Speech recognition

The system must convert speech to text.

Acceptance:

- transcript appears
- recognition errors are handled
- empty speech does not trigger an action

---

### FR-03 — Intent extraction

The system must convert the transcript into a structured intent.

Example:

```json
{
  "intent": "create_reminder",
  "entities": {
    "title": "Call Rahul",
    "time": "tomorrow 10:00"
  }
}
```

---

### FR-04 — Context collection

The system must collect available context through supported mechanisms.

Possible fields:

```json
{
  "currentApp": "com.example.app",
  "clipboardText": "...",
  "selectedText": "...",
  "screenText": "...",
  "timestamp": "..."
}
```

Not every field will always be available.

---

### FR-05 — Context relevance

The system must not blindly send all context to the LLM.

A context selector should determine what is relevant.

Example:

```text
Intent: explain copied error

Required:
clipboardText

Not required:
contacts
location
full screen
notification history
```

---

### FR-06 — Action validation

The system must validate:

- intent
- required entities
- permissions
- target application
- action risk

before execution.

---

### FR-07 — Confirmation

High-impact actions should require confirmation.

Examples:

- send message
- delete content
- publish
- submit
- modify important data

Low-risk actions can execute immediately when appropriate.

---

### FR-08 — Action execution

The system should support a small allowlist of actions.

Initial actions:

1. create local note
2. create reminder/notification
3. search
4. rewrite
5. summarize
6. explain
7. translate
8. prepare a message

Sending a message can be implemented only after the safety/Android integration is properly designed.

---

## 8. Non-functional Requirements

### Performance

The perceived response should be fast.

Use:

- streaming where supported
- small prompts
- local routing
- cached configuration
- asynchronous processing

### Reliability

Every model call must have:

- timeout
- validation
- fallback
- error message

### Privacy

Avoid transmitting:

- unnecessary clipboard contents
- unrelated screen data
- personal contact lists
- private conversations

### Battery

Avoid continuously running heavy models or services unless technically justified.

---

## 9. Intent Schema

Recommended base schema:

```json
{
  "intent": "string",
  "confidence": 0.0,
  "entities": {},
  "requiresConfirmation": true,
  "reason": "string"
}
```

### Example

```json
{
  "intent": "rewrite",
  "confidence": 0.97,
  "entities": {
    "style": "professional",
    "textSource": "clipboard"
  },
  "requiresConfirmation": false,
  "reason": "User requested rewriting of copied text."
}
```

---

## 10. Initial Intent Taxonomy

### Text

- rewrite
- shorten
- expand
- summarize
- translate
- correct_grammar
- explain

### Communication

- prepare_message
- reply
- send_message

### Productivity

- create_note
- create_reminder
- create_task

### Search

- web_search
- app_search

### System

- open_app
- unknown

---

## 11. Context Object

```json
{
  "source": {
    "type": "mobile"
  },
  "application": {
    "packageName": null,
    "name": null
  },
  "screen": {
    "title": null,
    "selectedText": null
  },
  "clipboard": {
    "text": null
  },
  "conversation": {
    "participant": null
  },
  "timestamp": null
}
```

The application should populate only fields it legitimately has access to.

---

## 12. Context Priority

Priority order:

1. Explicit user input
2. Selected text
3. Clipboard
4. Current application
5. Relevant screen text
6. Recent task state
7. General device context

Do not infer sensitive information unnecessarily.

---

## 13. Safety Model

### Risk levels

#### Level 0 — No action

Example:

> "Explain this."

No confirmation.

#### Level 1 — Reversible local action

Example:

> "Create a note."

May execute immediately.

#### Level 2 — External communication

Example:

> "Send this message."

Require confirmation.

#### Level 3 — Sensitive/destructive

Example:

> "Delete these files."

Require strong confirmation or block in MVP.

---

## 14. UI Requirements

### Home screen

Show:

- microphone button
- recent request
- context status
- offline/online status
- history

### Listening state

Show:

- animated microphone
- live transcript
- cancel button

### Action preview

Show:

```text
Action
Send message

To
Rahul

Message
I'll reach in 15 minutes.

[Cancel] [Confirm]
```

### Context indicator

Example:

```text
Context used:
✓ Clipboard
✓ Current app
✗ Location
```

This reinforces privacy.

---

## 15. Hackathon Demo Requirements

The demo should show:

### Scenario 1

Natural message creation.

### Scenario 2

Clipboard-aware reasoning.

### Scenario 3

Local/offline operation.

The judges should understand:

> "It knows what I am doing, not just what I am saying."

---

## 16. Out of Scope

- unrestricted automation
- background recording without clear user activation
- covert screen monitoring
- credential extraction
- financial transactions
- deletion of important data
- fully autonomous communication
- custom foundation-model training

---

## 17. Definition of Done

The MVP is done when a fresh tester can:

1. launch the app
2. activate voice
3. speak naturally
4. see transcription
5. get an intent
6. see relevant context
7. preview an action
8. confirm it
9. see successful execution
10. recover from an error

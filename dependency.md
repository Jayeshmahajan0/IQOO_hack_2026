# ContextFlow — Dependency Plan

## 1. Dependency Philosophy

Keep dependencies minimal.

Every package creates:

- maintenance cost
- compatibility risk
- security risk
- build complexity

For the hackathon MVP, prefer platform APIs where they are good enough.

---

## 2. Core Dependencies

### Mobile

Recommended categories:

- React
- React Native
- TypeScript
- navigation
- state management
- permissions
- speech recognition
- storage

Exact package versions should be selected at project initialization and locked in the package lockfile.

Do not copy old package versions from tutorials.

---

## 3. Android Dependencies

Native Android may require dependencies for:

- accessibility support
- notifications
- audio
- local storage
- model runtime

Prefer Android SDK/platform APIs whenever possible.

---

## 4. AI Dependencies

### Speech

Initial:

- Android SpeechRecognizer or maintained RN wrapper

Optional:

- Whisper.cpp
- mobile-compatible Whisper runtime

### LLM

Cloud:

- provider SDK or HTTPS client

Local:

- selected model runtime

Do not install multiple local AI runtimes until a benchmark justifies them.

---

## 5. Backend Dependencies

Minimal backend:

```text
express
cors
dotenv
zod
```

Optional:

```text
pino
helmet
express-rate-limit
```

Use a normal HTTPS client/fetch implementation for model APIs where practical.

---

## 6. Validation

Use schema validation for AI output.

Recommended concept:

```ts
IntentSchema.parse(modelOutput);
```

The application must reject malformed output.

Example expected schema:

```ts
{
  intent: string,
  confidence: number,
  entities: Record<string, unknown>,
  requiresConfirmation: boolean
}
```

---

## 7. Storage Dependencies

For MVP:

- AsyncStorage for simple state

For structured history:

- SQLite-compatible solution

Do not introduce a remote database until the product actually requires multi-device/cloud persistence.

---

## 8. Development Dependencies

Typical:

- TypeScript
- ESLint
- Prettier
- Jest
- React Native testing utilities

Optional:

- Git hooks
- commit linting

Avoid spending hackathon time configuring elaborate tooling.

---

## 9. Dependency Risk Table

| Dependency area | Risk | Mitigation |
|---|---:|---|
| Speech package | Medium | Have Android native fallback |
| LLM provider | Medium | Provider adapter |
| Local model runtime | High | Keep cloud fallback |
| Accessibility APIs | High | Test on real device |
| React Native version | Medium | Lock versions |
| Android SDK | Medium | Use fixed build environment |
| Third-party UI library | Low | Keep minimal |
| Backend provider | Medium | Simple Node gateway |

---

## 10. Architecture Rule

No business-critical feature should depend directly on one third-party provider.

Bad:

```text
UI → Gemini SDK → action
```

Better:

```text
UI
 ↓
AI Service
 ↓
LLMProvider interface
 ↓
Gemini/Qwen/other provider
 ↓
Validated Intent
 ↓
Action Engine
```

---

## 11. Local AI Dependency Rule

Do not make local AI a hard requirement until:

- model is selected
- model runs on target phone
- memory is acceptable
- latency is acceptable
- battery impact is measured

Otherwise use cloud AI for the MVP and add local AI as an optimization/demo feature.

---

## 12. Native Module Dependency Rule

Native modules should expose high-level APIs.

Good:

```ts
ContextBridge.getContext()
```

Bad:

```ts
AccessibilityBridge.getNode(123)
AccessibilityBridge.getNodeText(456)
AccessibilityBridge.getWindow(789)
```

The first keeps Android implementation details out of the app.

---

## 13. Security

Never ship:

```text
LLM_API_KEY
```

inside the mobile application.

Use:

```text
Mobile
 ↓
Backend
 ↓
LLM Provider
```

for secret-bearing cloud APIs.

---

## 14. Dependency Installation Strategy

Install in this order:

1. React Native base
2. TypeScript
3. navigation
4. permissions
5. speech
6. storage
7. backend client
8. validation
9. native modules
10. optional AI runtime

Run the Android build after each major group.

This makes dependency failures easy to isolate.

---

## 15. Locking

Commit:

- package-lock/yarn/pnpm lockfile
- Gradle dependency versions
- Android SDK configuration
- model version/hash where appropriate

The hackathon build machine should reproduce the same dependency set.

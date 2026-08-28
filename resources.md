# ContextFlow — Resources

## 1. Official React Native

React Native documentation:

https://reactnative.dev/docs/getting-started

Use for:

- project setup
- components
- Android integration
- native modules
- architecture

Native platform documentation:

https://reactnative.dev/docs/native-platform

Turbo Native Modules:

https://reactnative.dev/docs/turbo-native-modules-introduction

---

## 2. Android Developer Documentation

Android developer portal:

https://developer.android.com/

Android AI:

https://developer.android.com/ai

AccessibilityService:

https://developer.android.com/reference/android/accessibilityservice/AccessibilityService

ClipboardManager:

https://developer.android.com/reference/android/content/ClipboardManager

Android Intents:

https://developer.android.com/guide/components/intents-filters

Speech recognition:

https://developer.android.com/reference/android/speech/SpeechRecognizer

Notifications:

https://developer.android.com/develop/ui/views/notifications

Permissions:

https://developer.android.com/training/permissions/requesting

These should be treated as the source of truth for Android behavior and restrictions.

---

## 3. Android AI / On-device AI

Android AI overview:

https://developer.android.com/ai/overview

ML Kit GenAI APIs:

https://developers.google.com/ml-kit/genai

Use these resources to evaluate whether Gemini Nano/AICore or other on-device capabilities are available on the target device.

Important:

Do not assume every Android phone supports the same on-device AI features.

---

## 4. Hugging Face

https://huggingface.co/

Use for:

- open model discovery
- model cards
- tokenizer information
- quantized models
- datasets

Potential model families to investigate:

- Qwen
- Gemma
- Phi
- Whisper

Always read the model card and license before using a model in a public or commercial project.

---

## 5. Whisper

OpenAI Whisper:

https://github.com/openai/whisper

Whisper.cpp:

https://github.com/ggerganov/whisper.cpp

Use Whisper.cpp as a starting point for researching offline/mobile speech recognition.

Evaluate:

- model size
- speed
- memory
- language support

---

## 6. Qwen

Hugging Face model collection:

https://huggingface.co/Qwen

Potential compact instruction models can be evaluated for intent classification and structured output.

Do not assume a model is suitable for mobile just because it is small on paper. Benchmark it on the actual target device.

---

## 7. Google AI / Gemini

Google AI:

https://ai.google.dev/

Use for:

- Gemini API documentation
- structured output
- model capabilities
- API limits

For hackathon use, check current free-tier/quota terms before committing to a specific provider.

---

## 8. Ollama

https://ollama.com/

Useful for local development and testing open models on a development machine.

It is mainly a development convenience. Do not assume the same model/runtime can simply be transferred to Android.

---

## 9. llama.cpp

https://github.com/ggml-org/llama.cpp

Useful for understanding local inference and quantized models.

For Android deployment, investigate compatible mobile bindings/runtimes rather than assuming desktop configuration works unchanged.

---

## 10. ONNX Runtime

https://onnxruntime.ai/

Useful if you eventually choose ONNX-compatible models for mobile inference.

---

## 11. TensorFlow Lite / LiteRT

https://ai.google.dev/edge/litert

Useful for on-device machine learning and mobile inference.

---

## 12. React Native Android Packages

Search npm/GitHub carefully for maintained packages for:

- speech recognition
- permissions
- clipboard
- notifications
- device information

Before selecting a package, check:

- last update
- Android support
- React Native version support
- New Architecture support
- open issues
- license

Do not add a package merely because a tutorial uses it.

---

## 13. Learning Order

Recommended learning sequence:

### Step 1

React Native basics

### Step 2

Android permissions

### Step 3

Speech recognition

### Step 4

REST APIs

### Step 5

LLM API integration

### Step 6

Structured JSON output

### Step 7

Android native modules

### Step 8

Clipboard

### Step 9

AccessibilityService

### Step 10

Local AI

---

## 14. Research Questions

Before finalizing the architecture, investigate:

1. Which speech recognition option has acceptable latency on the target iQOO device?
2. Can the chosen Android device support the selected on-device AI runtime?
3. What is the smallest model that reliably extracts intents?
4. How much RAM does local inference consume?
5. How much battery does continuous/near-continuous voice interaction consume?
6. What accessibility APIs are available on the target Android version?
7. What permissions are required?
8. What actions can be performed safely through Android APIs?
9. What app-specific integrations are allowed?
10. What data can legally and technically be read from another app's UI?

---

## 15. Benchmark Checklist

For every model:

- cold start latency
- warm inference latency
- RAM usage
- CPU usage
- battery impact
- JSON validity
- intent accuracy
- multilingual accuracy
- hallucination rate
- offline behavior

Record results on the actual phone.

---

## 16. Important Principle

Do not select technology because it sounds advanced.

Select it because it improves:

- latency
- reliability
- privacy
- user experience
- hackathon demonstration quality

A simple system that works perfectly is better than an advanced system that fails during the demo.

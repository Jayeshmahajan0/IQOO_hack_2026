const express = require('express');
const cors = require('cors');
require('dotenv').config();
const learningStore = require('./learningStore');

const app = express();
const PORT = process.env.PORT || 5000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let ollamaStatus = 'offline';
  let availableModels = [];

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/tags`);
    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      ollamaStatus = 'online';
      availableModels = (data.models || []).map(m => m.name);
    }
  } catch (err) {
    ollamaStatus = 'offline';
  }

  res.json({
    status: 'online',
    service: 'ContextFlow Universal Action Agent',
    ollama: {
      status: ollamaStatus,
      targetModel: OLLAMA_MODEL,
      availableModels
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Ollama Query Helper
 */
async function queryOllama(promptText, systemPrompt) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\nUser: ${promptText}\nAssistant:`,
        stream: false,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.response ? data.response.trim() : null;
  } catch (err) {
    console.log(`Ollama query note: ${err.message}`);
    return null;
  }
}

/**
 * Universal Actionable AI Agent Endpoint
 * Returns natural, human-like speech + dynamic matched Action Cards
 */
app.post('/api/life-assistant', async (req, res) => {
  try {
    const { userPrompt, customContext } = req.body;
    const prompt = (userPrompt || "Hello").trim();
    const promptLower = prompt.toLowerCase();

    const activeContext = {
      ...learningStore.getActiveContext(),
      ...customContext
    };
    const rules = learningStore.getLearnedRules();

    // Clean, high-impression system prompt for Ollama:
    // DO NOT awkwardly repeat "Sector 62" or location unless specifically asked!
    const systemPrompt = `You are ContextFlow, a highly intelligent, natural, and helpful AI assistant.
Rules for your response:
1. Speak naturally like a modern AI assistant (e.g. Siri/Google Assistant/ChatGPT).
2. NEVER repeat street names, city sectors, or addresses (like "Sector 62") unless the user explicitly asks for location, navigation, or directions!
3. Be direct, polite, and helpful. Do not give robotic or repetitive responses.
4. Active Learned Preferences: ${rules.map(r => r.rule).join('; ')}.`;

    // 1. Get reasoning from Ollama model
    let ollamaResponse = await queryOllama(prompt, systemPrompt);

    // Clean up any stray location references if Ollama hallucinated them
    if (ollamaResponse && !promptLower.includes('location') && !promptLower.includes('where')) {
      ollamaResponse = ollamaResponse.replace(/,?\s*Sector\s*62,?\s*/gi, ' ').replace(/\s+/g, ' ').trim();
    }

    let responseObj = {
      intent: 'CONVERSATIONAL_REPLY',
      speechReply: ollamaResponse || `I'm here to help! What would you like to do?`,
      actionCard: null,
      contextUsed: ['AI Reasoning Engine']
    };

    // --- DYNAMIC INTENT CLASSIFICATION & MATCHED ACTION CARDS ---

    // 1. ALARMS & CLOCKS ("set alarm for 7 am", "wake me up", "timer")
    if (promptLower.includes('alarm') || promptLower.includes('wake me') || promptLower.includes('timer')) {
      let timeMatch = prompt.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      let timeStr = timeMatch ? timeMatch[1].toUpperCase() : '7:00 AM';

      responseObj.intent = 'SET_ALARM';
      responseObj.speechReply = ollamaResponse || `I've set an alarm for ${timeStr}. Sleep well!`;
      responseObj.actionCard = {
        type: 'SYSTEM_LAUNCH',
        title: `⏰ Alarm Set for ${timeStr}`,
        subtitle: `Alarm enabled in System Clock app • Repeats daily`,
        buttonText: `Open Clock & Alarm`,
        actionData: { appName: 'Clock', time: timeStr }
      };
      responseObj.contextUsed = ['Device Clock Service'];
    }
    // 2. MESSAGING & WHATSAPP ("send message to rahul", "text rahul", "whatsapp", "tell him", "draft email")
    else if (promptLower.includes('message') || promptLower.includes('whatsapp') || promptLower.includes('text') || promptLower.includes('tell') || promptLower.includes('draft') || promptLower.includes('email')) {
      let recipient = 'Contact';
      const match = prompt.match(/(?:tell|text|message|send\s+message\s+to|send\s+to|send)\s+([A-Z][a-z]+|[a-z]+)/i);
      if (match && match[1]) {
        let candidate = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        if (!['Message', 'Text', 'The', 'A', 'Him', 'Her', 'Me', 'My'].includes(candidate)) {
          recipient = candidate;
        }
      }
      // Check for "to [Name]" pattern
      const toMatch = prompt.match(/to\s+([A-Z][a-z]+|[a-z]+)/i);
      if (toMatch && toMatch[1]) {
        let candidate = toMatch[1].charAt(0).toUpperCase() + toMatch[1].slice(1);
        if (!['The', 'A', 'Him', 'Her', 'Me', 'My'].includes(candidate)) {
          recipient = candidate;
        }
      }

      let messageBody = "Hey, checking in!";
      if (promptLower.includes('late')) messageBody = "Hey, running a few minutes late. Reach soon!";
      if (promptLower.includes('lecture') || promptLower.includes('class')) messageBody = "Hey, heading to class now!";

      responseObj.intent = 'SEND_MESSAGE';
      responseObj.speechReply = ollamaResponse || `I've prepared a draft message for ${recipient}: "${messageBody}". Tap below to send via WhatsApp.`;
      responseObj.actionCard = {
        type: 'MESSAGE_DRAFT',
        title: `💬 Send WhatsApp to ${recipient}`,
        subtitle: `Body: "${messageBody}"`,
        buttonText: `Send Message to ${recipient}`,
        actionData: { recipient, text: messageBody, platform: 'WhatsApp' }
      };
      responseObj.contextUsed = ['Contacts Service', 'WhatsApp API'];
    }
    // 3. RIDES & COMMUTE (ONLY when user explicitly mentions cab, uber, ride, transport, or travel)
    else if (promptLower.includes('cab') || promptLower.includes('uber') || promptLower.includes('ride') || promptLower.includes('ola') || promptLower.includes('taxi') || promptLower.includes('commute')) {
      responseObj.intent = 'BOOK_RIDE';
      responseObj.speechReply = ollamaResponse || `Uber Go is available nearby with an estimated arrival in 3 mins. Would you like me to confirm your ride?`;
      responseObj.actionCard = {
        type: 'RIDE_BOOKING',
        title: '🚕 Book Uber Go',
        subtitle: `Destination: ${activeContext.calendar.location} • Fare: ₹180`,
        price: '₹180',
        buttonText: 'Confirm & Book Uber',
        actionData: { service: 'Uber', fare: '₹180' }
      };
      responseObj.contextUsed = ['Uber Mobility Service', 'Transit API'];
    }
    // 4. MUSIC & SPOTIFY ("play music", "spotify", "song", "playlist")
    else if (promptLower.includes('music') || promptLower.includes('spotify') || promptLower.includes('song') || promptLower.includes('playlist')) {
      responseObj.intent = 'MEDIA_CONTROL';
      responseObj.speechReply = ollamaResponse || `Opening Spotify to play your focus playlist!`;
      responseObj.actionCard = {
        type: 'MEDIA_PLAYER',
        title: '🎵 Open Spotify',
        subtitle: 'Play "Deep Focus AI Playlist"',
        buttonText: 'Launch Spotify & Play',
        actionData: { app: 'Spotify' }
      };
      responseObj.contextUsed = ['Spotify Audio Engine'];
    }
    // 5. APPS & MAPS ("open camera", "open maps", "directions", "settings", "browser")
    else if (promptLower.includes('camera') || promptLower.includes('map') || promptLower.includes('direction') || promptLower.includes('open') || promptLower.includes('app')) {
      let targetApp = 'Maps';
      if (promptLower.includes('camera')) targetApp = 'Camera';
      if (promptLower.includes('map') || promptLower.includes('direction')) targetApp = 'Google Maps';
      if (promptLower.includes('browser') || promptLower.includes('chrome')) targetApp = 'Browser';

      responseObj.intent = 'LAUNCH_APP';
      responseObj.speechReply = ollamaResponse || `Opening ${targetApp} for you now.`;
      responseObj.actionCard = {
        type: 'SYSTEM_LAUNCH',
        title: `🚀 Open ${targetApp}`,
        subtitle: `Launch system executable`,
        buttonText: `Launch ${targetApp}`,
        actionData: { appName: targetApp }
      };
      responseObj.contextUsed = ['System Launcher'];
    }
    // 6. REMINDERS & NOTES ("remind me", "take a note", "save this")
    else if (promptLower.includes('remind') || promptLower.includes('note') || promptLower.includes('todo')) {
      responseObj.intent = 'CREATE_REMINDER';
      responseObj.speechReply = ollamaResponse || `Saved a reminder for "${prompt}".`;
      responseObj.actionCard = {
        type: 'REMINDER_CARD',
        title: '📝 Save Reminder',
        subtitle: `Note: ${prompt}`,
        buttonText: 'Save to System Reminders',
        actionData: { task: prompt }
      };
      responseObj.contextUsed = ['System Notes'];
    }
    // 7. GENERAL CONVERSATION & Q&A (Natural Chat without forcing unnecessary action cards)
    else {
      responseObj.intent = 'CONVERSATIONAL_REPLY';
      responseObj.speechReply = ollamaResponse || `I'm here! Tell me what you need, whether it's drafting a message, launching an app, setting alarms, or answering questions.`;
      responseObj.actionCard = null; // Clean chat response without forcing unwanted cards!
      responseObj.contextUsed = ['Ollama AI Engine'];
    }

    learningStore.logConversation(prompt, responseObj.speechReply);

    res.json({
      success: true,
      aiEngine: ollamaResponse ? `Ollama (${OLLAMA_MODEL})` : 'ContextFlow Agent',
      timestamp: new Date().toISOString(),
      result: responseObj
    });

  } catch (err) {
    console.error('Server Life Assistant error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * Feedback & Learning Endpoint
 */
app.post('/api/feedback-learn', (req, res) => {
  try {
    const { actionType, title } = req.body;
    const ruleText = `User confirmed action: "${title || actionType}"`;
    const newRule = learningStore.addLearnedRule(ruleText, actionType || 'User Choice');

    res.json({
      success: true,
      message: 'Learned preference saved!',
      learnedRule: newRule,
      allRules: learningStore.getLearnedRules()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Active Rules Endpoint
 */
app.get('/api/learning-rules', (req, res) => {
  res.json({
    success: true,
    rules: learningStore.getLearnedRules()
  });
});

// Bind to 0.0.0.0 for LAN Wi-Fi access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 ContextFlow Universal Action Agent Running`);
  console.log(`🌐 Server Port: ${PORT} (Bound to 0.0.0.0 for LAN/Wi-Fi)`);
  console.log(`🤖 Ollama Model Target: ${OLLAMA_MODEL} (${OLLAMA_URL})`);
  console.log(`📡 Local Health Check: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📱 Mobile LAN URL:    http://10.142.79.70:${PORT}/api/life-assistant`);
  console.log(`====================================================`);
});

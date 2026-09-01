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
    return data.response;
  } catch (err) {
    console.log(`Ollama query note: ${err.message}`);
    return null;
  }
}

/**
 * Universal Actionable AI Agent Endpoint
 * Handles ANY user prompt & returns natural response + executable Action Card
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

    const systemPrompt = `You are ContextFlow, a friendly, intelligent, and proactive AI Assistant.
User context: Location: ${activeContext.location}, Schedule: ${activeContext.calendar.event} at ${activeContext.calendar.time}.
Learned user preferences: ${rules.map(r => r.rule).join('; ')}.

Be helpful, concise, and natural.`;

    // 1. Get reasoning from Ollama model
    const ollamaResponse = await queryOllama(prompt, systemPrompt);

    // 2. Classify intent & build actionable payload for ANY user query
    let responseObj = {
      intent: 'GENERAL_ASSISTANT',
      speechReply: ollamaResponse || `I'm here to help! How can I assist you today?`,
      actionCard: null,
      contextUsed: ['Active Location', 'Preferences']
    };

    // Intent A: Rides & Commute ("book cab", "uber", "late for college", "ride to airport", "metro")
    if (promptLower.includes('cab') || promptLower.includes('uber') || promptLower.includes('late') || promptLower.includes('ride') || promptLower.includes('commute') || promptLower.includes('college')) {
      responseObj.intent = 'BOOK_RIDE';
      responseObj.speechReply = ollamaResponse || `I noticed your schedule and transit updates. Cab service is currently 11 mins faster. Would you like me to book an Uber Go?`;
      responseObj.actionCard = {
        type: 'RIDE_BOOKING',
        title: '🚕 Book Uber Go',
        subtitle: `To: ${activeContext.calendar.location} • ETA 3 mins`,
        price: '₹180',
        buttonText: 'Confirm & Book Ride',
        actionData: { service: 'Uber', pickup: activeContext.location, dropoff: activeContext.calendar.location, fare: '₹180' }
      };
      responseObj.contextUsed = ['Calendar Schedule', 'Traffic Alert', 'Location'];
    }
    // Intent B: Media & Music ("play music", "spotify", "song", "listen to")
    else if (promptLower.includes('music') || promptLower.includes('spotify') || promptLower.includes('play') || promptLower.includes('song')) {
      responseObj.intent = 'MEDIA_CONTROL';
      responseObj.speechReply = ollamaResponse || `Opening Spotify to play your favorite focus playlist!`;
      responseObj.actionCard = {
        type: 'MEDIA_PLAYER',
        title: '🎵 Open Spotify',
        subtitle: 'Play "Deep Focus AI Playlist"',
        buttonText: 'Launch & Play Now',
        actionData: { app: 'Spotify', playlist: 'Deep Focus' }
      };
      responseObj.contextUsed = ['User Media Preferences'];
    }
    // Intent C: Messaging & Calls ("send message", "whatsapp", "text rahul", "draft email", "call mom")
    else if (promptLower.includes('message') || promptLower.includes('whatsapp') || promptLower.includes('text') || promptLower.includes('call') || promptLower.includes('email') || promptLower.includes('tell')) {
      let recipient = 'Contact';
      const match = prompt.match(/(?:tell|text|message|call)\s+([A-Z][a-z]+|[a-z]+)/i);
      if (match && match[1]) recipient = match[1].charAt(0).toUpperCase() + match[1].slice(1);

      responseObj.intent = 'SEND_MESSAGE';
      responseObj.speechReply = ollamaResponse || `I've prepared a draft message for ${recipient}. Tap below to send via WhatsApp.`;
      responseObj.actionCard = {
        type: 'MESSAGE_DRAFT',
        title: `💬 WhatsApp to ${recipient}`,
        subtitle: `"Hey, heading over now. Talk shortly!"`,
        buttonText: `Send Message to ${recipient}`,
        actionData: { recipient, platform: 'WhatsApp', text: 'Hey, heading over now. Talk shortly!' }
      };
      responseObj.contextUsed = ['Clipboard', 'Contacts Integration'];
    }
    // Intent D: Apps & System Launch ("open camera", "open maps", "directions", "settings", "flashlight", "alarm")
    else if (promptLower.includes('camera') || promptLower.includes('map') || promptLower.includes('direction') || promptLower.includes('alarm') || promptLower.includes('open') || promptLower.includes('app')) {
      let targetApp = 'Maps';
      if (promptLower.includes('camera')) targetApp = 'Camera';
      if (promptLower.includes('alarm')) targetApp = 'Clock / Alarm';
      if (promptLower.includes('map') || promptLower.includes('direction')) targetApp = 'Google Maps';

      responseObj.intent = 'LAUNCH_APP';
      responseObj.speechReply = ollamaResponse || `Opening ${targetApp} for you now.`;
      responseObj.actionCard = {
        type: 'SYSTEM_LAUNCH',
        title: `🚀 Open ${targetApp}`,
        subtitle: `Launch system app executable`,
        buttonText: `Launch ${targetApp}`,
        actionData: { appName: targetApp }
      };
      responseObj.contextUsed = ['Device Services'];
    }
    // Intent E: Reminders & Notes ("remind me", "take a note", "schedule")
    else if (promptLower.includes('remind') || promptLower.includes('note') || promptLower.includes('schedule') || promptLower.includes('alarm')) {
      responseObj.intent = 'CREATE_REMINDER';
      responseObj.speechReply = ollamaResponse || `I've set up a smart reminder for "${prompt}".`;
      responseObj.actionCard = {
        type: 'REMINDER_CARD',
        title: '⏰ Set System Reminder',
        subtitle: `Task: ${prompt}`,
        buttonText: 'Save Reminder',
        actionData: { task: prompt, time: 'Today 5:00 PM' }
      };
      responseObj.contextUsed = ['Calendar API'];
    }
    // Intent F: Web Search / Info ("search", "what is", "who is", "weather", "news", "explain")
    else if (promptLower.includes('search') || promptLower.includes('what') || promptLower.includes('who') || promptLower.includes('weather') || promptLower.includes('explain') || promptLower.includes('how')) {
      responseObj.intent = 'WEB_SEARCH';
      responseObj.speechReply = ollamaResponse || `Here is what I found regarding "${prompt}": ContextFlow AI processed this search query.`;
      responseObj.actionCard = {
        type: 'INFO_CARD',
        title: '🔍 AI Web Insight',
        subtitle: prompt.slice(0, 50),
        buttonText: 'View Search Details',
        actionData: { query: prompt }
      };
      responseObj.contextUsed = ['Web Engine', 'Ollama LLM'];
    }
    // Intent G: General Conversation / Chat with User
    else {
      responseObj.intent = 'CONVERSATIONAL_REPLY';
      responseObj.speechReply = ollamaResponse || `I understand! "${prompt}". Is there anything specific you'd like me to action or set up for you?`;
      responseObj.actionCard = {
        type: 'CONVERSATION_SUGGESTION',
        title: '💡 Suggested Action',
        subtitle: `Execute smart task for "${prompt.slice(0, 30)}"`,
        buttonText: 'Run Action Workflow',
        actionData: { prompt }
      };
      responseObj.contextUsed = ['Ollama AI Reasoning'];
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
    const ruleText = `User preferred action: "${title || actionType}"`;
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

// Bind to 0.0.0.0 so external Wi-Fi devices (e.g. mobile phones on Expo Go) can connect!
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 ContextFlow Actionable AI Agent Server Running`);
  console.log(`🌐 Server Port: ${PORT} (Bound to 0.0.0.0 for LAN/Wi-Fi)`);
  console.log(`🤖 Ollama Model Target: ${OLLAMA_MODEL} (${OLLAMA_URL})`);
  console.log(`📡 Local Health Check: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📱 Mobile LAN URL:    http://10.142.79.70:${PORT}/api/life-assistant`);
  console.log(`====================================================`);
});

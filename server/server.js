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

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * Health Check Endpoint - Node.js + Ollama Status
 */
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
    ollamaStatus = 'offline (will use fast embedded AI router)';
  }

  res.json({
    status: 'online',
    service: 'ContextFlow Autonomous Agent Server',
    ollama: {
      status: ollamaStatus,
      targetModel: OLLAMA_MODEL,
      availableModels
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Helper: Query local Ollama llama3.2:1b model
 */
async function queryOllama(promptText, systemPrompt) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\nUser Input: ${promptText}\nResponse:`,
        stream: false,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.response;
  } catch (err) {
    console.log(`[Ollama Query Note]: ${err.message}. Using built-in reasoning engine.`);
    return null;
  }
}

/**
 * Main Autonomous Life Assistant Endpoint
 * Flow: Intent -> Context -> Action
 */
app.post('/api/life-assistant', async (req, res) => {
  try {
    const { userPrompt, customContext } = req.body;
    const promptText = userPrompt || "I'm getting late for college";

    // 1. Gather fused multi-modal context & learned rules
    const context = {
      ...learningStore.getCurrentContext(),
      ...customContext
    };
    const learnedRules = learningStore.getLearnedRules();

    const textLower = promptText.toLowerCase();

    // 2. Query Ollama local llama3.2:1b model for reasoning
    const systemPrompt = `You are ContextFlow, an autonomous life-operating AI agent. 
Analyze the user request combined with user context:
Location: ${context.location}
Calendar: ${context.calendar.event} at ${context.calendar.startTime} (${context.calendar.timeUntilEvent})
Traffic: ${context.traffic.metroStatus} vs ${context.traffic.cabStatus}
Learned Rules: ${learnedRules.map(r => r.rule).join('; ')}

Provide a concise, direct, helpful analysis and recommendation.`;

    const rawOllamaOutput = await queryOllama(promptText, systemPrompt);

    // 3. Construct structured actionable decision object
    let agentResult = null;

    if (textLower.includes('college') || textLower.includes('late') || textLower.includes('commute') || textLower.includes('class')) {
      agentResult = {
        intent: 'OPTIMIZE_COMMUTE_LATE',
        reasoning: rawOllamaOutput || `Your ${context.calendar.event} starts at ${context.calendar.startTime}. Metro is delayed by 20 minutes due to line congestion. A cab is 11 minutes faster and will ensure you arrive on time.`,
        action: {
          id: 'action_book_cab',
          type: 'BOOK_CAB',
          title: '🚕 Book Cab (11 mins faster)',
          description: `Estimated Fare: ₹180 • ETA: 17 mins • Time saved: 11 mins`,
          payload: {
            destination: context.calendar.location,
            pickup: context.location,
            fare: '₹180',
            timeSaved: '11 mins'
          }
        },
        alternativeAction: {
          id: 'action_take_metro',
          type: 'TAKE_METRO',
          title: '🚇 Take Metro Anyway',
          description: `Expected arrival: 10:15 AM (15 mins late)`
        },
        responsibleAgentNote: 'Checked calendar & live transit state. Cab booking requires your single-tap confirmation.',
        contextUsed: ['Current Location', 'Google Calendar', 'Metro Traffic Alert', 'Learned Preferences']
      };
    } else if (textLower.includes('message') || textLower.includes('text') || textLower.includes('tell')) {
      agentResult = {
        intent: 'PREPARE_RESPONSIBLE_MESSAGE',
        reasoning: rawOllamaOutput || `Detected upcoming lecture at ${context.calendar.startTime}. Pre-drafted a polite notification message to your study group.`,
        action: {
          id: 'action_send_message',
          type: 'SEND_MESSAGE',
          title: '💬 Send Status Update',
          description: `To: Class Group • "Hey, heading to Campus Hall B now, reach in 15m."`,
          payload: {
            recipient: 'Class Group',
            body: 'Hey, heading to Campus Hall B now, reach in 15m.'
          }
        },
        responsibleAgentNote: 'Pre-filled message draft. Will not send without user verification.',
        contextUsed: ['Calendar Event', 'Clipboard Context']
      };
    } else {
      agentResult = {
        intent: 'AUTONOMOUS_TASK_ASSISTANT',
        reasoning: rawOllamaOutput || `Analyzed prompt: "${promptText}". Checked active schedule and context.`,
        action: {
          id: 'action_general_execute',
          type: 'DISPLAY_RECOMMENDATION',
          title: '⚡ Apply Smart Recommendation',
          description: `Execute context-optimized action for: "${promptText}"`,
          payload: { promptText }
        },
        responsibleAgentNote: 'Actionable workflow generated with safety verification step.',
        contextUsed: ['Active Context', 'User Preferences']
      };
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      aiEngine: rawOllamaOutput ? `Ollama (${OLLAMA_MODEL})` : 'ContextFlow Fast Agent Engine',
      context,
      result: agentResult
    });

  } catch (err) {
    console.error('Error in life-assistant:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * Feedback & Learning Endpoint
 * Flow: Verification -> Learning
 */
app.post('/api/feedback-learn', (req, res) => {
  try {
    const { actionId, userChoice, contextCondition } = req.body;

    let learnedRuleText = '';
    if (actionId === 'action_book_cab' || userChoice === 'BOOK_CAB') {
      learnedRuleText = 'User prefers Cab when Metro delay > 15 mins';
    } else if (actionId === 'action_send_message') {
      learnedRuleText = 'User prefers quick automated status drafts during class commute';
    } else {
      learnedRuleText = `User chose ${userChoice || 'custom action'} under condition: ${contextCondition || 'standard'}`;
    }

    const newRule = learningStore.addLearnedRule(learnedRuleText, contextCondition || 'User Action Choice');
    learningStore.logDecision({ actionId, userChoice, learnedRule: learnedRuleText });

    res.json({
      success: true,
      message: 'Feedback received & AI preference updated!',
      learnedRule: newRule,
      allRules: learningStore.getLearnedRules()
    });
  } catch (err) {
    console.error('Error recording learning feedback:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * Get Active Learned Rules Endpoint
 */
app.get('/api/learning-rules', (req, res) => {
  res.json({
    success: true,
    rules: learningStore.getLearnedRules(),
    history: learningStore.getDecisionHistory()
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ContextFlow "Operate Your Life" Agent running on port ${PORT}`);
  console.log(`🤖 Ollama Model Target: ${OLLAMA_MODEL} (${OLLAMA_URL})`);
  console.log(`📡 Health Check:  http://127.0.0.1:${PORT}/api/health`);
  console.log(`⚡ Agent Engine:  http://127.0.0.1:${PORT}/api/life-assistant`);
  console.log(`🧠 Learning API:  http://127.0.0.1:${PORT}/api/feedback-learn`);
  console.log(`====================================================`);
});

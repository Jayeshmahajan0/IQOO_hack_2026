const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'ContextFlow AI Engine (Node.js)',
    timestamp: new Date().toISOString()
  });
});

/**
 * Main Intent Processing Endpoint
 * Request payload:
 * {
 *   speechText: string,
 *   clipboardContext?: string,
 *   appContext?: { appName?: string, selectedText?: string }
 * }
 */
app.post('/api/process-intent', (req, res) => {
  try {
    const { speechText, clipboardContext, appContext } = req.body;

    if (!speechText || typeof speechText !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'speechText is required and must be a string.'
      });
    }

    const textLower = speechText.trim().toLowerCase();
    let resultIntent = {
      intent: 'unknown',
      confidence: 0.85,
      requiresConfirmation: false,
      entities: {},
      actionPayload: null,
      summary: ''
    };

    const hasClipboard = clipboardContext && clipboardContext.trim().length > 0;
    const clipText = hasClipboard ? clipboardContext.trim() : '';

    // 1. REWRITE / SHORTEN / FORMAL INTENT
    if (
      textLower.includes('make this shorter') ||
      textLower.includes('shorten') ||
      textLower.includes('summarize this') ||
      textLower.includes('make it formal') ||
      textLower.includes('rewrite') ||
      textLower.includes('fix grammar')
    ) {
      let operation = 'rewrite';
      let modifiedText = clipText;

      if (textLower.includes('shorter') || textLower.includes('shorten') || textLower.includes('summarize')) {
        operation = 'shorten';
        modifiedText = clipText ? clipText.split('. ').slice(0, 2).join('. ') : speechText;
        if (!modifiedText.endsWith('.')) modifiedText += '...';
      } else if (textLower.includes('formal') || textLower.includes('professional')) {
        operation = 'make_formal';
        modifiedText = clipText
          ? `Dear Team, I am writing to inform you regarding: "${clipText}". Please let me know your thoughts. Best regards.`
          : `Dear Sir/Madam, ${speechText}`;
      } else if (textLower.includes('fix grammar') || textLower.includes('correct')) {
        operation = 'fix_grammar';
        modifiedText = clipText ? clipText.charAt(0).toUpperCase() + clipText.slice(1) : speechText;
      }

      resultIntent = {
        intent: 'rewrite',
        confidence: 0.95,
        requiresConfirmation: false,
        entities: {
          operation,
          sourceContext: hasClipboard ? 'clipboard' : 'speech',
          originalContent: clipText || speechText,
          processedContent: modifiedText
        },
        actionPayload: {
          type: 'COPY_TO_CLIPBOARD',
          content: modifiedText
        },
        summary: `Rewrote context as (${operation}): "${modifiedText}"`
      };
    }
    // 2. PREPARE MESSAGE INTENT
    else if (
      textLower.includes('tell') ||
      textLower.includes('message') ||
      textLower.includes('send to') ||
      textLower.includes('text')
    ) {
      let recipient = 'Contact';
      const tellMatch = speechText.match(/(?:tell|message|send to|text)\s+([A-Z][a-z]+|[a-z]+)/i);
      if (tellMatch && tellMatch[1]) {
        recipient = tellMatch[1].charAt(0).toUpperCase() + tellMatch[1].slice(1);
      }

      let messageBody = speechText.replace(/(?:tell|message|send to|text)\s+([A-Z][a-z]+|[a-z]+)/i, '').trim();
      if (!messageBody && hasClipboard) {
        messageBody = clipText;
      }

      resultIntent = {
        intent: 'prepare_message',
        confidence: 0.92,
        requiresConfirmation: true,
        entities: {
          recipient,
          messageBody: messageBody || 'Hey, checking in!'
        },
        actionPayload: {
          type: 'OPEN_MESSAGING_APP',
          recipient,
          body: messageBody || 'Hey, checking in!'
        },
        summary: `Prepared draft for ${recipient}: "${messageBody}"`
      };
    }
    // 3. CREATE NOTE INTENT
    else if (
      textLower.includes('note') ||
      textLower.includes('take a note') ||
      textLower.includes('remember this') ||
      textLower.includes('save this')
    ) {
      const noteContent = hasClipboard ? clipText : speechText.replace(/note|take a note|save this|remember/gi, '').trim();
      resultIntent = {
        intent: 'create_note',
        confidence: 0.90,
        requiresConfirmation: false,
        entities: {
          title: speechText.slice(0, 30),
          content: noteContent || speechText
        },
        actionPayload: {
          type: 'SAVE_NOTE',
          title: 'ContextFlow Note',
          content: noteContent || speechText
        },
        summary: `Saved note: "${noteContent || speechText}"`
      };
    }
    // 4. CREATE REMINDER INTENT
    else if (
      textLower.includes('remind me') ||
      textLower.includes('reminder') ||
      textLower.includes('schedule')
    ) {
      let timeStr = 'in 1 hour';
      if (textLower.includes('at 5') || textLower.includes('5 pm')) timeStr = '5:00 PM';
      if (textLower.includes('tomorrow')) timeStr = 'Tomorrow 9:00 AM';

      resultIntent = {
        intent: 'create_reminder',
        confidence: 0.88,
        requiresConfirmation: true,
        entities: {
          task: speechText.replace(/remind me|reminder|schedule/gi, '').trim() || 'Follow up',
          time: timeStr
        },
        actionPayload: {
          type: 'CREATE_SYSTEM_REMINDER',
          task: speechText.replace(/remind me|reminder|schedule/gi, '').trim() || 'Follow up',
          time: timeStr
        },
        summary: `Scheduled reminder: "${speechText}" for ${timeStr}`
      };
    }
    // 5. EXPLAIN / SEARCH INTENT
    else if (textLower.includes('explain') || textLower.includes('what is') || textLower.includes('search')) {
      const query = hasClipboard ? clipText : speechText;
      resultIntent = {
        intent: 'explain',
        confidence: 0.89,
        requiresConfirmation: false,
        entities: {
          query,
          explanation: `ContextFlow AI Analysis of "${query}": This text refers to mobile intent execution & context awareness.`
        },
        actionPayload: {
          type: 'DISPLAY_INFO',
          content: `Explanation: "${query}" - Analyzed via ContextFlow AI engine.`
        },
        summary: `Provided explanation for: "${query.slice(0, 40)}..."`
      };
    }
    // 6. DEFAULT GENERAL FALLBACK
    else {
      resultIntent = {
        intent: 'general_assistant',
        confidence: 0.80,
        requiresConfirmation: false,
        entities: {
          query: speechText,
          contextUsed: hasClipboard ? 'clipboard' : 'none'
        },
        actionPayload: {
          type: 'DISPLAY_RESPONSE',
          responseText: `Processed voice input: "${speechText}"${hasClipboard ? ` with context: "${clipText}"` : ''}`
        },
        summary: `Processed input with ${hasClipboard ? 'clipboard context' : 'no active context'}.`
      };
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      input: {
        speechText,
        hasClipboardContext: hasClipboard,
        appContext: appContext || null
      },
      result: resultIntent
    });

  } catch (error) {
    console.error('Error processing intent:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ContextFlow Node.js Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Intent API:   http://localhost:${PORT}/api/process-intent`);
  console.log(`====================================================`);
});

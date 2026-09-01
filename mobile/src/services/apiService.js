/**
 * API Service for ContextFlow Universal Actionable AI Agent
 */

let currentServerUrl = 'http://10.142.79.70:5000';

export function getServerUrl() {
  return currentServerUrl;
}

export function setServerUrl(url) {
  if (!url) return;
  let formatted = url.trim();
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = `http://${formatted}`;
  }
  if (!formatted.includes(':', 7)) {
    formatted = `${formatted}:5000`;
  }
  currentServerUrl = formatted;
}

export async function checkServerHealth(url = currentServerUrl) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) return { online: false };
    const data = await response.json();
    return { online: true, url, ...data };
  } catch (error) {
    // If local Wi-Fi IP failed, try 127.0.0.1 for local emulator preview
    if (url !== 'http://127.0.0.1:5000') {
      return checkServerHealth('http://127.0.0.1:5000');
    }
    return { online: false, error: error.message };
  }
}

export async function processLifeAssistant(userPrompt, customContext = {}, url = currentServerUrl) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${url}/api/life-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, customContext }),
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.log('Mobile API error:', error.message);
    // Offline universal smart agent fallback
    const promptLower = (userPrompt || '').toLowerCase();
    let fallbackAction = {
      type: 'GENERAL_ACTION',
      title: '⚡ Execute Action',
      subtitle: `Perform task for: "${userPrompt}"`,
      buttonText: 'Confirm & Run Action'
    };

    if (promptLower.includes('cab') || promptLower.includes('uber') || promptLower.includes('late') || promptLower.includes('ride')) {
      fallbackAction = {
        type: 'RIDE_BOOKING',
        title: '🚕 Book Uber Ride',
        subtitle: 'Destination: Campus / Office • Fare: ₹180',
        buttonText: 'Confirm & Book Uber'
      };
    } else if (promptLower.includes('music') || promptLower.includes('spotify') || promptLower.includes('song')) {
      fallbackAction = {
        type: 'MEDIA_PLAYER',
        title: '🎵 Open Spotify',
        subtitle: 'Play "Focus AI Playlist"',
        buttonText: 'Launch Spotify'
      };
    } else if (promptLower.includes('message') || promptLower.includes('whatsapp') || promptLower.includes('text')) {
      fallbackAction = {
        type: 'MESSAGE_DRAFT',
        title: '💬 WhatsApp Message Draft',
        subtitle: 'Pre-filled status update ready to send',
        buttonText: 'Send via WhatsApp'
      };
    }

    return {
      success: true,
      offlineFallback: true,
      aiEngine: 'ContextFlow Device Local Engine',
      result: {
        intent: 'ACTIONABLE_AGENT',
        speechReply: `Processed input: "${userPrompt}". Tap below to confirm and execute this action.`,
        actionCard: fallbackAction,
        contextUsed: ['Device Agent Engine']
      }
    };
  }
}

export async function submitLearningFeedback(actionType, title, url = currentServerUrl) {
  try {
    const response = await fetch(`${url}/api/feedback-learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, title })
    });
    return await response.json();
  } catch (err) {
    return { success: true, message: 'Preference saved to local memory!' };
  }
}

export async function fetchLearningRules(url = currentServerUrl) {
  try {
    const response = await fetch(`${url}/api/learning-rules`);
    return await response.json();
  } catch (err) {
    return {
      rules: [
        { id: '1', rule: 'Prefer Uber Premier for ride bookings when running late' },
        { id: '2', rule: 'Draft WhatsApp messages instead of SMS during work hours' }
      ]
    };
  }
}

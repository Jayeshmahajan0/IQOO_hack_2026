/**
 * API Service for communicating with ContextFlow Node.js backend
 */

const DEFAULT_SERVER_URL = 'http://127.0.0.1:5000';

export async function checkServerHealth(serverUrl = DEFAULT_SERVER_URL) {
  try {
    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return { online: false };
    const data = await response.json();
    return { online: true, ...data };
  } catch (error) {
    return { online: false, error: error.message };
  }
}

export async function processVoiceIntent(speechText, clipboardContext = '', appContext = {}, serverUrl = DEFAULT_SERVER_URL) {
  try {
    const response = await fetch(`${serverUrl}/api/process-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        speechText,
        clipboardContext,
        appContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    // Fallback client-side simulation if server is unreachable
    return {
      success: false,
      fallback: true,
      error: error.message,
      result: {
        intent: 'fallback_client',
        confidence: 0.70,
        requiresConfirmation: false,
        summary: `Local Processing (Offline): ${speechText}`,
        entities: {
          speechText,
          clipboardContext,
        },
        actionPayload: {
          type: 'DISPLAY_INFO',
          content: `Offline mode: ${speechText}`
        }
      }
    };
  }
}

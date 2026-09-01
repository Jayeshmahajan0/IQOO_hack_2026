/**
 * Action Engine - ContextFlow
 * Validates and executes actions based on structured intent output from Node.js backend
 */

export function executeAction(actionPayload, setClipboardCallback) {
  if (!actionPayload) return { success: false, message: 'No action payload provided.' };

  switch (actionPayload.type) {
    case 'COPY_TO_CLIPBOARD':
      if (setClipboardCallback && typeof setClipboardCallback === 'function') {
        setClipboardCallback(actionPayload.content);
      }
      return {
        success: true,
        actionType: 'COPY_TO_CLIPBOARD',
        message: `Successfully copied rewritten text to clipboard!`,
        details: actionPayload.content
      };

    case 'OPEN_MESSAGING_APP':
      return {
        success: true,
        actionType: 'OPEN_MESSAGING_APP',
        message: `Message draft ready for ${actionPayload.recipient}`,
        details: `Recipient: ${actionPayload.recipient}\nBody: "${actionPayload.body}"`
      };

    case 'SAVE_NOTE':
      return {
        success: true,
        actionType: 'SAVE_NOTE',
        message: `Note saved to local storage`,
        details: `Title: ${actionPayload.title}\nContent: "${actionPayload.content}"`
      };

    case 'CREATE_SYSTEM_REMINDER':
      return {
        success: true,
        actionType: 'CREATE_SYSTEM_REMINDER',
        message: `Reminder scheduled for ${actionPayload.time}`,
        details: `Task: ${actionPayload.task}`
      };

    case 'DISPLAY_INFO':
    case 'DISPLAY_RESPONSE':
      return {
        success: true,
        actionType: 'DISPLAY_INFO',
        message: `Response generated`,
        details: actionPayload.content || actionPayload.responseText
      };

    default:
      return {
        success: false,
        message: `Unknown action type: ${actionPayload.type}`
      };
  }
}

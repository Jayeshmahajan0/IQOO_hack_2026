/**
 * Context Service - ContextFlow
 * Manages clipboard context reading and simulated active application screen context
 */

let mockClipboardText = "Hey bro, here are the project notes for ContextFlow: We need to finalize the voice pipeline and test intent execution by 5 PM.";
let activeApp = "WhatsApp / Messages";

export const getClipboardContext = async () => {
  return mockClipboardText;
};

export const setMockClipboardContext = (text) => {
  mockClipboardText = text;
};

export const getActiveAppContext = () => {
  return {
    appName: activeApp,
    selectedText: mockClipboardText,
    screenState: "Active Chat Screen"
  };
};

export const setActiveApp = (appName) => {
  activeApp = appName;
};

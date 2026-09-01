/**
 * Universal Learning Store & Multi-Modal Context Engine - ContextFlow
 */

const activeContext = {
  location: "Sector 62, Noida, UP",
  calendar: {
    event: "Team Standup / Lecture",
    time: "10:00 AM",
    location: "Campus Hall B"
  },
  deviceState: {
    battery: "82%",
    network: "Wi-Fi Connected",
    activeApp: "ContextFlow AI"
  },
  clipboard: "Check out the new AI prototype repo"
};

let learnedRules = [
  {
    id: "rule_1",
    rule: "Prefer Uber Premier for ride bookings when running late",
    source: "Learned from past ride choices",
    confidence: 0.95,
    timestamp: new Date().toISOString()
  },
  {
    id: "rule_2",
    rule: "Draft WhatsApp messages instead of SMS during work hours",
    source: "Learned from communication habits",
    confidence: 0.92,
    timestamp: new Date().toISOString()
  }
];

let conversationHistory = [];

module.exports = {
  getActiveContext: () => activeContext,
  getLearnedRules: () => learnedRules,
  addLearnedRule: (ruleText, trigger) => {
    const ruleObj = {
      id: `rule_${Date.now()}`,
      rule: ruleText,
      source: `Learned from trigger: "${trigger}"`,
      confidence: 0.95,
      timestamp: new Date().toISOString()
    };
    learnedRules.unshift(ruleObj);
    return ruleObj;
  },
  logConversation: (userPrompt, aiResponse) => {
    conversationHistory.push({
      timestamp: new Date().toISOString(),
      userPrompt,
      aiResponse
    });
  }
};

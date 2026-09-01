/**
 * Learning Store - ContextFlow Autonomous Agent Memory
 * Tracks active real-time context, decision history, and learned user rules.
 */

const currentContext = {
  location: "Home (Sector 62, Noida)",
  calendar: {
    event: "Mobile Computing Lecture",
    location: "Campus Hall B",
    startTime: "10:00 AM",
    timeUntilEvent: "32 mins"
  },
  traffic: {
    metroStatus: "Blue Line delayed by 20 mins (Station crowd high)",
    cabStatus: "Uber/Ola available nearby (11 mins faster than Metro)",
    normalRoute: "Metro (Takes 28 mins)"
  },
  clipboard: "Hey, are you coming to college today?",
  preferences: {
    defaultTransport: "Metro",
    delayThresholdForCabMinutes: 15
  }
};

let learnedRules = [
  {
    id: "rule_1",
    rule: "Choose Cab over Metro when Metro delay exceeds 15 minutes",
    source: "Learned from past commute decisions",
    confidence: 0.94,
    created: new Date().toISOString()
  },
  {
    id: "rule_2",
    rule: "Pre-draft concise messages when running late for scheduled events",
    source: "Learned from past messaging choices",
    confidence: 0.88,
    created: new Date().toISOString()
  }
];

let decisionHistory = [];

module.exports = {
  getCurrentContext: () => currentContext,
  
  getLearnedRules: () => learnedRules,
  
  addLearnedRule: (newRuleText, contextTrigger) => {
    const ruleObj = {
      id: `rule_${Date.now()}`,
      rule: newRuleText,
      source: `Learned from trigger: "${contextTrigger}"`,
      confidence: 0.95,
      created: new Date().toISOString()
    };
    learnedRules.unshift(ruleObj);
    return ruleObj;
  },

  logDecision: (entry) => {
    decisionHistory.unshift({
      id: `decision_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
  },

  getDecisionHistory: () => decisionHistory
};

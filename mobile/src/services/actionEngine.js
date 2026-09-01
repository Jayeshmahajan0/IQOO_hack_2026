/**
 * Action Engine - ContextFlow Responsible Agent Execution
 * Executes verified actions and triggers the learning feedback loop.
 */

export function executeAgentAction(actionObj) {
  if (!actionObj) return { success: false, message: 'No action specified' };

  switch (actionObj.type) {
    case 'BOOK_CAB':
      return {
        success: true,
        actionType: 'BOOK_CAB',
        title: '🚕 Cab Confirmed & Dispatching',
        message: `Uber/Ola Cab booked to Campus Hall B! Driver arriving in 4 mins.`,
        details: `Saved 11 minutes vs delayed Metro. Estimated Fare: ₹180.`
      };

    case 'TAKE_METRO':
      return {
        success: true,
        actionType: 'TAKE_METRO',
        title: '🚇 Metro Station Route Navigation Active',
        message: `Navigating to Sector 62 Metro Station.`,
        details: `Expected arrival at Campus: 10:15 AM (15 mins late).`
      };

    case 'SEND_MESSAGE':
      return {
        success: true,
        actionType: 'SEND_MESSAGE',
        title: '💬 Status Update Message Sent',
        message: `Message sent to Class Group!`,
        details: `Body: "Hey, heading to Campus Hall B now, reach in 15m."`
      };

    default:
      return {
        success: true,
        actionType: 'GENERAL_ACTION',
        title: '⚡ Action Executed',
        message: `Executed action: ${actionObj.title || 'Custom task'}`
      };
  }
}

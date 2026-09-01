/**
 * Multi-Modal Context Service - ContextFlow
 * Integrates Location, Calendar, Traffic, and Clipboard state
 */

let activeContextState = {
  location: "Sector 62, Noida",
  calendar: {
    event: "Mobile Computing Lecture",
    location: "Campus Hall B",
    startTime: "10:00 AM",
    timeUntilEvent: "32 mins"
  },
  traffic: {
    metroStatus: "Blue Line delayed 20 mins",
    cabStatus: "Cab 11 mins faster",
    delayMinutes: 20
  },
  clipboard: "Hey, are you reaching class on time today?"
};

export const getFusedContext = () => activeContextState;

export const updateContextLocation = (newLoc) => {
  activeContextState.location = newLoc;
};

export const updateContextTraffic = (delayMinutes) => {
  activeContextState.traffic.delayMinutes = delayMinutes;
  activeContextState.traffic.metroStatus = `Blue Line delayed ${delayMinutes} mins`;
};

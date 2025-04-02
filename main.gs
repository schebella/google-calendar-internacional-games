// --- Functions to retrieve match data from RapidAPI ---

// Returns past matches
function getLastMatches() {
  var url = "https://sofascore.p.rapidapi.com/teams/get-last-matches?teamId=1966&pageIndex=0";
  var options = {
    "method": "get",
    "headers": {
      "x-rapidapi-key": "YOUR_RAPIDAPI_KEY", // Replace with your actual RapidAPI key
      "x-rapidapi-host": "sofascore.p.rapidapi.com"
    },
    "muteHttpExceptions": true
  };
  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

// Returns upcoming matches
function getNextMatches() {
  var url = "https://sofascore.p.rapidapi.com/teams/get-next-matches?teamId=1966&pageIndex=0";
  var options = {
    "method": "get",
    "headers": {
      "x-rapidapi-key": "YOUR_RAPIDAPI_KEY", // Replace with your actual RapidAPI key
      "x-rapidapi-host": "sofascore.p.rapidapi.com"
    },
    "muteHttpExceptions": true
  };
  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

// Combines past and upcoming matches
function getAllMatches() {
  var lastMatchesData = getLastMatches();
  var nextMatchesData = getNextMatches();
  var events = [];
  
  if (lastMatchesData.events && lastMatchesData.events.length > 0) {
    events = events.concat(lastMatchesData.events);
  }
  if (nextMatchesData.events && nextMatchesData.events.length > 0) {
    events = events.concat(nextMatchesData.events);
  }
  return events;
}

// Filters events to only include those from the current year
function filterMatchesCurrentYear(events) {
  var currentYear = new Date().getFullYear();
  return events.filter(function(match) {
    var matchDate = match.startTimestamp ? new Date(match.startTimestamp * 1000) : null;
    return matchDate && matchDate.getFullYear() === currentYear;
  });
}

// Optional test function to log current year's matches
function parseCurrentYearMatches() {
  var allEvents = getAllMatches();
  var currentYearEvents = filterMatchesCurrentYear(allEvents);
  
  Logger.log("Total events obtained: " + allEvents.length);
  Logger.log("Current year events: " + currentYearEvents.length);
  
  currentYearEvents.forEach(function(match, index) {
    var homeTeam = match.homeTeam ? match.homeTeam.name : "N/A";
    var awayTeam = match.awayTeam ? match.awayTeam.name : "N/A";
    var homeScore = (match.homeScore && match.homeScore.display !== undefined) ? match.homeScore.display : "";
    var awayScore = (match.awayScore && match.awayScore.display !== undefined) ? match.awayScore.display : "";
    var championship = (match.tournament && match.tournament.name) ? match.tournament.name : "N/A";
    
    var title = (homeScore !== "" && awayScore !== "") ? 
                homeTeam + " " + homeScore + " x " + awayScore + " " + awayTeam :
                homeTeam + " vs " + awayTeam;
    title = title + " (" + championship + ")";
    
    var startTimestamp = match.startTimestamp;
    var matchDate = startTimestamp ? new Date(startTimestamp * 1000) : "Date not available";
    
    Logger.log("Event " + (index + 1) + ": " + title + " | Date: " + matchDate);
  });
}

// --- Function to integrate events with Google Calendar using the Advanced Calendar API ---
// All events will be created/updated with red color (colorId "11") and a fixed description that includes the matchId.
// The fixed description format:
// "Desenvolvido por Matheus Schebella
//  matheus.schebella@gmail.com
//  matchId:<match id>"
function createOrUpdateCalendarEvents() {
  var calendarId = "YOUR_CALENDAR_ID"; // Replace with your actual Calendar ID
  var allEvents = getAllMatches();
  var currentYearEvents = filterMatchesCurrentYear(allEvents);
  
  currentYearEvents.forEach(function(match) {
    var homeTeam = match.homeTeam ? match.homeTeam.name : "N/A";
    var awayTeam = match.awayTeam ? match.awayTeam.name : "N/A";
    var homeScore = (match.homeScore && match.homeScore.display !== undefined) ? match.homeScore.display : "";
    var awayScore = (match.awayScore && match.awayScore.display !== undefined) ? match.awayScore.display : "";
    var championship = (match.tournament && match.tournament.name) ? match.tournament.name : "N/A";
    
    var title = (homeScore !== "" && awayScore !== "") ?
      homeTeam + " " + homeScore + " x " + awayScore + " " + awayTeam :
      homeTeam + " vs " + awayTeam;
    title = title + " (" + championship + ")";
    
    var startTimestamp = match.startTimestamp;
    var matchDate = startTimestamp ? new Date(startTimestamp * 1000) : null;
    if (!matchDate) {
      Logger.log("Date not available for match id: " + match.id);
      return;
    }
    var endTime = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000); // Default duration of 2 hours
    
    // Set event color to red (colorId "11")
    var eventColorId = "11";
    
    // Define the fixed description with the matchId
    var descriptionText = "Desenvolvido por Matheus Schebella\nmatheus.schebella@gmail.com\nmatchId:" + match.id;
    
    // Identify the event uniquely using extended properties (private.matchId)
    // List events for the day using the Advanced API
    var dayStart = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
    var dayEnd = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate() + 1);
    var listResponse = Calendar.Events.list(calendarId, {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString()
    });
    var eventFound = null;
    if (listResponse.items) {
      for (var i = 0; i < listResponse.items.length; i++) {
        var ev = listResponse.items[i];
        if (ev.extendedProperties && ev.extendedProperties.private && ev.extendedProperties.private.matchId === String(match.id)) {
          eventFound = ev;
          break;
        }
      }
    }
    
    if (eventFound) {
      // Update the event if the title, color, or description differ
      if (eventFound.summary !== title || eventFound.colorId !== eventColorId || eventFound.description !== descriptionText) {
        var patchResource = {
          summary: title,
          colorId: eventColorId,
          description: descriptionText,
          extendedProperties: {
            private: {
              matchId: String(match.id)
            }
          }
        };
        Calendar.Events.patch(patchResource, calendarId, eventFound.id);
        Logger.log("Event updated: " + title + " with color " + eventColorId);
      }
    } else {
      // Create a new event
      var eventResource = {
        summary: title,
        start: { dateTime: matchDate.toISOString() },
        end: { dateTime: endTime.toISOString() },
        description: descriptionText,
        colorId: eventColorId,
        extendedProperties: {
          private: {
            matchId: String(match.id)
          }
        }
      };
      var createdEvent = Calendar.Events.insert(eventResource, calendarId);
      Logger.log("Event created: " + createdEvent.summary + " with color " + eventColorId);
    }
  });
}

// --- Function to update the default calendar color using the Advanced Calendar API ---
// This sets the default color of the calendar (note that each user may personalize their view)
function updateCalendarColor() {
  var calendarId = "YOUR_CALENDAR_ID"; // Replace with your actual Calendar ID
  var calendarResource = {
    colorId: "11"
  };
  Calendar.Calendars.patch(calendarResource, calendarId);
  Logger.log("Calendar default color updated to colorId 11.");
}

// --- Function to retrieve and log the calendar color (using CalendarList) ---
function getCalendarColor() {
  var calendarId = "YOUR_CALENDAR_ID"; // Replace with your actual Calendar ID
  var calListEntry = Calendar.CalendarList.get(calendarId);
  Logger.log("Calendar ColorId: " + calListEntry.colorId);
  return calListEntry.colorId;
}

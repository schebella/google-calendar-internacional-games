# Google Calendar Internacional Games

This project is a Google Apps Script solution that integrates Sport Club Internacional's match data into Google Calendar. It retrieves both past and upcoming match data from the Sofascore API via RapidAPI and automatically creates or updates calendar events accordingly. Each event includes a standardized description that shows your developer information along with a unique match ID for tracking.

## Features

- **Match Data Retrieval:**  
  Retrieves both past and upcoming match data using the Sofascore API via RapidAPI.

- **Current Year Filter:**  
  Filters matches to display only those from the current year.

- **Automated Calendar Events:**  
  Automatically creates or updates events in Google Calendar:
  - **Event Title:** Displays match details including teams, scores, and championship.
  - **Event Description:** Displays the following text:
    ```
    Desenvolvido por Matheus Schebella
    matheus.schebella@gmail.com
    matchId:<ID of the match>
    ```
  - **Extended Properties:** Uses Google Calendar's extended properties to store the matchId for unique identification.

## Getting Started

### Prerequisites

- A Google Account.
- A Google Apps Script project.
- Access to the [Google Calendar API](https://developers.google.com/calendar) (enable advanced services in your Apps Script project and activate the API in the Google Cloud Console).
- A RapidAPI account with access to the Sofascore API.
- The team ID for Sport Club Internacional (this project uses `1966`).

### Setup

 **Configure Your Google Apps Script Project:**
   - Copy the contents of `Código.gs` into your Google Apps Script project.
   - Enable **Calendar API** in **Resources > Advanced Google Services**.
   - In the Google Cloud Console, make sure the Calendar API is enabled.
   - Replace placeholder values (such as your RapidAPI key) with your actual credentials.

### Deployment

- **Testing:**  
  Run `parseCurrentYearMatches()` in your Apps Script editor to see a summary of matches in the logs.

- **Event Synchronization:**  
  Run `createOrUpdateCalendarEvents()` to create or update the match events in your Google Calendar.

- **Cleanup (Optional):**  
  Run `deleteOldEvents()` to remove events that still have the old description format.

- **Automation:**  
  Set up a trigger in Google Apps Script to run `createOrUpdateCalendarEvents()` periodically (e.g., every hour) so that your calendar remains updated.

## Project Structure


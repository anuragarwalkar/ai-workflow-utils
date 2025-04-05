# ai-tester-jira-reporter

This application automates the process of creating Jira tickets, adding attachments, and viewing Jira tickets.

![image](https://github.com/user-attachments/assets/579559bb-6868-4ae5-8cd2-7a64ca345fe0)
![image](https://github.com/user-attachments/assets/4bfaf36d-428e-4009-ad03-1ab215662abb)
![image](https://github.com/user-attachments/assets/438cab5d-f7b7-4dde-b8b9-ef4ff1d6d2de)

## Prerequisites

- Install [Ollama](https://ollama.com/) on your system.
  ```bash
  brew install ollama
  ```
- Ensure you have a Jira account and access to the Jira API.

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd jira-automation
   ```

2. Rename the `.env.example` file to `.env`:
   ```bash
   mv .env.example .env
   ```

3. Update the `.env` file with your Jira URL and API token:
   ```
   JIRA_URL=<your-jira-url>
   JIRA_API_TOKEN=<your-jira-api-token>
   ```
   > **Note**: Ensure you retrieve your Jira API token from your Jira environment.

4. Install dependencies:
   ```bash
   npm install
   ```

5. Run the application:
   ```bash
   npm start
   ```

6. Run LLaVA using Ollama:
   ```bash
   ollama run llava
   ```

## Features

- **Create Jira Tickets**: Automate the creation of Jira tickets with relevant details.
- **Add Attachments**: Attach files to Jira tickets directly from the app.
- **View Jira Tickets**: Retrieve and display Jira ticket details.

## Notes

- Ensure your Jira account has the necessary permissions to create tickets and add attachments.
- The application uses the Jira REST API for all operations.

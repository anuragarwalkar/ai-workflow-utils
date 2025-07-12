# ai-workflow-utils

<img width="1512" height="777" alt="image" src="https://github.com/user-attachments/assets/ed5e180a-da5b-4856-b984-e3c9c1bd58e4" />
<img width="1510" height="780" alt="image" src="https://github.com/user-attachments/assets/95ced2b4-d64b-4a5e-84d0-92362b414ea2" />
<img width="1511" height="778" alt="image" src="https://github.com/user-attachments/assets/134b3acd-7ff4-43b5-9397-2f4811be446c" />
<img width="1512" height="774" alt="image" src="https://github.com/user-attachments/assets/909afe74-5348-4c6b-82f0-e7ff0bc60cf2" />
<img width="1511" height="780" alt="image" src="https://github.com/user-attachments/assets/6781d64d-542d-4253-8e5b-00c10b436c7c" />

This application automates the process of creating Jira tickets, adding attachments, and viewing Jira tickets.

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

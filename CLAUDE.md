# LangGraph Slack Integration - Project Context

## Project Overview
This project integrates LangGraph AI assistants with Slack, allowing users to interact with LangGraph-powered AI assistants directly through Slack. The integration supports direct messages, channel mentions, threaded replies, and a Slack Home app interface.

## Key Components
- **Flask Web Server**: Handles Slack events and webhooks
- **LangGraph Client**: Communicates with LangGraph assistants
- **Slack Bolt App**: Processes Slack interactions and messages
- **Logging System**: Structured logging with file rotation and web UI

## Critical Environment Variables
- `SLACK_BOT_TOKEN`: Slack Bot OAuth token
- `SLACK_SIGNING_SECRET`: Slack app signing secret
- `LANGGRAPH_URL`: URL of the LangGraph deployment
- `LANGGRAPH_ASSISTANT_ID`: ID of the LangGraph assistant
- `LANGGRAPH_API_KEY`: API key for LangGraph 
- `DEPLOYMENT_URL`: Public URL for webhooks (ngrok or server)
- `DEBUG_MODE`: Set to "true" for detailed logging (default: "false")
- `LOG_LEVEL`: Override default logging level (default: "INFO" or "DEBUG" based on DEBUG_MODE)

## Key Endpoints
- `/slack/events`: Receive Slack events and interactive components
- `/slack/interactive`: Handle interactive components like buttons and modals
- `/callbacks/<thread_id>`: Receive LangGraph webhook callbacks
- `/update-url`: Update the deployment URL without restarting
- `/url-check`: Check the current deployment URL
- `/health`: Health check endpoint
- `/logs`: View application logs through web UI
- `/logs/all`: List all available log files
- `/logs/download`: Download log files

## Important Code Architecture
- `server.py`: Core server functionality with message handling
- `flask_app.py`: Flask implementation with routes and request handling
- `config.py`: Configuration and environment variables
- `logging_setup.py`: Centralized logging configuration

## Critical Functions
- `_get_thread_id()`: Creates consistent thread IDs for conversations
- `_build_contextual_message()`: Builds context-aware messages for the AI
- `process_message()`: Processes messages and sends to LangGraph
- `direct_process_callback()`: Processes callbacks from LangGraph
- `handle_assistant_selection()`: Processes assistant dropdown selection
- `handle_interactive_component()`: Direct handler for form-encoded payloads

## Key Issues & Solutions
1. **Webhook URL Management**: 
   - Use `get_deployment_url()` to get fresh URL from environment
   - Fixed double-slash issue with URL path joining
   - `/update-url` endpoint to update URL without restarting

2. **Conversation Context**: 
   - For DMs, use channel ID + timestamp to maintain separate conversation threads
   - For threads, use thread timestamp for context
   - Home app interactions are marked with special metadata

3. **Async/Event Loop Issues**:
   - Create fresh event loops for each thread
   - Properly cancel pending tasks before closing event loops
   - Close loops properly with `shutdown_asyncgens()`
   - Create new LangGraph clients for each request

4. **Slack Home App**:
   - Home tab with interactive assistant selection dropdown in "actions" block
   - Messages tab with button for submitting requests via modal
   - Clear separation between "home" and "messages" tab handling
   - State persistence for user's selected assistant
   - Home UI automatically updates to reflect selections
   
5. **Slack Request Verification**:
   - Bypass Slack's signature verification for form-encoded payloads
   - Direct handling of interactive components without Bolt middleware
   - Custom implementation for dropdown selection

6. **Logging System**:
   - Rotating log files with timestamps
   - Log levels controlled via environment variables
   - Web UI for viewing and filtering logs
   - Structured logging for requests/responses

## Slack Message Payloads
- Every Slack event contains:
  - `channel`: Channel ID (e.g., "D08FGNKTE7R" for DMs)
  - `ts`: Unique timestamp for each message (e.g., "1741107542.455209")
  - `channel_type`: Type of channel ("im" for direct messages)

- For threaded messages:
  - `thread_ts`: Parent message timestamp 
  - `parent_user_id`: User who started the thread

- Home app interactions:
  - Marked with custom `is_home_app_interaction: true` flag
  - Given unique `home_interaction_id` for tracking
  - Interactive components come as form-encoded `payload` parameter

## Thread ID Generation Strategy
- DMs: `UUID5(NAMESPACE_DNS, f"SLACK:DM-{channel}-{timestamp}")`
- Thread replies: Uses parent thread timestamp for continuity
- Channel messages: Uses message timestamp
- Home app: Includes special timestamp and metadata

## Testing Commands
- Test conversation memory: Send a message and then a follow-up like "what was that result again?"
- Test separate DM threads: Send unrelated messages in the same DM channel
- Test home app: Open app home tab, select an assistant type
- Test interactive components: Use the dropdown in home tab to select different assistants
- Update ngrok URL: `curl -X POST http://localhost:8080/update-url -H "Content-Type: application/json" -d '{"url":"https://new-ngrok-url.ngrok-free.app"}'`
- View logs: Open `/logs` in browser
- Filter logs: Use `/logs?filter=langgraph` to find specific log entries

## Development Tips
- Run with: `python -m langgraph_slack.flask_app`
- Set `DEBUG_MODE=true` for more verbose logging
- Check `/logs` for detailed request/response information
- Monitor thread IDs in logs to ensure consistency
- Check signing verification errors if interactive components fail
- Use `/logs?filter=error` to find problems quickly
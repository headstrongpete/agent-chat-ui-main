# Agent Chat UI: Comprehensive Design Document

## 1. System Overview

### Project Description
Agent Chat UI is a React-based interface for interacting with LangGraph servers. It provides an intuitive chat experience for users to communicate with AI assistants through a feature-rich UI that visualizes all aspects of agent interactions.

### Key Features
- **Interactive Chat Interface**: Stream-based messaging with AI assistants
- **Tool Call Visualization**: Rendering and management of AI tool calls
- **Agent Interaction**: Support for interrupting and modifying agent actions
- **LangGraph Integration**: Connect to any LangGraph server with a 'messages' key
- **User Authentication**: JWT-based auth system with role-based access control
- **Agent Selection System**: Admin controls for managing available agents
- **Starter Questions**: Configurable suggested questions for each agent to kickstart conversations

### Architectural Overview
The application consists of:
1. **Frontend**: React 19 + TypeScript application with Tailwind CSS and Radix UI components
2. **Authentication Backend**: Node.js Express service with MongoDB for user and agent data storage
3. **External Integration**: LangGraph servers for AI assistant capabilities

## 2. Frontend Architecture

### Core Components
- **Thread Component**: Main chat interface for message display and interaction
- **Message Components**: Specialized renderers for different message types (AI, human, tool calls)
- **Agent Inbox**: Components for managing agent interactions and tool calls
- **Configuration Page**: Interface for setting up connections to LangGraph servers
- **Agent Manager**: Admin interface for managing available agents

### Provider Structure
The application uses React context providers for state management:
- **AuthProvider**: Manages authentication state and user information
- **StreamProvider**: Handles connections to LangGraph servers
- **ThreadProvider**: Manages chat thread state and history

### Routing Structure
```
/                   - Welcome Page with login form
/config             - Configuration Page (admin only)
/chat               - Chat Page with Thread component
```

### State Management
- JWT token stored in localStorage for authentication
- URL parameters for connection configuration
- Context-based state management for shared application state

## 3. Authentication System

### Authentication Flow
1. User logs in with username and password
2. Backend validates credentials and returns JWT token
3. Token is stored in localStorage
4. Authenticated API requests include the token in Authorization header
5. Protected routes check for valid authentication

### User Model
```javascript
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
}, { timestamps: true });
```

### Role-Based Access Control
- **Admin Role**: Full access to configuration and agent management
- **User Role**: Access to chat functionality with predefined configurations
- Access control implemented through middleware and role-based route components

### Backend API Endpoints
```
POST /api/auth/login  - Authenticate user and get JWT token
GET  /api/auth/me     - Get current user information
POST /api/auth/logout - Invalidate session
```

### Security Measures
- Password hashing with bcrypt
- JWT expiration after 24 hours
- Rate limiting on authentication endpoints
- Protected routes with authentication middleware
- Role-based authorization checks

## 4. Agent Selector System

### Agent Model
```javascript
const agentSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  graphName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  assistantId: {
    type: String,
    required: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  starterQuestions: {
    type: [String],
    default: [],
    validate: [
      {
        validator: function(v) {
          return v.length <= 6;
        },
        message: props => 'An agent can have a maximum of 6 starter questions.'
      }
    ]
  }
}, { timestamps: true });
```

### Admin Management Interface
- **Agent Table**: List all available agents with management options
- **Agent Form**: Create and edit agent configurations
- **LangGraph Integration**: Fetch available agents from LangGraph endpoints
- **Starter Questions Manager**: Interface for configuring up to 6 starter questions per agent

### Agent Selection Workflow
1. Admin creates and configures agents in the admin interface
2. Admin adds starter questions to help users begin conversations
3. Active agents are available to users in the agent selector dropdown
4. Selected agent's ID is used as the `assistantId` URL parameter
5. Thread component uses this parameter to communicate with the appropriate LangGraph assistant
6. Starter questions are displayed to users at the beginning of a conversation

### Backend API Endpoints
```
GET    /api/agents           - Get all agents (paginated)
POST   /api/agents           - Create a new agent
GET    /api/agents/:id       - Get agent by ID
PUT    /api/agents/:id       - Update an agent
DELETE /api/agents/:id       - Delete an agent
PATCH  /api/agents/:id/status - Toggle agent active status
POST   /api/agents/available - Fetch available agents from LangGraph
```

## 5. Configuration Management

### Configuration Parameters
- **API URL**: URL of the LangGraph server
- **Assistant ID**: ID of the graph/assistant (can be name or UUID)
- **API Key**: Authentication key for LangGraph server

### Storage Strategy
- URL parameters for sharing configurations: `?apiUrl=...&assistantId=...`
- localStorage for persistent configuration
- User-specific configuration in DB (future enhancement)

### Configuration Flow
1. Check URL parameters first
2. Fall back to localStorage values
3. Use default values as final fallback
4. Synchronize between URL parameters and localStorage

### Default Configuration
```javascript
const DEFAULT_CONFIG = {
  apiUrl: "https://ht-gargantuan-mountain-26-34792ec4a0105801868c7fe930ce140e.us.langgraph.app",
  assistantId: "agent",
};
```

### Role-Based Configuration
- **Admin Users**: Configure settings through the config page
- **Regular Users**: Use default configuration or admin-provided settings
- Config page restricted to admin users only

## 6. Role-Based Routing

### User Journey Based on Role
- **Admin Journey**: Login → Config Page → Chat Page
- **User Journey**: Login → Chat Page (with auto-configuration)

### Implementation
- RoleBasedRoute component that extends ProtectedRoute
- Configuration auto-loading for regular users
- Redirection based on user role after login

### Auto-Configuration for Users
- Default configuration applied automatically
- User-specific configurations from localStorage
- Graceful fallback to defaults when needed

### Navigation Flow
```
Admin login → /config → Configure → Continue → /chat
User login → /chat (with auto-configuration)
```

## 7. Thread & Chat Implementation

### Thread Component Structure
- Message history display
- Input area for user messages
- Tool call visualization
- Agent state display
- Thread action controls

### Message Types
- Human messages
- AI assistant messages
- Tool call messages with results
- State visualization

### Tool Call Handling
- Rendered in structured tables
- Support for interrupting ongoing tool calls
- Visualization of tool call results

### LangGraph Integration
- Stream-based communication with LangGraph server
- Real-time message updates
- Tool call execution and result handling
- Agent state tracking

## 8. Deployment & Environment

### Development Environment
```
// Frontend
pnpm dev            - Run development server 
pnpm build          - Build for production
pnpm lint           - Run ESLint
pnpm format         - Format code with Prettier

// Auth Service
npm run dev         - Run auth service backend
```

### Environment Variables
```
// Server
PORT=4000
NODE_ENV=development

// MongoDB
MONGODB_URI=mongodb://localhost:27017/agent-chat-auth

// JWT
JWT_SECRET=your_jwt_secret_key

// Frontend
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### Connection Requirements
- Deployment URL for LangGraph server
- Assistant/Graph ID for the specific assistant
- LangSmith API Key for authentication (optional)

## 9. Current Issues & Next Steps

### Latest Enhancements (2025-03-19)

1. **Enhanced Chat Interface**:
   - Streamlined message input with Enter key submission
   - Removed explicit Send button for cleaner interface
   - Added voice input placeholder (UI only, functionality pending)
   - Improved loading state indicators
   - Removed cancel functionality during message streaming

2. **Thread History Improvements**:
   - Implemented chronological grouping of threads
   - Added automatic thread timestamp updates on interaction
   - Groups: Today, Yesterday, Previous 7 Days, Previous 30 days, Monthly, Yearly
   - Real-time thread position updates when messages are sent/edited

3. **Message Input Enhancements**:
   - Single-line input with dynamic height adjustment
   - Shift+Enter support for multi-line messages
   - Improved placeholder text with usage instructions
   - Integrated loading spinner in input area
   - Right-aligned action buttons (voice, loading indicator)

4. **Tool Call Management**:
   - Simplified "Hide Tool Calls" toggle placement
   - Improved toggle state persistence
   - Better visual integration with chat interface

### UI/UX Considerations

1. **Input Area Design**:
   ```typescript
   // Key components in input area
   - Textarea with dynamic height
   - Voice button (right-aligned)
   - Loading indicator (replaces voice button during streaming)
   - "Hide Tool Calls" toggle (below input)
   ```

2. **Thread History Organization**:
   ```typescript
   interface ThreadGroup {
     title: string;      // Group header (e.g., "Today", "Yesterday")
     threads: Thread[];  // Threads in this time period
   }
   ```

3. **Timestamp Management**:
   - Automatic updates on:
     * New message sent
     * Message edited
     * AI response received
     * Tool call completed
   - Custom event system for thread updates
   - Optimistic updates for better UX

4. **Mobile Responsiveness**:
   - Adaptive layout for different screen sizes
   - Touch-friendly input controls
   - Collapsible thread history on mobile
   - Proper keyboard handling for mobile devices

### Performance Optimizations

1. **Event Handling**:
   - Debounced thread updates
   - Optimized Enter key handling
   - Efficient form submission
   - Memory leak prevention in event listeners

2. **State Management**:
   ```typescript
   // Key state considerations
   - Input value management
   - Loading states
   - Thread history updates
   - Tool call visibility
   ```

3. **Thread History Updates**:
   - Efficient timestamp comparisons
   - Minimal re-renders
   - Optimistic UI updates
   - Proper cleanup of event listeners

### Security Considerations

1. **Input Validation**:
   - Message content sanitization
   - Maximum message length limits
   - Rate limiting for message submission
   - Protection against script injection

2. **Event System**:
   - Scoped event listeners
   - Proper event cleanup
   - Protected event dispatch
   - Validation of event data

### Accessibility Improvements

1. **Keyboard Navigation**:
   - Enter key submission
   - Shift+Enter for new lines
   - Proper focus management
   - Keyboard shortcuts for common actions

2. **Screen Readers**:
   - ARIA labels for buttons
   - Status announcements
   - Loading state indicators
   - Proper heading hierarchy

3. **Visual Accessibility**:
   - Sufficient color contrast
   - Clear focus indicators
   - Proper text sizing
   - Loading state visibility

### Future Considerations

1. **Voice Input Implementation**:
   - Browser API integration
   - Speech-to-text processing
   - Language selection
   - Error handling
   - Fallback mechanisms

2. **Enhanced Thread Management**:
   - Thread archiving
   - Favorites/pinned threads
   - Search within time periods
   - Custom grouping options

3. **Performance Enhancements**:
   - Virtual scrolling for long threads
   - Lazy loading of thread history
   - Optimized timestamp calculations
   - Cached group calculations

4. **Mobile Enhancements**:
   - Native voice input integration
   - Touch gesture support
   - Mobile-optimized layouts
   - Offline support

### Immediate Next Steps
1. Fix authentication token issues
2. Resolve port conflicts
3. Implement configuration management improvements
4. Complete agent selector implementation
5. Finalize role-based access control

### Future Enhancements
1. Backend storage for user configurations
2. Enhanced agent management features
3. Multi-assistant conversations
4. More granular role permissions
5. Advanced tool call visualization
6. Analytics for starter question usage to optimize conversation starters
7. Personalized starter questions based on user history and preferences

## 10. Technical Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT, bcrypt
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom components
- **API Communication**: Axios, Fetch API
- **Deployment**: Containerized deployment (planned)

## 11. Development Guidelines

### Code Style
- TypeScript with strict typing
- React functional components with hooks
- Context-based state management
- Tailwind CSS for styling

### Testing Strategy
- Unit tests for core components
- Integration tests for API endpoints
- End-to-end tests for critical workflows

### Security Considerations
- HTTPS for all communications
- JWT stored securely
- Input validation on all endpoints
- Rate limiting for sensitive operations
- No hardcoded secrets or credentials

## 12. Starter Questions Feature

### Purpose
Enhance the chat experience by providing users with suggested conversation starters tailored to each agent's capabilities.

### Implementation Strategy
- **Phased Deployment**: 
  1. Backend implementation first: MongoDB schema update with validation
  2. Frontend implementation after backend deployment is complete
  3. Chat interface integration as final step
- **Character Limit**: 150 characters maximum per starter question
- **Admin Configuration**: Up to 6 configurable starter questions per agent
- **Data Storage**: Array of strings in the agent document
- **No Analytics**: Analytics tracking not required at this stage

### UI Design
- **Empty State**: Visual prompt to add questions with "+ Add Question" button
- **Question List**: Each question as a row with input field and delete button
- **Chat Display**: 
  - Grid of clickable question cards at the start of a conversation
  - Questions completely disappear once the first message is sent
  - No UI elements shown if no starter questions are present
- **Responsive Layout**: Single column on mobile, dual column on desktop

### Backend Schema Update
```javascript
starterQuestions: {
  type: [String],
  default: [],
  validate: [
    {
      validator: function(v) {
        return v.length <= 6;
      },
      message: props => 'An agent can have a maximum of 6 starter questions.'
    }
  ]
}
```

### Usage Flow
1. Admin configures starter questions in the Agent Form
2. When a user starts a chat with an agent, suggested questions appear (if configured)
3. User can click a question to automatically fill the input field
4. After sending the first message, starter questions disappear completely
5. If no starter questions have been configured, no UI element is displayed
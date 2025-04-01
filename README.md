# Agent Chat UI

[![CI](https://github.com/langchain-ai/agent-chat-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/langchain-ai/agent-chat-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

Agent Chat UI is a Vite + React application which enables chatting with any LangGraph server with a `messages` key through a chat interface.

![Agent Chat UI Demo](public/demo.gif)

> [!NOTE]
> 🎥 Watch the video setup guide [here](https://youtu.be/lInrwVnZ83o).

## Features

- 🔒 Secure authentication system
- 🚀 Easy deployment options
- 💬 Real-time chat interface
- 🔌 Connect to any LangGraph server
- 🎨 Modern, responsive UI
- 🛠 Customizable settings

## Quick Start

> [!TIP]
> Don't want to run the app locally? Use the deployed site here: [agentchat.vercel.app](https://agentchat.vercel.app)!

### Option 1: Using npx

```bash
npx create-agent-chat-app
```

### Option 2: Manual Setup

1. Clone the repository:
```bash
git clone https://github.com/langchain-ai/agent-chat-ui.git
cd agent-chat-ui
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the app:
```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

## Detailed Setup Guide

### Prerequisites

- Node.js 16 or higher
- pnpm
- MongoDB (for authentication)

### Authentication Setup

The application includes an authentication system to secure access to the chat interface. Authentication is provided by a Node.js backend with MongoDB.

#### Setting Up the Authentication Backend

1. Navigate to the auth-service directory:
```bash
cd auth-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the example:
```bash
cp .env.example .env
```

4. Modify the `.env` file with your MongoDB URI and JWT secret:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

5. Start the authentication server:
```bash
npm run dev
```

6. Create an admin user:
```bash
npm run create-admin
```

This will create a default admin user with:
- Username: admin
- Password: Admin123!

#### Connecting the Frontend to the Authentication Backend

1. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

2. Set the authentication API URL:
```env
VITE_AUTH_API_URL=http://localhost:4000/api
```

3. Start the frontend:
```bash
pnpm dev
```

## Usage Guide

### Initial Setup

1. **Login**: Use the provided login form to authenticate with your username and password.

2. **Configuration**:
   - **Deployment URL**: Enter the URL of your LangGraph server
   - **Assistant/Graph ID**: Provide the graph name or assistant ID
   - **LangSmith API Key**: Required only for deployed LangGraph servers

3. Click `Continue` to access the chat interface

### Best Practices

- Keep your LangSmith API key secure
- Use environment variables for sensitive information
- Regularly update dependencies for security
- Monitor server logs for potential issues

## Deployment

### Vercel Deployment

1. Fork this repository
2. Create a new project on Vercel
3. Connect your forked repository
4. Configure environment variables
5. Deploy!

### Docker Deployment

```bash
# Build the Docker image
docker build -t agent-chat-ui .

# Run the container
docker run -p 5173:5173 agent-chat-ui
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Verify your LangGraph server is running
   - Check your API key permissions
   - Ensure correct environment variables

2. **Authentication Problems**
   - Verify MongoDB connection
   - Check user credentials
   - Review JWT token configuration

3. **Build Errors**
   - Clear node_modules and reinstall
   - Update dependencies
   - Check Node.js version

### Getting Help

If you encounter issues:
1. Check the [Issues](https://github.com/langchain-ai/agent-chat-ui/issues) page
2. Search existing discussions
3. Create a new issue with detailed information

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://docs.langchain.com)
- 💬 [Discord Community](https://discord.gg/langchain)
- 🐦 [Twitter](https://twitter.com/langchainai)

## Acknowledgments

- LangChain team and community
- All our contributors
- Users who provide valuable feedback
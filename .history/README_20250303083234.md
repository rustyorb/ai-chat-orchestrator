# AI Chat Orchestrator

A modern web application for managing and orchestrating multi-agent AI conversations with real-time communication capabilities.

![License](https://img.shields.io/badge/license-MIT-blue)

## About

AI Chat Orchestrator is a full-stack application built with React and FastAPI that enables users to create, configure, and manage conversations between multiple AI agents. The application features a responsive UI, real-time message streaming, and support for various AI model providers.

## Key Features

- **Multiple AI Model Support**: Integrate with OpenAI, Ollama, LM Studio, and custom endpoints
- **Persona Management**: Create and customize AI personas with unique system prompts
- **Real-time Conversations**: Stream message generation with WebSocket support
- **Secure Authentication**: Client-side API key storage with secure transmission
- **Responsive UI**: Modern interface built with React and Chakra UI

## Security

- API keys are stored securely in the browser's IndexedDB
- No hardcoded credentials in the source code
- Environment variables are properly excluded from version control
- Secure transmission of credentials between frontend and backend

## Installation

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-chat-orchestrator.git
   cd ai-chat-orchestrator
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

## Usage

1. Start the development servers:
   ```bash
   # Start frontend and backend concurrently
   npm run dev:all
   
   # Or start them separately
   npm run dev        # Frontend only
   npm run backend    # Backend only
   ```

2. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## Docker Deployment

```bash
# Build the Docker image
docker build -t ai-chat-orchestrator .

# Run the container
docker run -p 8000:8000 ai-chat-orchestrator
```

## Project Structure

```
ai-chat-orchestrator/
├── src/                  # Frontend source code (React/TypeScript)
│   ├── components/       # UI components
│   ├── services/         # API and WebSocket services
│   ├── store/            # Redux store and slices
│   └── types/            # TypeScript type definitions
├── backend/              # Backend source code (Python/FastAPI)
│   ├── adapters/         # Model adapters for different providers
│   └── data/             # Data storage
└── public/               # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
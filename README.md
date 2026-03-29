# 🤖 Multi-AI Comparison Tool

Query multiple AI providers (Claude, ChatGPT, Gemini, Grok) simultaneously and get the best synthesized answer without wasting time comparing responses manually.

## ✨ Features

- **Parallel AI Queries**: Send the same prompt to multiple AI providers at once
- **Smart Synthesis**: Automatically analyzes and combines responses to create the ultimate best answer
- **Common Themes Detection**: Identifies key themes that multiple AIs agree on
- **Unique Insights**: Highlights unique perspectives from each AI provider
- **Confidence Scoring**: Calculates confidence based on response agreement and quality
- **Individual Response View**: Option to view each AI's response separately
- **Clean UI**: Beautiful, responsive web interface built with React
- **Flexible Configuration**: Use any combination of AI providers

## 🏗️ Architecture

```
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── services/
│   │   │   ├── ai-clients/  # Individual AI provider clients
│   │   │   ├── orchestrator.service.ts  # Parallel query orchestration
│   │   │   └── synthesizer.service.ts   # Response analysis & synthesis
│   │   ├── routes/          # API routes
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── frontend/                # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   └── package.json
│
└── .env.example             # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for at least one AI provider (see below)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bootcamp
```

2. Set up backend:
```bash
cd backend
npm install
```

3. Set up frontend:
```bash
cd ../frontend
npm install
```

4. Configure API keys:
```bash
# Copy .env.example to .env in the root directory
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

### Getting API Keys

- **Claude (Anthropic)**: https://console.anthropic.com/
- **ChatGPT (OpenAI)**: https://platform.openai.com/api-keys
- **Gemini (Google)**: https://makersuite.google.com/app/apikey
- **Grok (X.AI)**: https://x.ai/api

**Note**: You don't need all API keys - the app works with any configured providers!

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The API will run on http://localhost:5000

2. Start the frontend (in a new terminal):
```bash
cd frontend
npm run dev
```
The web app will run on http://localhost:3000

3. Open your browser and navigate to http://localhost:3000

## 📖 Usage

1. Enter your question in the text area
2. Select which AI providers you want to query
3. Click "Get Best Answer"
4. Wait a few seconds while the app queries all providers in parallel
5. View the synthesized answer with:
   - Confidence score
   - Common themes
   - Unique insights from each provider
   - Option to view individual responses

## 🔧 API Endpoints

### `GET /api/ai/health`
Check API health and available providers

### `POST /api/ai/query`
Query multiple AI providers and get synthesized result

**Request body:**
```json
{
  "prompt": "Your question here",
  "providers": ["claude", "openai", "gemini", "grok"]  // optional
}
```

**Response:**
```json
{
  "synthesizedAnswer": "...",
  "individualResponses": [...],
  "analysis": {
    "commonThemes": [...],
    "uniqueInsights": [...],
    "confidence": 85.5
  },
  "metadata": {
    "totalProviders": 4,
    "successfulProviders": 4,
    "totalTime": 3245
  }
}
```

### `GET /api/ai/providers`
Get list of available/configured providers

## 🎯 How It Works

1. **Orchestration**: The orchestrator service sends the same prompt to all configured AI providers in parallel using Promise.all()

2. **Response Collection**: Each AI client (Claude, OpenAI, Gemini, Grok) handles API communication and error handling independently

3. **Analysis**: The synthesizer service analyzes all responses to:
   - Extract key themes using word frequency analysis
   - Identify unique insights from each provider
   - Calculate confidence score based on agreement

4. **Synthesis**: Creates a comprehensive answer by:
   - Combining common points from all responses
   - Removing duplicates
   - Adding unique insights
   - Ranking by importance and frequency

5. **Display**: The frontend presents the synthesized result with metadata and allows viewing individual responses

## 🛠️ Technology Stack

**Backend:**
- Node.js + Express
- TypeScript
- Official AI SDKs:
  - @anthropic-ai/sdk (Claude)
  - openai (ChatGPT)
  - @google/generative-ai (Gemini)
  - axios (Grok API)

**Frontend:**
- React 18
- TypeScript
- Vite
- CSS3 (custom styling)

## 📝 Development

### Build for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add support for more AI providers
- Improve the synthesis algorithm
- Enhance the UI/UX
- Add new features (e.g., history, favorites, export)

## 📄 License

MIT License - feel free to use this project for your own purposes!

## 🙏 Credits

Built with Claude Code as part of a 20-week bootcamp journey.

Powered by:
- Claude (Anthropic)
- ChatGPT (OpenAI)
- Gemini (Google)
- Grok (X.AI)

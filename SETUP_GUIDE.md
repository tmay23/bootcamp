# 🚀 Step-by-Step Setup Guide

This guide will walk you through setting up and using the Multi-AI Comparison Tool.

---

## 📋 Prerequisites

Before starting, make sure you have:
- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- At least **one AI provider API key** (free or paid)

---

## 🔧 Step 1: Verify Your Environment

Run the verification script to check your setup:

```bash
./verify-setup.sh
```

This will check:
- ✅ Node.js and npm are installed
- ✅ Project directories exist
- ✅ Dependencies are installed
- ✅ Configuration files are present

---

## 🔑 Step 2: Get Your API Keys

You need **at least ONE** API key from these providers:

### Option 1: Claude (Anthropic) - Recommended for starters
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy your API key

### Option 2: ChatGPT (OpenAI)
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy your API key

### Option 3: Gemini (Google)
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy your API key

### Option 4: Grok (X.AI)
1. Go to https://x.ai/api
2. Sign up for access
3. Generate your API key
4. Copy your API key

**💡 Tip**: Start with just ONE provider to test, then add more later!

---

## ⚙️ Step 3: Configure API Keys

1. Open the backend environment file:
```bash
nano backend/.env
```

2. Add your API key(s). For example, if you have a Claude key:
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx
```

3. Save and exit (Ctrl+X, then Y, then Enter)

**Important**:
- No quotes needed around the key
- Only fill in the keys you have
- Keep this file secure and never commit it to git

---

## 📦 Step 4: Install Dependencies

If not already installed, run:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
cd ..
```

---

## 🎬 Step 5: Start the Application

You need **TWO terminal windows**:

### Terminal 1 - Start Backend:
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:5000
📡 API endpoints available at http://localhost:5000/api
```

### Terminal 2 - Start Frontend:
```bash
cd frontend
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:3000/
```

---

## 🌐 Step 6: Open the Application

1. Open your web browser
2. Navigate to: **http://localhost:3000**
3. You should see the Multi-AI Comparison Tool interface

---

## 🎯 Step 7: Use the Application

### First Query:

1. **Enter your question** in the text area, for example:
   ```
   What are the key benefits of using TypeScript over JavaScript?
   ```

2. **Select AI providers** - check the boxes for providers you configured
   - Only providers with valid API keys will work

3. **Click "Get Best Answer"**

4. **Wait a few seconds** while the app:
   - Sends your prompt to all selected providers simultaneously
   - Collects their responses
   - Analyzes commonalities and differences
   - Synthesizes the ultimate best answer

5. **Review the results**:
   - **Synthesized Answer**: The best combined response
   - **Confidence Score**: How much the AIs agreed
   - **Common Themes**: Key points multiple AIs mentioned
   - **Unique Insights**: Special perspectives from individual AIs
   - **Individual Responses**: Click to see each AI's full answer

---

## 💡 Example Use Cases

### Compare Coding Solutions
```
What's the best way to handle async errors in Node.js?
```

### Get Multiple Perspectives
```
Explain quantum computing in simple terms
```

### Find Consensus on Debates
```
What are the pros and cons of microservices architecture?
```

### Get Comprehensive Answers
```
How do I optimize React performance?
```

---

## 🔍 Troubleshooting

### Backend won't start
- **Error: Missing API keys**
  - Check `backend/.env` has at least one valid API key
  - Make sure no quotes around the key

- **Port already in use**
  - Change port in `backend/.env`: `PORT=5001`

### Frontend can't connect
- **Error: Unable to connect to backend**
  - Make sure backend is running on http://localhost:5000
  - Check `frontend/.env` has correct `VITE_API_URL`

### No providers available
- **Error: No AI providers configured**
  - At least one API key must be added to `backend/.env`
  - Restart the backend after adding keys

### API Key errors
- **Error: Invalid API key**
  - Double-check your API key is copied correctly
  - Make sure there are no extra spaces
  - Verify your account has API access and credits

---

## 🎓 Understanding the Results

### Confidence Score
- **85-100%**: Strong agreement across AIs - highly reliable answer
- **60-84%**: Good agreement - solid answer with minor variations
- **40-59%**: Moderate agreement - consider the nuances
- **0-39%**: Low agreement - responses vary significantly

### Common Themes
Keywords that appeared in multiple AI responses, indicating consensus points.

### Unique Insights
Special perspectives or information only mentioned by one provider.

---

## 🛑 Stopping the Application

1. In **Terminal 1** (backend): Press `Ctrl+C`
2. In **Terminal 2** (frontend): Press `Ctrl+C`

---

## 🔄 Restarting

Simply run the start commands again:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## 📊 Cost Considerations

- **API Costs**: Each query costs tokens from your AI providers
- **Claude**: ~$0.003 per request (typical question)
- **OpenAI**: ~$0.002-0.01 per request
- **Gemini**: Free tier available
- **Grok**: Varies by plan

**Tip**: Start with providers that have free tiers (Gemini) or generous free credits (Claude, OpenAI).

---

## 🎉 Next Steps

Once you're comfortable:

1. **Try different prompts** to see how AIs compare
2. **Add more providers** to get broader perspectives
3. **Experiment with complex questions** where multiple viewpoints help
4. **Share with your team** for collaborative decision-making

---

## 💻 Advanced: Building for Production

### Backend:
```bash
cd backend
npm run build
npm start
```

### Frontend:
```bash
cd frontend
npm run build
npm run preview
```

---

## 🆘 Need Help?

- Check the main [README.md](./README.md) for technical details
- Review API documentation for each provider
- Check provider status pages for outages
- Verify your API keys have sufficient credits

---

**Enjoy using the Multi-AI Comparison Tool!** 🚀

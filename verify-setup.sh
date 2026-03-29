#!/bin/bash

echo "🔍 Multi-AI Comparison Tool - Setup Verification"
echo "=================================================="
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm not installed. Please install npm."
    exit 1
fi

echo ""
echo "Checking project structure..."

# Check backend
if [ -d "backend" ]; then
    echo "✅ Backend directory exists"
    if [ -f "backend/package.json" ]; then
        echo "✅ Backend package.json found"
    else
        echo "❌ Backend package.json missing"
    fi

    if [ -d "backend/node_modules" ]; then
        echo "✅ Backend dependencies installed"
    else
        echo "⚠️  Backend dependencies not installed. Run: cd backend && npm install"
    fi
else
    echo "❌ Backend directory missing"
fi

# Check frontend
if [ -d "frontend" ]; then
    echo "✅ Frontend directory exists"
    if [ -f "frontend/package.json" ]; then
        echo "✅ Frontend package.json found"
    else
        echo "❌ Frontend package.json missing"
    fi

    if [ -d "frontend/node_modules" ]; then
        echo "✅ Frontend dependencies installed"
    else
        echo "⚠️  Frontend dependencies not installed. Run: cd frontend && npm install"
    fi
else
    echo "❌ Frontend directory missing"
fi

echo ""
echo "Checking environment configuration..."

# Check backend .env
if [ -f "backend/.env" ]; then
    echo "✅ Backend .env file exists"

    # Check for at least one API key
    HAS_KEY=false
    if grep -q "ANTHROPIC_API_KEY=.\+" backend/.env 2>/dev/null; then
        echo "  ✅ Claude (Anthropic) API key configured"
        HAS_KEY=true
    fi
    if grep -q "OPENAI_API_KEY=.\+" backend/.env 2>/dev/null; then
        echo "  ✅ OpenAI API key configured"
        HAS_KEY=true
    fi
    if grep -q "GOOGLE_API_KEY=.\+" backend/.env 2>/dev/null; then
        echo "  ✅ Google (Gemini) API key configured"
        HAS_KEY=true
    fi
    if grep -q "GROK_API_KEY=.\+" backend/.env 2>/dev/null; then
        echo "  ✅ Grok API key configured"
        HAS_KEY=true
    fi

    if [ "$HAS_KEY" = false ]; then
        echo "  ⚠️  No API keys configured. Please add at least one API key to backend/.env"
    fi
else
    echo "⚠️  Backend .env file not found. Copy from .env.example: cp backend/.env.example backend/.env"
fi

if [ -f "frontend/.env" ]; then
    echo "✅ Frontend .env file exists"
else
    echo "⚠️  Frontend .env file not found. Copy from .env.example: cp frontend/.env.example frontend/.env"
fi

echo ""
echo "=================================================="
echo "Setup verification complete!"
echo ""
echo "To start the application:"
echo "1. Configure API keys in backend/.env"
echo "2. Terminal 1: cd backend && npm run dev"
echo "3. Terminal 2: cd frontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"

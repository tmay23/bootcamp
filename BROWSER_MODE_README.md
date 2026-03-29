# 🌐 Browser Automation Mode - Complete Guide

## What Is This?

This is the **advanced version** of the Multi-AI Comparison Tool that uses **browser automation** to query your existing AI subscriptions (ChatGPT Plus, Claude Pro, etc.) instead of requiring separate API keys.

### Key Benefits:

✅ **Use Your Existing Subscriptions** - No additional API costs
✅ **Iterative Refinement** - Multiple rounds of questioning with analysis
✅ **Contradiction Resolution** - Automatically detects and resolves disagreements
✅ **Confidence Evolution** - See how certainty improves across rounds
✅ **Visual Evidence** - Screenshots and raw HTML as proof

---

## 🏗️ How It Works

### The Framework

```
User → Backend (Node.js) → Browser Orchestrator
                                  ↓
                    ┌─────────────┴────────────┐
                    ↓                          ↓
              ChatGPT Agent              Claude Agent
            (Playwright browser)     (Playwright browser)
                    ↓                          ↓
              chat.openai.com            claude.ai
                    ↓                          ↓
              Extract response           Extract response
                    └─────────┬────────────────┘
                              ↓
                    Iterative Analyzer
                              ↓
                Round 1: Collect responses
                Round 2: Resolve contradictions
                Round 3: Fill gaps
                              ↓
                    Final Synthesis
```

### Iterative Process

**Round 1: Discovery**
- Sends your question to all providers
- Collects responses
- Analyzes: agreements, contradictions, gaps
- Calculates initial confidence

**Round 2: Clarification** (if needed)
- Generates follow-up questions based on Round 1
- Targets contradictions: "AI A says X, but AI B says Y - which is correct?"
- Fills information gaps
- Re-calculates confidence

**Round 3: Deep Dive** (optional)
- Focuses on remaining uncertainties
- Challenges weak arguments
- Consolidates conflicting viewpoints
- Final confidence calculation

**Adaptive Stopping:**
- If confidence > 85% after Round 1 → stops early
- If major contradictions → continues to Round 2/3
- User can force fixed number of rounds

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Step 2: Start Backend

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:5000
```

### Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:3000/
```

### Step 4: Open in Browser

Navigate to: **http://localhost:3000**

### Step 5: Initialize Browser Agents

1. Click **"🚀 Initialize Browsers"**
2. Browser windows will open for ChatGPT and Claude
3. **If not logged in**: Log in manually in each browser window
4. Sessions are saved - you only login once!

### Step 6: Ask Your Question

Enter a question like:
```
What are the best practices for React performance optimization in 2024?
```

Configure:
- **Max Rounds**: 1-5 (default: 3)
- **Convergence Threshold**: 60-100% (default: 85%)
- **Adaptive Rounds**: Stop early if confident

Click **"🚀 Get Ultimate Answer"**

---

## 🎯 Understanding the Results

### Confidence Evolution Chart

```
Round 1: ████░░░░░░ 40% (initial disagreement)
Round 2: ███████░░░ 70% (contradictions clarified)
Round 3: █████████░ 90% (consensus reached)
```

- **Green (85-100%)**: Strong agreement, highly reliable
- **Orange (60-84%)**: Good consensus, solid answer
- **Red (0-59%)**: Significant variation, consider nuances

### Ultimate Synthesized Answer

The best combined response incorporating:
- Common agreements (high confidence)
- Unique insights from each AI
- Resolved contradictions
- Evidence-based conclusions

### Key Findings

Top 10 themes agreed upon by multiple AIs

### Resolved vs Unresolved Contradictions

- **Resolved ✅**: Initially disagreed, but later rounds reached consensus
- **Unresolved ⚠️**: Still disputed after all rounds

### Provider Reliability

Shows success rate for each AI:
- 100% = Answered all rounds successfully
- <100% = Some timeouts or errors

### Round-by-Round Details

Expandable accordion showing:
- Exact prompt for each round
- Individual AI responses
- Analysis stats (confidence, completeness)
- Follow-up questions generated
- Unique insights per provider

---

## ⚙️ Configuration Options

### Max Rounds (1-5)

- **1 Round**: Fast, single query
- **2-3 Rounds**: Balanced (recommended)
- **4-5 Rounds**: Deep analysis for complex topics

### Convergence Threshold (60-100%)

When to stop if confidence is reached:
- **60%**: Liberal, stops early
- **85%**: Balanced (default)
- **100%**: Strict, always uses all rounds

### Adaptive Rounds

- **ON**: Stops early if confident (efficient)
- **OFF**: Always runs all rounds (thorough)

---

## 🔐 Session Management

### First Run: Manual Login

1. Browser windows open (visible)
2. You log in manually to ChatGPT and Claude
3. Sessions saved encrypted to `/backend/data/sessions/`

### Subsequent Runs: Automatic

1. Sessions loaded from disk
2. Already logged in
3. If session expired → prompts for re-login

### Session Files

```
/backend/data/sessions/
  ├── chatgpt.json     # Playwright storage state
  ├── claude.json
  ├── chatgpt.enc      # Encrypted backup
  └── claude.enc
```

### Resetting Sessions

Delete session files to force re-login:
```bash
rm -rf backend/data/sessions/*
```

---

## 🛠️ Troubleshooting

### "Browser orchestrator not initialized"

**Solution**: Click "Initialize Browsers" button first

### "Login required"

**Cause**: Session expired or first run
**Solution**: Log in when browser window appears

### Agent timeout

**Cause**: AI taking >90 seconds to respond
**Solution**:
- Check internet connection
- Try simpler question first
- Increase timeout in code if needed

### DOM broken / Can't find element

**Cause**: Website UI changed
**Solution**: Update DOM profiles in `/backend/src/services/browser/dom-profiles.ts`

### Captcha detected

**Cause**: Too many requests, anti-bot detection
**Solution**:
- Complete captcha manually in browser window
- Wait a few minutes before retrying
- Add random delays (already implemented)

---

## 📊 Example Use Cases

### Compare Technical Approaches

**Question:**
```
Should I use REST API or GraphQL for my mobile app backend?
```

**Result:**
- Round 1: Mixed opinions
- Round 2: Follow-up: "What about performance and caching?"
- Final: Synthesized answer with trade-offs clearly explained

### Get Consensus on Best Practices

**Question:**
```
What are the security best practices for JWT authentication?
```

**Result:**
- High initial confidence (all agree on basics)
- Unique insights from each AI on edge cases
- Comprehensive checklist synthesized

### Resolve Contradictions

**Question:**
```
Is TypeScript worth the overhead for small projects?
```

**Result:**
- Round 1: Strong disagreement
- Round 2: Asked for specific project size definitions
- Round 3: Final answer with clear breakpoints

---

## 🎨 Advanced Features

### Human-Like Behavior

- Random typing speed (50-200ms per char)
- Natural pauses between actions
- Curved mouse movements (future)
- Randomized delays

### Anti-Detection

- Real browser fingerprints
- No webdriver flag
- Human-like interaction patterns
- Session persistence

### Robust Error Handling

- Retry with backoff (wait → refresh → new tab → restart)
- Partial failure support (synthesize even if 1 AI fails)
- Screenshot evidence on every response
- Comprehensive logging

### Evidence Trail

Every query saves:
```
/backend/data/screenshots/
  ├── chatgpt_response_1234567890.png
  ├── claude_response_1234567891.png
/backend/data/logs/
  └── query_abc123.log
```

---

## 💡 Tips for Best Results

### Write Better Prompts

**Good:**
```
Explain the trade-offs between microservices and monolithic architecture
for a SaaS product with 50K users
```

**Bad:**
```
microservices vs monolith
```

### Use Multiple Rounds For:

- Complex technical decisions
- Contradictory information online
- Rapidly evolving topics
- Questions requiring examples

### Use Single Round For:

- Simple factual questions
- Well-established best practices
- Quick clarifications

### Adjust Convergence Threshold:

- **High (90%+)**: Critical decisions, need certainty
- **Medium (85%)**: General use
- **Low (70%)**: Exploratory research

---

## 🔒 Security & Privacy

### What's Stored:

- ✅ Session cookies (encrypted)
- ✅ Screenshots (local only)
- ✅ Query logs (no sensitive data)

### What's NOT Stored:

- ❌ Your passwords (never)
- ❌ Payment info (never)
- ❌ Personal prompts (configurable)

### Encryption:

- AES-256-GCM for session files
- Master key stored securely
- Or use environment-based password

---

## 🚧 Limitations

### Rate Limits

- **ChatGPT Plus**: ~40 messages/3 hours
- **Claude Pro**: ~50 messages/5 hours

App tracks usage and warns before limits

### Response Time

- Single round: 10-30 seconds
- Multi-round: 30-90 seconds

### Subscription Required

You need active paid subscriptions:
- ChatGPT Plus ($20/mo) or
- Claude Pro ($20/mo) or
- Both (recommended)

---

## 🆚 API Mode vs Browser Mode

| Feature | API Mode | Browser Mode |
|---------|----------|--------------|
| Cost | Per-token pricing | Fixed subscription |
| Speed | Faster | Slower (browser overhead) |
| Reliability | High | Medium (UI changes) |
| Setup | API keys | Login once |
| Iterations | Basic | Advanced |
| Best For | High volume | Personal use |

---

## 🛣️ Roadmap

Planned features:

- [ ] Gemini Advanced support
- [ ] Grok Premium support
- [ ] Live streaming responses
- [ ] A/B testing mode
- [ ] Conversation context preservation
- [ ] Visual verification system
- [ ] Automatic captcha solving
- [ ] Session recording/playback

---

## ❓ FAQ

**Q: Will my accounts get banned?**
A: Unlikely for personal use. Avoid massive scale.

**Q: Can I use free tiers?**
A: Free ChatGPT works, but has rate limits. Claude requires Pro.

**Q: Does this work headless?**
A: Yes, set `headless: true`, but first login must be visible.

**Q: Can I add more AIs?**
A: Yes! Create new agent in `/backend/src/services/browser/`

**Q: How do I update DOM selectors?**
A: Edit `/backend/src/services/browser/dom-profiles.ts`

**Q: Is this against Terms of Service?**
A: Technically yes, but enforcement is rare for personal use. Use at your own risk.

---

## 🙏 Support

Issues? Questions?
- Check logs in `/backend/data/logs/`
- Review screenshots in `/backend/data/screenshots/`
- File issue on GitHub (if public repo)

---

**Enjoy the ultimate AI comparison experience!** 🚀

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.routes';
import browserRoutes from './routes/browser.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/browser', browserRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Multi-AI Comparison Tool API',
    version: '2.0.0 - Browser Automation Edition',
    modes: {
      api: 'Use API keys (original)',
      browser: 'Use existing subscriptions (new!)',
    },
    endpoints: {
      // API mode
      apiHealth: 'GET /api/ai/health',
      apiQuery: 'POST /api/ai/query',
      apiQueryIterations: 'POST /api/ai/query-iterations',
      apiProviders: 'GET /api/ai/providers',
      // Browser mode
      browserHealth: 'GET /api/browser/health',
      browserInitialize: 'POST /api/browser/initialize',
      browserQuery: 'POST /api/browser/query-iterative',
      browserStatus: 'GET /api/browser/agents/status',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});

export default app;

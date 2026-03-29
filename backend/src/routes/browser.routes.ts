import { Router, Request, Response } from 'express';
import { IterativeOrchestrator } from '../services/browser/iterative-orchestrator';
import { IterativeConfig } from '../types/browser.types';

const router = Router();
let orchestrator: IterativeOrchestrator | null = null;

// Initialize orchestrator (should be called on server start)
export async function initializeOrchestrator(headless: boolean = false) {
  if (!orchestrator) {
    orchestrator = new IterativeOrchestrator();
    await orchestrator.initialize(headless);
  }
  return orchestrator;
}

// Health check for browser agents
router.get('/health', async (req: Request, res: Response) => {
  try {
    if (!orchestrator) {
      return res.json({
        status: 'not_initialized',
        message: 'Browser orchestrator not initialized',
      });
    }

    const statuses = orchestrator.getAgentStatuses();

    res.json({
      status: 'ok',
      agents: statuses,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check health',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Initialize browser agents (manual trigger)
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const { headless = false } = req.body;

    console.log(`\n🚀 Initializing browser orchestrator (headless: ${headless})...`);

    await initializeOrchestrator(headless);

    const statuses = orchestrator!.getAgentStatuses();

    res.json({
      success: true,
      message: 'Orchestrator initialized',
      agents: statuses,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Initialization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Iterative query endpoint
router.post('/query-iterative', async (req: Request, res: Response) => {
  try {
    const { prompt, config } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    // Initialize if not already done
    if (!orchestrator) {
      console.log('⚠️  Orchestrator not initialized, initializing now...');
      await initializeOrchestrator(false); // Visible browser for first run
    }

    // Default config
    const iterativeConfig: IterativeConfig = {
      maxRounds: config?.maxRounds || 3,
      convergenceThreshold: config?.convergenceThreshold || 85,
      focusAreas: config?.focusAreas || ['accuracy', 'depth'],
      challengeMode: config?.challengeMode || false,
      fillGaps: config?.fillGaps || true,
      adaptiveRounds: config?.adaptiveRounds !== false, // Default true
    };

    console.log('\n' + '='.repeat(60));
    console.log('📨 Received iterative query request');
    console.log('Prompt:', prompt.substring(0, 100) + '...');
    console.log('Config:', iterativeConfig);
    console.log('='.repeat(60) + '\n');

    // Run iterative query
    const result = await orchestrator!.runIterativeQuery(prompt, iterativeConfig);

    res.json(result);
  } catch (error) {
    console.error('Error processing iterative query:', error);
    res.status(500).json({
      error: 'Query failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get agent statuses
router.get('/agents/status', async (req: Request, res: Response) => {
  try {
    if (!orchestrator) {
      return res.json({
        initialized: false,
        agents: {},
      });
    }

    const statuses = orchestrator.getAgentStatuses();

    res.json({
      initialized: true,
      agents: statuses,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get agent statuses',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Cleanup (graceful shutdown)
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    if (orchestrator) {
      await orchestrator.cleanup();
      orchestrator = null;
    }

    res.json({
      success: true,
      message: 'Cleanup complete',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

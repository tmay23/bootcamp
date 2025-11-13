import { Router, Request, Response } from 'express';
import { OrchestratorService } from '../services/orchestrator.service';
import { SynthesizerService } from '../services/synthesizer.service';
import { QueryRequest } from '../types';

const router = Router();
const orchestrator = new OrchestratorService();
const synthesizer = new SynthesizerService();

// Health check
router.get('/health', (req: Request, res: Response) => {
  const availableProviders = orchestrator.getAvailableProviders();
  res.json({
    status: 'ok',
    availableProviders,
    timestamp: new Date().toISOString(),
  });
});

// Query multiple AIs and get synthesis
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { prompt, iterations = 1, providers }: QueryRequest = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    // Get responses from all AIs
    const responses = await orchestrator.queryAll(prompt, providers);

    // Synthesize the results
    const synthesis = synthesizer.synthesize(responses);

    res.json(synthesis);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Query with multiple iterations
router.post('/query-iterations', async (req: Request, res: Response) => {
  try {
    const { prompt, iterations = 2, providers }: QueryRequest = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    if (iterations < 1 || iterations > 5) {
      return res.status(400).json({ error: 'Iterations must be between 1 and 5' });
    }

    // Get multiple iterations of responses
    const allIterations = await orchestrator.queryWithIterations(prompt, iterations, providers);

    // Synthesize each iteration
    const syntheses = allIterations.map((iteration) => synthesizer.synthesize(iteration));

    // Flatten all responses for final synthesis
    const allResponses = allIterations.flat();
    const finalSynthesis = synthesizer.synthesize(allResponses);

    res.json({
      iterations: syntheses,
      finalSynthesis,
    });
  } catch (error) {
    console.error('Error processing query with iterations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get available providers
router.get('/providers', (req: Request, res: Response) => {
  const availableProviders = orchestrator.getAvailableProviders();
  res.json({ providers: availableProviders });
});

export default router;

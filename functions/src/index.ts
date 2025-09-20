import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { onboardVoice } from './onboardVoice';
import { generateCraft } from './generateCraft';
import { visualizeStory } from './visualizeStory';

// Initialize Express app
const app = express();

// Enable CORS
app.use(cors({ origin: true }));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Processing Endpoints
app.post('/onboard-voice', onboardVoice);
app.post('/generate-craft', generateCraft);
app.post('/visualize-story', visualizeStory);

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);

// Individual function exports for direct calling
export { onboardVoice as onboardVoiceFunction } from './onboardVoice';
export { generateCraft as generateCraftFunction } from './generateCraft';
export { visualizeStory as visualizeStoryFunction } from './visualizeStory';

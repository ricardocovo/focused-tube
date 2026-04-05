import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import healthRouter from './routes/health';
import { config } from './utils/config';

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);

// 404 and error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

export default app;

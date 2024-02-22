import express from 'express';
import feedRouter from './feedRouter.js';
import microRouter from './microRouter.js';
import pressRouter from './pressRouter.js';
import readingListRouter from './readingList.js';
import wikipediaRouter from './wikipediaRouter.js';

const app = express.Router();

app.use('/reading', readingListRouter);
app.use('/press', pressRouter);
app.use('/wikipedia-work', wikipediaRouter);

if (process.argv[2] !== 'prod') {
  // Feature flag
  app.use('/micro', microRouter);
  app.use('/feed', feedRouter);
}

export default app;

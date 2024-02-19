import express from 'express';
import microRouter from './microRouter.js';
import pressRouter from './pressRouter.js';
import readingListRouter from './readingList.js';
import wikipediaRouter from './wikipediaRouter.js';

const app = express.Router();

app.use('/reading', readingListRouter);
app.use('/press', pressRouter);
app.use('/wikipedia-work', wikipediaRouter);
app.use('/micro', microRouter);

export default app;

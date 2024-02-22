import express from 'express';
import authRouter from './auth.js';
import microRouter from './micro.js';
import readingListRouter from './readingList.js';

const app = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', readingListRouter);
app.use('/auth', authRouter);

if (process.argv[2] !== 'prod') {
  // Feature flag
  app.use('/micro', microRouter);
}

export default app;

import { Router } from 'express';
import { verifyToken } from '../../middleware/verifyToken.js';
import { getSummary } from './controller.js';

export const analyticsRouter = Router();

analyticsRouter.get('/analytics/summary', verifyToken, getSummary);

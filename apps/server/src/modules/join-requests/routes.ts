import { Router } from 'express';
import { verifyToken } from '../../middleware/verifyToken.js';
import {
  joinProject,
  listMyJoinRequests,
  listPendingJoinRequests,
  countPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  deleteJoinRequest,
} from './controller.js';

export const joinRequestsRouter = Router();

joinRequestsRouter.post('/projects/join', verifyToken, joinProject);
joinRequestsRouter.get('/join-requests', verifyToken, listMyJoinRequests);
joinRequestsRouter.get('/join-requests/pending', verifyToken, listPendingJoinRequests);
joinRequestsRouter.get('/join-requests/pending/count', verifyToken, countPendingJoinRequests);
joinRequestsRouter.post('/join-requests/:id/approve', verifyToken, approveJoinRequest);
joinRequestsRouter.post('/join-requests/:id/reject', verifyToken, rejectJoinRequest);
joinRequestsRouter.delete('/join-requests/:id', verifyToken, deleteJoinRequest);

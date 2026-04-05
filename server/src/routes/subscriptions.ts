import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { getUserSubscriptions } from '../services/youtube.service';

const router = Router();
router.use(authenticateJwt);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriptions = await getUserSubscriptions(req.user!.id);
    res.json(subscriptions);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 401
    ) {
      res.status(401).json({ error: 'YouTube authentication failed. Please re-authenticate.' });
      return;
    }
    next(error);
  }
});

export default router;

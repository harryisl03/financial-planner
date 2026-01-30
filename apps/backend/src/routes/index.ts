import { Router } from 'express';
import userRoutes from './user.routes.js';
import accountRoutes from './account.routes.js';
import transactionRoutes from './transaction.routes.js';
import categoryRoutes from './category.routes.js';
import budgetRoutes from './budget.routes.js';
import statsRoutes from './stats.routes.js';
import subscriptionRoutes from './subscription.routes.js';

const router = Router();

router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/stats', statsRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;

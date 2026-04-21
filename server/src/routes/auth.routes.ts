import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate, validate, authLimiter } from '../middlewares';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.put('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
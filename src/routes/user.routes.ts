import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const userRouter = Router();

userRouter.post('/',      [requireAdmin], createUser);
userRouter.get('/',       [authenticate], getUsers);
userRouter.get('/:id',    [authenticate], getUserById);
userRouter.patch('/:id',  [authenticate], updateUser);
userRouter.delete('/:id', [authenticate, requireAdmin], deleteUser);

export default userRouter;

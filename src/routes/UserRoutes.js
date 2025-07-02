import express from 'express';

import { getAllUsers } from '../controllers/UserControlles.js';

const router = express.Router();

router.get('/get-users', getAllUsers);


export default router;
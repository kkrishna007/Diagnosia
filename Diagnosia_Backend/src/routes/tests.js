import express from 'express';
import { getTests, getTestById, getCategories, searchTests } from '../controllers/testController.js';

const router = express.Router();

router.get('/', getTests);
router.get('/categories', getCategories);
router.get('/search', searchTests);
router.get('/:id', getTestById);

export default router;

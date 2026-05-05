// routes/reaccionRoutes.js
import express from 'express';
import {
    obtenerReacciones,
    reaccionar,
    obtenerMiReaccion
} from '../controllers/reaccionController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Rutas
router.get('/', obtenerReacciones);
router.get('/mi-reaccion', autenticarToken, obtenerMiReaccion);
router.post('/', autenticarToken, reaccionar);

export default router;
import express from 'express';
import {
    obtenerReacciones,
    reaccionar,
    obtenerMiReaccion
} from '../controllers/reaccionController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Log para depuración
router.use((req, res, next) => {
    console.log(' [reaccionRoutes] Método:', req.method, 'ID Publicación:', req.params.idPublicacion);
    next();
});

router.get('/', obtenerReacciones);
router.get('/mi-reaccion', autenticarToken, obtenerMiReaccion);
router.post('/', autenticarToken, reaccionar);

export default router;
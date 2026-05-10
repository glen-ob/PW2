
import express from 'express';
import {
    getEstadisticasUsuario,
    getActividadGrafica,
    getDistribucionInteracciones
} from '../controllers/estadisticaController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const router = express.Router();


router.use(autenticarToken);

router.get('/usuario', getEstadisticasUsuario);
router.get('/grafica', getActividadGrafica);
router.get('/distribucion', getDistribucionInteracciones);

export default router;
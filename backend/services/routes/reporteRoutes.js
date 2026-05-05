
import express from 'express';
import {
    getTopFandoms,
    getTopPublicaciones,
    getTopUsuarios,
    getActividadSemanal
} from '../controllers/reporteController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const router = express.Router();


router.use(autenticarToken);

router.get('/top-fandoms', getTopFandoms);
router.get('/top-publicaciones', getTopPublicaciones);
router.get('/top-usuarios', getTopUsuarios);
router.get('/actividad-semanal', getActividadSemanal);

export default router;
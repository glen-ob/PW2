import express from 'express';
import { 
    crearColeccion,
    obtenerColeccionesUsuario,
    obtenerColeccionesPorUsuario
 } from '../controllers/coleccionController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

//Obtener las colecciones de un usuario
router.get('/usuario', autenticarToken, obtenerColeccionesUsuario);

//Obtener las colecciones de un usuario buscado
router.get('/usuario/:userId', obtenerColeccionesPorUsuario);

// Crear colección o pool
router.post('/', autenticarToken, crearColeccion);

export default router;
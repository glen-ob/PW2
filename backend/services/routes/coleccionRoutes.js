import express from 'express';
import { 
    crearColeccion,
    obtenerColeccionesUsuario
 } from '../controllers/coleccionController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

//Obtener las colecciones de un usuario
router.get('/usuario', autenticarToken, obtenerColeccionesUsuario);

// Crear colección o pool
router.post('/', autenticarToken, crearColeccion);

export default router;
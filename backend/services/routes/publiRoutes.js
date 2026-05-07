import express from 'express';
import {
    obtenerPublicaciones,
    obtenerPublicacionesPorUsuario,
    obtenerPublicacionPorId,
    crearPublicacion,
    actualizarPublicacion,
    eliminarPublicacion,
    agregarComentario,
    eliminarComentario
} from '../controllers/publiController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';
import { uploadPublicacionImages } from '../config/upload.js';
import { validarPublicacion, sanitizarPublicacion, validarComentario } from '../middleware/publiMiddleware.js';
import Publicacion from '../models/publiModel.js'; 

const router = express.Router();

// Rutas públicas (solo lectura)
router.get('/', obtenerPublicaciones);
router.get('/usuario/:usuarioId', obtenerPublicacionesPorUsuario);
router.get('/:id', obtenerPublicacionPorId);

// Rutas protegidas (requieren autenticación)
router.post('/', 
    autenticarToken,
    uploadPublicacionImages,
    validarPublicacion,
    sanitizarPublicacion,
    crearPublicacion
);

router.put('/:id', 
    autenticarToken,
    sanitizarPublicacion,
    actualizarPublicacion
);

router.delete('/:id', 
    autenticarToken,
    eliminarPublicacion
);


router.get('/:id/reacciones', async (req, res) => {
    try {
        const { id } = req.params;
        const publicacion = await Publicacion.findById(id);
        res.json({ success: true, total: publicacion?.MeGusta || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Comentarios
router.get('/:id/comentarios', async (req, res) => {
    try {
        const { id } = req.params;
        const publicacion = await Publicacion.findById(id)
            .populate('Comentarios.Idusuario', 'nombre nickname fotoPerfil');
        
        if (!publicacion) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }
        
        const comentarios = publicacion.Comentarios.map(c => ({
            _id: c._id,
            texto: c.Texto,
            fecha: c.Fecha,
            idUsuario: c.Idusuario  
        }));
        
        res.json({ success: true, comentarios });
    } catch (error) {
        console.error('Error obteniendo comentarios:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/:id/comentario', 
    autenticarToken,
    validarComentario,
    agregarComentario
);

router.delete('/:id/comentario/:comentarioId', 
    autenticarToken,
    eliminarComentario
);

export default router;
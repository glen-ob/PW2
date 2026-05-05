
import Reaccion from '../models/reaccionModel.js';
import Publicacion from '../models/publiModel.js';


export const obtenerReacciones = async (req, res) => {
    try {
        const { idPublicacion } = req.params;
        
        const total = await Reaccion.countDocuments({ idPublicacion });
        const reacciones = await Reaccion.find({ idPublicacion })
            .populate('idUsuario', 'nombre nickname fotoPerfil');
        
        res.json({
            success: true,
            total,
            reacciones
        });
    } catch (error) {
        console.error('Error obteniendo reacciones:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Crear o actualizar reacción
export const reaccionar = async (req, res) => {
    try {
        const { idPublicacion } = req.params;
        const { tipo = 'like' } = req.body;
        const usuarioId = req.usuario.id;
        
        console.log('Reaccionando a publicación:', idPublicacion);
        console.log('Usuario:', usuarioId);
        console.log('Tipo:', tipo);
        
        // Verificar que la publicación existe
        const publicacion = await Publicacion.findById(idPublicacion);
        if (!publicacion) {
            return res.status(404).json({ 
                success: false, 
                message: 'Publicación no encontrada' 
            });
        }
        
        // Buscar si ya existe reacción
        let reaccion = await Reaccion.findOne({
            idPublicacion,
            idUsuario: usuarioId
        });
        
        if (reaccion) {
            // Si ya existe, eliminar (toggle)
            await reaccion.deleteOne();
            
            // Actualizar contador de la publicación
            if (publicacion.MeGusta > 0) {
                publicacion.MeGusta -= 1;
            }
            const index = publicacion.UsuariosMeGusta?.indexOf(usuarioId);
            if (index !== -1 && index !== undefined) {
                publicacion.UsuariosMeGusta.splice(index, 1);
            }
            await publicacion.save();
            
            return res.json({
                success: true,
                message: 'Reacción eliminada',
                reaccion: null
            });
        } else {
            // Crear nueva reacción
            reaccion = new Reaccion({
                idPublicacion,
                idUsuario: usuarioId,
                tipo
            });
            await reaccion.save();
            
            // Actualizar contador de la publicación
            publicacion.MeGusta = (publicacion.MeGusta || 0) + 1;
            if (!publicacion.UsuariosMeGusta) publicacion.UsuariosMeGusta = [];
            publicacion.UsuariosMeGusta.push(usuarioId);
            await publicacion.save();
        }
        
        res.json({
            success: true,
            message: 'Reacción agregada',
            reaccion
        });
    } catch (error) {
        console.error('Error al reaccionar:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Obtener mi reacción a una publicación
export const obtenerMiReaccion = async (req, res) => {
    try {
        const { idPublicacion } = req.params;
        const usuarioId = req.usuario.id;
        
        const reaccion = await Reaccion.findOne({
            idPublicacion,
            idUsuario: usuarioId
        });
        
        res.json({
            success: true,
            reaccion: reaccion ? reaccion.tipo : null
        });
    } catch (error) {
        console.error('Error obteniendo reacción:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
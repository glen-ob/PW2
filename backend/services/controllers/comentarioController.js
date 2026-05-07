import Comentario from '../models/comentarioModel.js';
import Publicacion from '../models/publiModel.js';


export const obtenerComentarios = async (req, res) => {
    try {
        const { idPublicacion } = req.params; 
        const { pagina = 1, limite = 20 } = req.query;
        
        console.log(' Obteniendo comentarios de publicación:', idPublicacion);
        
        const resultado = await Comentario.obtenerPorPublicacion(
            idPublicacion,
            parseInt(limite),
            parseInt(pagina)
        );
        
     
        const totalComentarios = await Comentario.countDocuments({ 
            idPublicacion, 
            activo: true 
        });
        
        res.json({
            success: true,
            ...resultado,
            totalComentarios 
        });
    } catch (error) {
        console.error(' Error obteniendo comentarios:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const crearComentario = async (req, res) => {
    try {
        const { texto, comentarioPadre } = req.body;
        const { idPublicacion } = req.params;
        const usuarioId = req.usuario.id; 
        
        console.log('Creando comentario:', {
            idPublicacion,
            usuarioId,
            texto: texto?.substring(0, 30),
            esRespuesta: !!comentarioPadre
        });
        
        // Verificar que la publicación existe
        const publicacion = await Publicacion.findById(idPublicacion);
        if (!publicacion) {
            return res.status(404).json({ 
                success: false, 
                message: 'Publicación no encontrada' 
            });
        }
        
        // Crear el comentario
        const comentario = new Comentario({
            idUsuario: usuarioId,
            idPublicacion,
            texto: texto.trim(),
            esRespuesta: !!comentarioPadre,
            comentarioPadre: comentarioPadre || null
        });
        
        await comentario.save();
        console.log('Comentario guardado en BD:', comentario._id);
        
      
        if (comentarioPadre) {
            const comentarioPadreDoc = await Comentario.findById(comentarioPadre);
            if (comentarioPadreDoc) {
                await comentarioPadreDoc.agregarRespuesta(comentario._id);
                console.log('📎 Respuesta agregada al comentario padre');
            }
        }
        
       
        await comentario.populate('idUsuario', 'nombre nickname fotoPerfil');
        
       
        if (!publicacion.Comentarios) publicacion.Comentarios = [];
        publicacion.Comentarios.push({
            Idusuario: usuarioId,
            Texto: texto,
            Fecha: new Date()
        });
        await publicacion.save();
        

        if (publicacion.totalComentarios !== undefined) {
            publicacion.totalComentarios = (publicacion.totalComentarios || 0) + 1;
            await publicacion.save();
        }
        
        res.status(201).json({
            success: true,
            message: 'Comentario agregado exitosamente',
            comentario
        });
        
    } catch (error) {
        console.error(' Error creando comentario:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


export const eliminarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;
        
        const comentario = await Comentario.findById(id);
        
        if (!comentario) {
            return res.status(404).json({ 
                success: false, 
                message: 'Comentario no encontrado' 
            });
        }
        
        
        if (comentario.idUsuario.toString() !== usuarioId && req.usuario.rol !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permiso para eliminar este comentario' 
            });
        }
        
        comentario.activo = false;
        await comentario.save();
        
        res.json({
            success: true,
            message: 'Comentario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const toggleLikeComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;

        const comentario = await Comentario.findById(id);

        if (!comentario) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado'
            });
        }

        await comentario.toggleLike(usuarioId);

        res.json({
            success: true,
            message: 'Like actualizado',
            meGusta: comentario.meGusta
        });

    } catch (error) {
        console.error('Error en like de comentario:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
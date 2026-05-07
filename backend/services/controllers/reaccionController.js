
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
        
        console.log('\n========== REACCIÓN ==========');
        console.log(' Publicación ID:', idPublicacion);
        console.log(' Usuario ID:', usuarioId);
        console.log(' Tipo:', tipo);
        
       
        const publicacion = await Publicacion.findById(idPublicacion);
        if (!publicacion) {
            console.log(' Publicación no encontrada');
            return res.status(404).json({ 
                success: false, 
                message: 'Publicación no encontrada' 
            });
        }
        console.log(' Publicación encontrada:', publicacion.Titulo);
        
        
        let reaccion = await Reaccion.findOne({
            idPublicacion,
            idUsuario: usuarioId
        });
        
        if (reaccion) {
            // === ELIMINAR REACCIÓN (TOGGLE) ===
            console.log(' Eliminando reacción existente...');
            
          
            await reaccion.deleteOne();
            console.log('    Eliminado de Reaccion');
    
            if (publicacion.MeGusta > 0) {
                publicacion.MeGusta -= 1;
            }
            const index = publicacion.UsuariosMeGusta?.indexOf(usuarioId);
            if (index !== -1 && index !== undefined) {
                publicacion.UsuariosMeGusta.splice(index, 1);
            }
            
            await publicacion.save();
            console.log('    Publicación actualizada:', publicacion.MeGusta, 'likes');
            console.log('Reacción eliminada exitosamente\n');
            
            return res.json({
                success: true,
                message: 'Like eliminado',
                reaccion: null,
                likes: publicacion.MeGusta
            });
        } else {
           
            console.log(' Creando nueva reacción...');
            
            
            reaccion = new Reaccion({
                idPublicacion,
                idUsuario: usuarioId,
                tipo
            });
            
            const reaccionGuardada = await reaccion.save();
            console.log('   Reacción guardada en colección Reaccion:', {
                id: reaccionGuardada._id,
                idPublicacion: reaccionGuardada.idPublicacion,
                idUsuario: reaccionGuardada.idUsuario,
                tipo: reaccionGuardada.tipo,
                createdAt: reaccionGuardada.createdAt
            });
            
            // 2. Actualizar contador en Publicacion
            publicacion.MeGusta = (publicacion.MeGusta || 0) + 1;
            if (!publicacion.UsuariosMeGusta) publicacion.UsuariosMeGusta = [];
            publicacion.UsuariosMeGusta.push(usuarioId);
            
            await publicacion.save();
            console.log('    Publicación actualizada:', publicacion.MeGusta, 'likes');
            
            console.log(' Reacción agregada exitosamente\n');
            
            res.json({
                success: true,
                message: 'Like agregado',
                reaccion: tipo,
                likes: publicacion.MeGusta
            });
        }
    } catch (error) {
        console.error(' Error al reaccionar:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


export const obtenerMiReaccion = async (req, res) => {
    try {
        const { idPublicacion } = req.params;
        const usuarioId = req.usuario.id;
        
        console.log(' Buscando mi reacción - Publicación:', idPublicacion, 'Usuario:', usuarioId);
        
        const reaccion = await Reaccion.findOne({
            idPublicacion,
            idUsuario: usuarioId
        });
        
        console.log('   Reacción encontrada:', reaccion ? `Sí (${reaccion.tipo})` : 'No');
        
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
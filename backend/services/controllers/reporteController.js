
import Publicacion from '../models/publiModel.js';
import Usuario from '../models/usuarioModel.js';
import Franquicia from '../models/franquiciaModel.js';
import Reaccion from '../models/reaccionModel.js';

// Reporte 1: Fandoms con mayor número de publicaciones
export const getTopFandoms = async (req, res) => {
    try {
        const topFandoms = await Publicacion.aggregate([
            { $match: { Estado: 'activo' } },
            { $group: { _id: '$Franquicia', total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'franquicias',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'franquiciaInfo'
                }
            },
            { $unwind: '$franquiciaInfo' },
            {
                $project: {
                    _id: 1,
                    nombre: '$franquiciaInfo.nombre',
                    slug: '$franquiciaInfo.slug',
                    totalPublicaciones: '$total'
                }
            }
        ]);
        
        res.json({
            success: true,
            data: topFandoms
        });
    } catch (error) {
        console.error('Error en getTopFandoms:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reporte 2: Publicaciones con más reacciones (likes)
export const getTopPublicaciones = async (req, res) => {
    try {
        const topPublicaciones = await Publicacion.find({ Estado: 'activo' })
            .sort({ MeGusta: -1 })
            .limit(10)
            .populate('Idusuario', 'nombre nickname fotoPerfil')
            .populate('Franquicia', 'nombre slug')
            .select('Titulo Texto MeGusta Fotos Tipo Franquicia Idusuario createdAt');
        
        // Formatear respuesta
        const publicacionesFormateadas = topPublicaciones.map(pub => ({
            _id: pub._id,
            titulo: pub.Titulo,
            texto: pub.Texto,
            tipo: pub.Tipo,
            meGusta: pub.MeGusta,
            imagen: pub.fotosUrls?.[0] || null,
            franquicia: pub.Franquicia,
            usuario: pub.Idusuario,
            createdAt: pub.createdAt
        }));
        
        res.json({
            success: true,
            data: publicacionesFormateadas
        });
    } catch (error) {
        console.error('Error en getTopPublicaciones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};



// Reporte 3: TOP 10 Usuarios más activos (por posts + likes recibidos + likes dados)
export const getTopUsuarios = async (req, res) => {
    try {
       
        let usuarios;
        try {
           
            usuarios = await Usuario.find({ activo: true });
            if (usuarios.length === 0) {
                
                usuarios = await Usuario.find({});
            }
        } catch (error) {
            // Si el campo activo no existe, obtener todos
            usuarios = await Usuario.find({});
        }
        
        console.log('Total usuarios encontrados:', usuarios.length);
        
        if (usuarios.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        const usuariosConPuntaje = [];
        
        for (const usuario of usuarios) {
            // 1. Contar publicaciones del usuario
            const totalPublicaciones = await Publicacion.countDocuments({ 
                Idusuario: usuario._id, 
                Estado: 'activo' 
            });
            
            // 2. Calcular reacciones RECIBIDAS (likes en sus publicaciones)
            const publicacionesUsuario = await Publicacion.find({ 
                Idusuario: usuario._id, 
                Estado: 'activo' 
            }).select('MeGusta');
            
            const totalReaccionesRecibidas = publicacionesUsuario.reduce((sum, pub) => sum + (pub.MeGusta || 0), 0);
            
            // 3. Calcular reacciones DADAS (likes que el usuario ha dado a cualquier publicación)
            const totalReaccionesDadas = await Reaccion.countDocuments({ 
                idUsuario: usuario._id 
            });
            
            // 4. Calcular puntaje total (suma de todo)
            const puntajeTotal = totalPublicaciones + totalReaccionesRecibidas + totalReaccionesDadas;
            
            usuariosConPuntaje.push({
                _id: usuario._id,
                nombre: usuario.nombre || 'Usuario',
                nickname: usuario.nickname || usuario.nombre || 'Usuario',
                fotoPerfil: usuario.fotoPerfil || null,
                totalPublicaciones: totalPublicaciones,
                totalReaccionesRecibidas: totalReaccionesRecibidas,
                totalReaccionesDadas: totalReaccionesDadas,
                puntajeTotal: puntajeTotal
            });
            
            console.log(`Usuario: ${usuario.nickname || usuario.nombre} - Posts: ${totalPublicaciones}, Recibidos: ${totalReaccionesRecibidas}, Dados: ${totalReaccionesDadas}, Puntaje: ${puntajeTotal}`);
        }
        
        // Ordenar por puntaje total (mayor a menor)
        usuariosConPuntaje.sort((a, b) => b.puntajeTotal - a.puntajeTotal);
        
        // Tomar top 10
        const topUsuarios = usuariosConPuntaje.slice(0, 10);
        
        console.log('\n=== TOP 10 USUARIOS ===');
        topUsuarios.forEach((u, idx) => {
            console.log(`${idx + 1}. ${u.nickname} - Posts: ${u.totalPublicaciones}, Recibidos: ${u.totalReaccionesRecibidas}, Dados: ${u.totalReaccionesDadas}, Puntaje: ${u.puntajeTotal}`);
        });
        
        res.json({
            success: true,
            data: topUsuarios
        });
    } catch (error) {
        console.error('Error en getTopUsuarios:', error);
        res.status(500).json({ success: false, message: error.message, error: error.toString() });
    }
};
// Reporte 4: Actividad Semanal
export const getActividadSemanal = async (req, res) => {
    try {
        const hoy = new Date();
        const fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 7);
        
        const actividad = await Publicacion.aggregate([
            {
                $match: {
                    createdAt: { $gte: fechaInicio },
                    Estado: 'activo'
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    dia: { $first: { $dayOfWeek: '$createdAt' } },
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Mapear días de la semana
        const diasSemana = {
            1: 'Domingo',
            2: 'Lunes',
            3: 'Martes',
            4: 'Miércoles',
            5: 'Jueves',
            6: 'Viernes',
            7: 'Sábado'
        };
        
        // Inicializar todos los días con 0
        const actividadCompleta = [];
        for (let i = 1; i <= 7; i++) {
            const diaData = actividad.find(a => a._id === i);
            actividadCompleta.push({
                dia: i,
                nombreDia: diasSemana[i],
                total: diaData ? diaData.total : 0
            });
        }
        
        // También obtener actividad de reacciones por día
        const actividadesReacciones = await Reaccion.aggregate([
            {
                $match: {
                    createdAt: { $gte: fechaInicio }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    totalReacciones: { $sum: 1 }
                }
            }
        ]);
        
        // Combinar datos
        for (let dia of actividadCompleta) {
            const reaccionData = actividadesReacciones.find(r => r._id === dia.dia);
            dia.totalReacciones = reaccionData ? reaccionData.totalReacciones : 0;
        }
        
        res.json({
            success: true,
            data: actividadCompleta,
            fechaInicio,
            fechaFin: hoy
        });
    } catch (error) {
        console.error('Error en getActividadSemanal:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
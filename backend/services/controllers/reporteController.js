
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

// Reporte 3: TOP 10 Usuarios más activos (por cantidad de publicaciones)
export const getTopUsuarios = async (req, res) => {
    try {
        const topUsuarios = await Publicacion.aggregate([
            { $match: { Estado: 'activo' } },
            { $group: { _id: '$Idusuario', totalPublicaciones: { $sum: 1 } } },
            { $sort: { totalPublicaciones: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'usuarioInfo'
                }
            },
            { $unwind: '$usuarioInfo' },
            {
                $project: {
                    _id: 1,
                    nombre: '$usuarioInfo.nombre',
                    nickname: '$usuarioInfo.nickname',
                    fotoPerfil: '$usuarioInfo.fotoPerfil',
                    totalPublicaciones: 1
                }
            }
        ]);
        
        // También obtener total de reacciones recibidas por cada usuario
        for (let usuario of topUsuarios) {
            const publicacionesUsuario = await Publicacion.find({ 
                Idusuario: usuario._id, 
                Estado: 'activo' 
            });
            
            const totalReacciones = publicacionesUsuario.reduce((sum, pub) => sum + (pub.MeGusta || 0), 0);
            usuario.totalReacciones = totalReacciones;
        }
        
        res.json({
            success: true,
            data: topUsuarios
        });
    } catch (error) {
        console.error('Error en getTopUsuarios:', error);
        res.status(500).json({ success: false, message: error.message });
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
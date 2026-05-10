import Publicacion from '../models/publiModel.js';
import Usuario from '../models/usuarioModel.js';
import Comentario from '../models/comentarioModel.js';
import Reaccion from '../models/reaccionModel.js';


function calcularTendencia(actual, anterior) {
    if (anterior === 0) {
        return actual > 0 ? 100 : 0;
    }
    return Math.round(((actual - anterior) / anterior) * 100);
}

// Obtener estadísticas principales del usuario
export const getEstadisticasUsuario = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        console.log('\n========== INICIO ESTADÍSTICAS ==========');
        console.log('Usuario ID:', usuarioId);
        console.log('==========================================\n');

       
        console.log(' [1] CONTANDO PUBLICACIONES PROPIAS');
        const totalPublicaciones = await Publicacion.countDocuments({ 
            Idusuario: usuarioId,
            Estado: 'activo'
        });
        console.log(` Publicaciones encontradas: ${totalPublicaciones}`);
        
        
        const publicacionesDetalle = await Publicacion.find({ 
            Idusuario: usuarioId,
            Estado: 'activo'
        }).select('_id titulo MeGusta createdAt');
        console.log(' Detalle de publicaciones:');
        publicacionesDetalle.forEach(pub => {
            console.log(`      - ID: ${pub._id}, Título: "${pub.titulo?.substring(0, 30)}", MeGusta: ${pub.MeGusta || 0}`);
        });
        console.log('');

   
        console.log('[2] CONTANDO COMENTARIOS PROPIOS');
        const totalComentarios = await Comentario.countDocuments({ 
            idUsuario: usuarioId,
            activo: true
        });
        console.log(`Comentarios encontrados: ${totalComentarios}`);
        
       
        const comentariosDetalle = await Comentario.find({ 
            idUsuario: usuarioId,
            activo: true
        }).select('_id texto idPublicacion createdAt');
        console.log('Detalle de comentarios:');
        comentariosDetalle.forEach(com => {
            console.log(`      - ID: ${com._id}, Texto: "${com.texto?.substring(0, 30)}", Publicación: ${com.idPublicacion}`);
        });
       

        
        console.log('[3] CONTANDO REACCIONES RECIBIDAS (Likes en publicaciones propias)');
        const publicacionesUsuario = await Publicacion.find({ 
            Idusuario: usuarioId,
            Estado: 'activo'
        });
        
        let totalReaccionesRecibidas = 0;
        for (const pub of publicacionesUsuario) {
            const likesPub = pub.MeGusta || 0;
            console.log(`  Publicación ${pub._id}: ${likesPub} likes recibidos`);
            totalReaccionesRecibidas += likesPub;
        }
        console.log(`TOTAL reacciones recibidas: ${totalReaccionesRecibidas}\n`);

        
        console.log('[4] CONTANDO REACCIONES DADAS (Likes a publicaciones de otros + likes a publicaciones propias)');
        const idsPublicacionesPropias = publicacionesUsuario.map(p => p._id);
        console.log('    IDs de publicaciones propias:', idsPublicacionesPropias.map(id => id.toString()));
        
        
        const todasReaccionesUsuario = await Reaccion.find({ 
            idUsuario: usuarioId
        }).populate('idPublicacion', 'titulo Idusuario');
        
        console.log(`Total reacciones del usuario (todas): ${todasReaccionesUsuario.length}`);
        
        
        let reaccionesAPropias = 0;
        let reaccionesAAjenas = 0;
        
        todasReaccionesUsuario.forEach(reaccion => {
            const esPropia = idsPublicacionesPropias.some(id => id.toString() === reaccion.idPublicacion?._id?.toString());
            if (esPropia) {
                reaccionesAPropias++;
                console.log(`Like a publicación PROPIA: ${reaccion.idPublicacion?._id} - "${reaccion.idPublicacion?.titulo?.substring(0, 30)}" (SÍ se cuenta como "dado")`);
            } else {
                reaccionesAAjenas++;
                console.log(`Like a publicación AJENA: ${reaccion.idPublicacion?._id} - "${reaccion.idPublicacion?.titulo?.substring(0, 30)}" (SÍ se cuenta como "dado")`);
            }
        });
        
        // AHORA CONTAMOS TODAS LAS REACCIONES (propias + ajenas)
        const totalReaccionesDadas = reaccionesAPropias + reaccionesAAjenas;
        console.log(`Resumen reacciones dadas:`);
        console.log(`      - Likes a publicaciones propias (AHORA SÍ cuentan): ${reaccionesAPropias}`);
        console.log(`      - Likes a publicaciones ajenas (SÍ cuentan): ${reaccionesAAjenas}`);
        console.log(`TOTAL reacciones dadas: ${totalReaccionesDadas}\n`);

        
        console.log('[5] CALCULANDO TENDENCIAS');
        const hoy = new Date();
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hoy.getDate() - 7);
        const hace14Dias = new Date(hoy);
        hace14Dias.setDate(hoy.getDate() - 14);
        
        console.log(`Período actual: ${hace7Dias.toISOString().split('T')[0]} hasta ${hoy.toISOString().split('T')[0]}`);
        console.log(`Período anterior: ${hace14Dias.toISOString().split('T')[0]} hasta ${hace7Dias.toISOString().split('T')[0]}`);

        // Publicaciones recientes vs anterior
        const publicacionesRecientes = await Publicacion.countDocuments({
            Idusuario: usuarioId,
            createdAt: { $gte: hace7Dias }
        });
        const publicacionesAnteriores = await Publicacion.countDocuments({
            Idusuario: usuarioId,
            createdAt: { $gte: hace14Dias, $lt: hace7Dias }
        });
        console.log(`Publicaciones - Recientes: ${publicacionesRecientes}, Anteriores: ${publicacionesAnteriores}`);
        const tendenciaPublicaciones = calcularTendencia(publicacionesRecientes, publicacionesAnteriores);

      
        const comentariosRecientes = await Comentario.countDocuments({
            idUsuario: usuarioId,
            createdAt: { $gte: hace7Dias }
        });
        const comentariosAnteriores = await Comentario.countDocuments({
            idUsuario: usuarioId,
            createdAt: { $gte: hace14Dias, $lt: hace7Dias }
        });
        console.log(`    Comentarios - Recientes: ${comentariosRecientes}, Anteriores: ${comentariosAnteriores}`);
        const tendenciaComentarios = calcularTendencia(comentariosRecientes, comentariosAnteriores);

       
        let reaccionesRecibidasRecientes = 0;
        let reaccionesRecibidasAnteriores = 0;
        
        for (const pub of publicacionesUsuario) {
            const fechaPub = new Date(pub.createdAt);
            if (fechaPub >= hace7Dias) {
                reaccionesRecibidasRecientes += pub.MeGusta || 0;
            } else if (fechaPub >= hace14Dias && fechaPub < hace7Dias) {
                reaccionesRecibidasAnteriores += pub.MeGusta || 0;
            }
        }
        console.log(`Reacciones recibidas - Recientes: ${reaccionesRecibidasRecientes}, Anteriores: ${reaccionesRecibidasAnteriores}`);
        const tendenciaReaccionesRecibidas = calcularTendencia(reaccionesRecibidasRecientes, reaccionesRecibidasAnteriores);

        // CORREGIDO: Ahora contamos TODAS las reacciones dadas (incluyendo a publicaciones propias)
        const reaccionesDadasRecientes = await Reaccion.countDocuments({
            idUsuario: usuarioId,
            createdAt: { $gte: hace7Dias }
            // ELIMINADO: { $nin: idsPublicacionesPropias } - Ahora cuenta todas
        });
        const reaccionesDadasAnteriores = await Reaccion.countDocuments({
            idUsuario: usuarioId,
            createdAt: { $gte: hace14Dias, $lt: hace7Dias }
            // ELIMINADO: { $nin: idsPublicacionesPropias } - Ahora cuenta todas
        });
        console.log(`   Reacciones dadas - Recientes: ${reaccionesDadasRecientes}, Anteriores: ${reaccionesDadasAnteriores}`);
        const tendenciaReaccionesDadas = calcularTendencia(reaccionesDadasRecientes, reaccionesDadasAnteriores);
        console.log('');

        
        console.log('========== ESTADÍSTICAS FINALES ==========');
        console.log(`Publicaciones: ${totalPublicaciones}`);
        console.log(`Comentarios: ${totalComentarios}`);
        console.log(`Reacciones Recibidas: ${totalReaccionesRecibidas}`);
        console.log(`Reacciones Dadas: ${totalReaccionesDadas} (INCLUYE likes a publicaciones propias)`);
        console.log('==========================================\n');

        res.json({
            success: true,
            data: {
                publicaciones: totalPublicaciones,
                comentarios: totalComentarios,
                reaccionesRecibidas: totalReaccionesRecibidas,
                reaccionesDadas: totalReaccionesDadas,
                tendencias: {
                    publicaciones: tendenciaPublicaciones,
                    comentarios: tendenciaComentarios,
                    reaccionesRecibidas: tendenciaReaccionesRecibidas,
                    reaccionesDadas: tendenciaReaccionesDadas
                }
            }
        });
    } catch (error) {
        console.error(' ERROR obteniendo estadísticas:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getActividadGrafica = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { periodo = 'semana' } = req.query;

        console.log('\n========== INICIO GRÁFICA ==========');
        console.log('Usuario ID:', usuarioId);
        console.log('Período:', periodo);
        console.log('====================================\n');

        const hoy = new Date();
        let fechas = [];
        
       
        if (periodo === 'semana') {
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date(hoy);
                fecha.setDate(hoy.getDate() - i);
                fecha.setHours(0, 0, 0, 0);
                fechas.push(fecha);
            }
            console.log(' Generando 7 días (semana)');
        } else if (periodo === 'mes') {
            for (let i = 3; i >= 0; i--) {
                const fecha = new Date(hoy);
                fecha.setDate(hoy.getDate() - (i * 7));
                fechas.push(fecha);
            }
            console.log(' Generando 4 semanas (mes)');
        } else {
            for (let i = 11; i >= 0; i--) {
                const fecha = new Date(hoy);
                fecha.setMonth(hoy.getMonth() - i);
                fecha.setDate(1);
                fechas.push(fecha);
            }
            console.log('Generando 12 meses (año)');
        }

       
        const publicaciones = await Publicacion.find({
            Idusuario: usuarioId,
            Estado: 'activo'
        });
        console.log(`Publicaciones del usuario: ${publicaciones.length}`);
       
        const comentarios = await Comentario.find({
            idUsuario: usuarioId,
            activo: true
        });
        console.log(`Comentarios del usuario: ${comentarios.length}`);

        
        const reaccionesDadas = await Reaccion.find({
            idUsuario: usuarioId
        });
        console.log(`Reacciones totales del usuario: ${reaccionesDadas.length} (INCLUYE likes a publicaciones propias)`);

        const resultados = [];

        for (let i = 0; i < fechas.length; i++) {
            let fechaInicio, fechaFin, etiqueta;
            
            if (periodo === 'semana') {
                fechaInicio = new Date(fechas[i]);
                fechaInicio.setHours(0, 0, 0, 0);
                fechaFin = new Date(fechas[i]);
                fechaFin.setHours(23, 59, 59, 999);
                etiqueta = fechaInicio.toLocaleDateString('es-ES', { weekday: 'short' });
            } else if (periodo === 'mes') {
                fechaInicio = new Date(fechas[i]);
                fechaInicio.setHours(0, 0, 0, 0);
                fechaFin = new Date(fechas[i]);
                fechaFin.setDate(fechaFin.getDate() + 6);
                fechaFin.setHours(23, 59, 59, 999);
                etiqueta = `${fechaInicio.getDate()}/${fechaInicio.getMonth() + 1}`;
            } else {
                fechaInicio = new Date(fechas[i].getFullYear(), fechas[i].getMonth(), 1);
                fechaFin = new Date(fechas[i].getFullYear(), fechas[i].getMonth() + 1, 0, 23, 59, 59, 999);
                etiqueta = fechaInicio.toLocaleDateString('es-ES', { month: 'short' });
            }

            // Contar publicaciones
            const pubsEnPeriodo = publicaciones.filter(p => {
                const fechaPub = new Date(p.createdAt);
                return fechaPub >= fechaInicio && fechaPub <= fechaFin;
            }).length;

            // Contar comentarios
            const comentariosEnPeriodo = comentarios.filter(c => {
                const fechaCom = new Date(c.createdAt);
                return fechaCom >= fechaInicio && fechaCom <= fechaFin;
            }).length;

            // Contar reacciones dadas (TODAS, incluyendo a publicaciones propias)
            const reaccionesEnPeriodo = reaccionesDadas.filter(r => {
                const fechaReacc = new Date(r.createdAt);
                return fechaReacc >= fechaInicio && fechaReacc <= fechaFin;
            }).length;

            resultados.push({
                dia: etiqueta,
                publicaciones: pubsEnPeriodo,
                comentarios: comentariosEnPeriodo,
                reacciones: reaccionesEnPeriodo
            });
            
            console.log(` ${etiqueta}: pubs=${pubsEnPeriodo}, coms=${comentariosEnPeriodo}, reacc=${reaccionesEnPeriodo}`);
        }

        console.log('\n Gráfica generada exitosamente\n');

        res.json({
            success: true,
            data: resultados
        });
    } catch (error) {
        console.error(' ERROR obteniendo gráfica:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDistribucionInteracciones = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        
        console.log('\n========== DISTRIBUCIÓN INTERACCIONES ==========');
        console.log('Usuario ID:', usuarioId);
        console.log('==========================================\n');

        const totalPublicaciones = await Publicacion.countDocuments({ 
            Idusuario: usuarioId, 
            Estado: 'activo' 
        });
        console.log(` Publicaciones: ${totalPublicaciones}`);
        
        const totalComentarios = await Comentario.countDocuments({ 
            idUsuario: usuarioId, 
            activo: true 
        });
        console.log(` Comentarios: ${totalComentarios}`);
        
        const publicacionesUsuario = await Publicacion.find({ 
            Idusuario: usuarioId, 
            Estado: 'activo' 
        });
        
        let totalReaccionesRecibidas = 0;
        for (const pub of publicacionesUsuario) {
            totalReaccionesRecibidas += pub.MeGusta || 0;
        }
        console.log(` Reacciones recibidas: ${totalReaccionesRecibidas}`);
        
        
        const totalReaccionesDadas = await Reaccion.countDocuments({ 
            idUsuario: usuarioId 
        });
        console.log(` Reacciones dadas: ${totalReaccionesDadas} (INCLUYE likes a publicaciones propias)`);
        console.log(' Distribución calculada\n');

        res.json({
            success: true,
            data: [
                { nombre: 'Publicaciones', valor: totalPublicaciones, color: '#f08060' },
                { nombre: 'Comentarios', valor: totalComentarios, color: '#bc69b8' },
                { nombre: 'Reacciones Recibidas', valor: totalReaccionesRecibidas, color: '#60f0d0' },
                { nombre: 'Reacciones Dadas', valor: totalReaccionesDadas, color: '#f0c060' }  // NUEVO: añadido para mostrar también reacciones dadas
            ]
        });
    } catch (error) {
        console.error(' ERROR obteniendo distribución:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
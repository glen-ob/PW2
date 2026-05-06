import Carta from '../models/cartaModel.js';
import Franquicia from '../models/franquiciaModel.js';
import { optimizarImagen, eliminarImagen } from '../utils/imageUtils.js';

// Obtener todas las cartas
export const obtenerCartas = async (req, res) => {
    try {
        const { termino, franquicia, limite = 50 } = req.query;
        
        let cartas;
        if (termino) {
            cartas = await Carta.buscarCartas(termino, franquicia, parseInt(limite));
        } else if (franquicia) {
            cartas = await Carta.obtenerPorFranquicia(franquicia);
        } else {
            cartas = await Carta.find({ activo: true })
                .populate('idFranquicia', 'nombre slug')
                .sort({ _id: 1 })
                .sort({ createdAt: -1 })
                .limit(parseInt(limite));
        }
        
        res.json({
            success: true,
            cartas
        });
    } catch (error) {
        console.error('Error obteniendo cartas:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Obtener carta por ID
export const obtenerCartaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const carta = await Carta.findById(id)
            .populate('idFranquicia', 'nombre descripcion logo')
            .populate('creadaPor', 'nombre nickname fotoPerfil');
        
        if (!carta) {
            return res.status(404).json({ 
                success: false, 
                message: 'Carta no encontrada' 
            });
        }
        
        res.json({
            success: true,
            carta
        });
    } catch (error) {
        console.error('Error obteniendo carta:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Crear nueva carta
export const crearCarta = async (req, res) => {
    try {
        const {
            nombre,
            idFranquicia,
            descripcion,
            rareza,
            numero,
            año,
            valorEstimado
        } = req.body;
        
        const usuarioId = req.usuario.id;
        
        // Validar franquicia
        const franquicia = await Franquicia.findById(idFranquicia);
        if (!franquicia) {
            return res.status(404).json({ 
                success: false, 
                message: 'Franquicia no encontrada' 
            });
        }
        
        // Validar imagen
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'La imagen de la carta es obligatoria' 
            });
        }
        
        // Optimizar imagen
        await optimizarImagen(req.file, 'cartas');
        const imagenUrl = `/uploads/cartas/${req.file.filename}`;
        
        const carta = new Carta({
            nombre,
            idFranquicia,
            imagen: imagenUrl,
            descripcion,
            rareza,
            numero,
            año,
            valorEstimado,
            creadaPor: usuarioId
        });
        
        await carta.save();
        await carta.populate('idFranquicia', 'nombre');
        
        res.status(201).json({
            success: true,
            message: 'Carta creada exitosamente',
            carta
        });
    } catch (error) {
        // Limpiar imagen si hay error
        if (req.file) {
            eliminarImagen(req.file.filename, 'cartas');
        }
        console.error('Error creando carta:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Actualizar carta
export const actualizarCarta = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            idFranquicia,
            descripcion,
            rareza,
            numero,
            año,
            valorEstimado,
            activo
        } = req.body;
        
        const carta = await Carta.findById(id);
        
        if (!carta) {
            return res.status(404).json({ 
                success: false, 
                message: 'Carta no encontrada' 
            });
        }
        
        // Verificar permisos (solo el creador o admin)
        if (carta.creadaPor.toString() !== req.usuario.id && req.usuario.rol !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permiso para editar esta carta' 
            });
        }
        
        if (nombre) carta.nombre = nombre;
        if (idFranquicia) {
            const franquicia = await Franquicia.findById(idFranquicia);
            if (!franquicia) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Franquicia no encontrada' 
                });
            }
            carta.idFranquicia = idFranquicia;
        }
        if (descripcion !== undefined) carta.descripcion = descripcion;
        if (rareza) carta.rareza = rareza;
        if (numero) carta.numero = numero;
        if (año) carta.año = año;
        if (valorEstimado !== undefined) carta.valorEstimado = valorEstimado;
        if (activo !== undefined) carta.activo = activo;
        
        // Actualizar imagen si se envía nueva
        if (req.file) {
            // Eliminar imagen anterior
            if (carta.imagen) {
                const oldFilename = carta.imagen.split('/').pop();
                eliminarImagen(oldFilename, 'cartas');
            }
            // Optimizar nueva imagen
            await optimizarImagen(req.file, 'cartas');
            carta.imagen = `/uploads/cartas/${req.file.filename}`;
        }
        
        await carta.save();
        
        res.json({
            success: true,
            message: 'Carta actualizada exitosamente',
            carta
        });
    } catch (error) {
        console.error('Error actualizando carta:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Eliminar carta se deja por si acaso pero en el frontend no hay esa opción, es un soft delete asi que no se borra de la base de datos, solo se marca como inactiva
export const eliminarCarta = async (req, res) => {
    try {
        const { id } = req.params;
        
        const carta = await Carta.findById(id);
        
        if (!carta) {
            return res.status(404).json({ 
                success: false, 
                message: 'Carta no encontrada' 
            });
        }
        
    //creo que no se pueden elimianr cartas, no hay esa opción en el frontend, pero por si acaso se deja el endpoint, es un soft delete asi que no se borra de la base de datos, solo se marca como inactiva
        if (carta.creadaPor.toString() !== req.usuario.id && req.usuario.rol !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permiso para eliminar esta carta' 
            });
        }
        
        carta.activo = false;
        await carta.save();
        
        res.json({
            success: true,
            message: 'Carta eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando carta:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
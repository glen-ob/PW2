import Usuario from "../models/usuarioModel.js";
import bcrypt from 'bcryptjs';
import { generarToken } from "../config/auth.js";
import { validationResult } from 'express-validator';
import path from 'path'; // estas rutas son para las imágenes
import { fileURLToPath } from 'url';
import { optimizarImagen, eliminarImagen } from '../utils/imageUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Registrar un nuevo usuario
export const crearUsuario = async (req, res) => {
    try {
        
        
        // Validar errores de express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }

        const { nombre, nickname, correo, contrasena } = req.body;

        // Verificar campos requeridos
        if (!nombre || !nickname || !correo || !contrasena) {
            return res.status(400).json({ 
                error: 'Todos los campos son requeridos: nombre, nickname, correo y contraseña' 
            });
        }

        // Verificar si el correo ya existe
        const correoExistente = await Usuario.findOne({ correo });
        if (correoExistente) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        // Verificar si el nickname ya existe
        const nicknameExistente = await Usuario.findOne({ nickname });
        if (nicknameExistente) {
            return res.status(400).json({ error: 'El nickname ya está en uso' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const contrasenaEncriptada = await bcrypt.hash(contrasena, salt);

        // Crear nuevo usuario
        const usuario = new Usuario({
            nombre,
            nickname,
            correo,
            contrasena: contrasenaEncriptada
        });

        const usuarioGuardado = await usuario.save();
        
        // Generar token
        let token;
        try {
            token = generarToken(usuarioGuardado);
        } catch (tokenError) {
            console.error('Error generando token:', tokenError);
            return res.status(500).json({ error: 'Error al generar token de autenticación' });
        }

        console.log('Usuario registrado exitosamente:', usuarioGuardado.correo);
        
        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            usuario: usuarioGuardado,
            token
        });

    } catch (error) {
        console.error('Error detallado en registro:', error);

        if (error.name === 'ValidationError') {
            const mensajes = Object.values(error.errors).map(err => err.message);

            return res.status(400).json({
                error: mensajes.join(', ')
            });
        }

        res.status(500).json({
            error: 'Error al crear el usuario'
        });
    }
};
export const crearUsuarioConFoto = async (req, res) => {
    try {
        console.log('=== REGISTRO CON FOTO ===');
        console.log('Body:', req.body);
        console.log('Archivo:', req.file);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }

        const { nombre, nickname, correo, contrasena } = req.body;

        if (!nombre || !nickname || !correo || !contrasena) {
            return res.status(400).json({ 
                error: 'Todos los campos son requeridos: nombre, nickname, correo, contraseña' 
            });
        }

        const correoExistente = await Usuario.findOne({ correo });
        if (correoExistente) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        const nicknameExistente = await Usuario.findOne({ nickname });
        if (nicknameExistente) {
            return res.status(400).json({ error: 'El nickname ya está en uso' });
        }

        // Procesar foto de perfil si existe
        let fotoPerfilUrl = null;
        if (req.file) {
            // Optimizar la imagen
            const optimizado = await optimizarImagen(req.file, 'perfiles');
            
            if (optimizado) {
                fotoPerfilUrl = `/uploads/perfiles/${req.file.filename}`;
                console.log('Foto optimizada y guardada:', fotoPerfilUrl);
            } else {
                // Si falla la optimización, usar la imagen original
                fotoPerfilUrl = `/uploads/perfiles/${req.file.filename}`;
                console.log('Usando imagen sin optimizar:', fotoPerfilUrl);
            }
        }

        const salt = await bcrypt.genSalt(10);
        const contrasenaEncriptada = await bcrypt.hash(contrasena, salt);

        const usuario = new Usuario({
            nombre,
            nickname,
            correo,
            contrasena: contrasenaEncriptada,
            fotoPerfil: fotoPerfilUrl
        });

        const usuarioGuardado = await usuario.save();
        
        let token;
        try {
            token = generarToken(usuarioGuardado);
        } catch (tokenError) {
            console.error('Error generando token:', tokenError);
            return res.status(500).json({ error: 'Error al generar token de autenticación' });
        }

        const usuarioResponse = usuarioGuardado.toJSON();
        if (fotoPerfilUrl) {
            usuarioResponse.fotoPerfilUrl = `http://localhost:3000${fotoPerfilUrl}`;
        }

        console.log('Usuario registrado exitosamente con foto:', fotoPerfilUrl);
        
        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            usuario: usuarioResponse,
            token
        });

    } catch (error) {
        console.error('Error detallado en registro:', error);

        if (error.name === 'ValidationError') {
            const mensajes = Object.values(error.errors).map(err => err.message);

            return res.status(400).json({
                error: mensajes.join(', ')
            });
        }

        res.status(500).json({
            error: 'Error al crear el usuario'
        });
    }
};


export const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-contrasena');
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuarioResponse = usuario.toJSON();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Manejar foto de perfil
        if (usuario.fotoPerfil) {
            usuarioResponse.fotoPerfilUrl = `${baseUrl}${usuario.fotoPerfil}`;
        } else {
            // Usar una imagen por defecto si no tiene foto
            usuarioResponse.fotoPerfilUrl = `${baseUrl}/uploads/perfiles/default-avatar.png`;
            usuarioResponse.fotoPerfil = null;
        }
        
        console.log('Enviando perfil - Foto URL:', usuarioResponse.fotoPerfilUrl);
        res.json(usuarioResponse);
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: error.message });
    }
};

// Iniciar sesión
export const loginUsuario = async (req, res) => {
    try {
        console.log('=== INTENTANDO INICIAR SESIÓN ===');
        console.log('Body recibido:', req.body);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }

        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
        }

        // Buscar usuario por correo
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            return res.status(401).json({ error: 'Este correo no está registrado' });
        }

        // Verificar contraseña
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({ error: 'Su contraseña está incorrecta' });
        }

        // Generar token
        const token = generarToken(usuario);

        console.log('Login exitoso para:', usuario.correo);

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            usuario,
            token
        });

    } catch (error) {
        console.error('Error detallado en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión: ' + error.message });
    }
};

// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-contrasena');
        res.json(usuarios);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener usuario por ID
export const obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-contrasena');
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

export const actualizarPerfil = async (req, res) => {
    try {
        console.log('=== ACTUALIZANDO PERFIL ===');
        console.log('Body recibido:', req.body);
        
        const { nombre, nickname, bio } = req.body;
        const userId = req.usuario.id;
        
        const usuario = await Usuario.findById(userId);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        if (nickname && nickname !== usuario.nickname) {
            const nicknameExistente = await Usuario.findOne({ nickname, _id: { $ne: userId } });
            if (nicknameExistente) {
                return res.status(400).json({ error: 'El nickname ya está en uso por otro usuario' });
            }
        }
        
        if (nombre && nombre !== usuario.nombre) {
            const nombreExistente = await Usuario.findOne({ nombre, _id: { $ne: userId } });
            if (nombreExistente) {
                return res.status(400).json({ error: 'El nombre ya está en uso por otro usuario' });
            }
        }
        
        if (nombre) usuario.nombre = nombre;
        if (nickname) usuario.nickname = nickname;
        if (bio !== undefined) usuario.bio = bio;
        
        await usuario.save();
        
        const nuevoToken = generarToken(usuario);
        const usuarioResponse = usuario.toJSON();
        
        // Agregar URL completa de la foto
        if (usuario.fotoPerfil) {
            usuarioResponse.fotoPerfilUrl = `http://localhost:3000${usuario.fotoPerfil}`;
        }
        
        console.log('Perfil actualizado exitosamente');
        
        res.json({
            mensaje: 'Perfil actualizado exitosamente',
            usuario: usuarioResponse,
            token: nuevoToken
        });
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil: ' + error.message });
    }
};

export const actualizarFotoPerfil = async (req, res) => {
    try {
        console.log('=== ACTUALIZANDO FOTO DE PERFIL ===');
        console.log('Archivo recibido:', req.file);
        
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ninguna imagen' });
        }

        
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        
        const fotoAnterior = usuario.fotoPerfil;
        
        
        const optimizado = await optimizarImagen(req.file, 'perfiles');
        
        if (!optimizado) {
            return res.status(500).json({ error: 'Error al procesar la imagen' });
        }
        
       
        const fotoPerfilUrl = `/uploads/perfiles/${req.file.filename}`;
        
        console.log('Nueva URL de foto:', fotoPerfilUrl);
        
        // Actualizar usuario con la nueva foto
        usuario.fotoPerfil = fotoPerfilUrl;
        await usuario.save();
        
     
        if (fotoAnterior && fotoAnterior !== fotoPerfilUrl) {
            const oldFileName = fotoAnterior.split('/').pop();
            console.log('Intentando eliminar foto anterior:', oldFileName);
            
           
            try {
                eliminarImagen(oldFileName, 'perfiles');
            } catch (deleteError) {
                console.error('Error eliminando foto anterior:', deleteError);
            }
        }
        
        
        const usuarioActualizado = usuario.toJSON();
        const nuevoToken = generarToken(usuario);

        
        usuarioActualizado.fotoPerfilUrl = `http://localhost:3000${fotoPerfilUrl}`;

        console.log('Foto actualizada exitosamente para usuario:', usuario.nickname);

        res.json({
            mensaje: 'Foto de perfil actualizada exitosamente',
            fotoPerfil: fotoPerfilUrl,
            usuario: usuarioActualizado,
            token: nuevoToken
        });

    } catch (error) {
        console.error('Error actualizando foto:', error);
        res.status(500).json({ error: 'Error al actualizar foto de perfil: ' + error.message });
    }
};
// Buscar usuarios por nombre o nickname
export const buscarUsuarios = async (req, res) => {
    try {
        const { q } = req.query; // query parameter: ?q=blanca
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
        }
        
        // Buscar por nombre o nickname (insensible a mayúsculas)
        const usuarios = await Usuario.find({
            $or: [
                { nombre: { $regex: q, $options: 'i' } },
                { nickname: { $regex: q, $options: 'i' } }
            ]
        }).select('-contrasena').limit(10); // Limitar a 10 resultados
        
        res.json(usuarios);
    } catch (error) {
        console.error('Error buscando usuarios:', error);
        res.status(500).json({ error: error.message });
    }
};


export const obtenerPerfilPublico = async (req, res) => {
    try {
        const { identificador } = req.params;
        
        
        const usuario = await Usuario.findOne({
            $or: [
                { _id: identificador },
                { nickname: identificador }
            ]
        }).select('-contrasena');
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(usuario);
    } catch (error) {
        console.error('Error obteniendo perfil público:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener colección pública de un usuario
export const obtenerColeccionPublica = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        
        
        const coleccionEjemplo = [
            { id: 1, nombre: "Pikachu", imagen: "https://i.pinimg.com/736x/e7/02/c6/e702c62be77870ff68d2decd19cbd137.jpg", rareza: "Común" },
            { id: 2, nombre: "Charizard", imagen: "https://i.pinimg.com/736x/46/7d/27/467d27d51e4a84775142a54a7534ac89.jpg", rareza: "Rara" },
        ];
        
        res.json(coleccionEjemplo);
    } catch (error) {
        console.error('Error obteniendo colección pública:', error);
        res.status(500).json({ error: error.message });
    }
};


// Cerrar sesión
export const cerrarSesion = async (req, res) => {
    res.json({ mensaje: 'Sesión cerrada exitosamente' });
};
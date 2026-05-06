import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import connectDB from "./config/dbClient.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import publiRoutes from "./routes/publiRoutes.js";
import franquiciaRoutes from "./routes/franquiciaRoutes.js";
import comentarioRoutes from "./routes/comentarioRoutes.js";
import cartaRoutes from "./routes/cartaRoutes.js";
import coleccionRoutes from "./routes/coleccionRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

connectDB();

// Middlewares
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos - CORREGIDO
// La carpeta uploads está al mismo nivel que services
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

console.log('📁 Directorio actual:', __dirname);
console.log('📁 Sirviendo archivos estáticos desde:', uploadsPath);

// Verificar si la carpeta existe
if (fs.existsSync(uploadsPath)) {
    console.log('✅ Carpeta uploads existe');
    console.log('📁 Contenido de uploads:', fs.readdirSync(uploadsPath));
    
    // Verificar subcarpetas
    const perfilesPath = path.join(uploadsPath, 'perfiles');
    if (fs.existsSync(perfilesPath)) {
        console.log('📁 Contenido de perfiles:', fs.readdirSync(perfilesPath));
    } else {
        console.log('❌ Carpeta perfiles no existe');
    }
} else {
    console.log('❌ Carpeta uploads NO existe');
    // Crear la carpeta si no existe
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('📁 Carpeta uploads creada');
}

// Crear directorios si no existen
['perfiles', 'publicaciones', 'cartas'].forEach(dir => {
    const dirPath = path.join(uploadsPath, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Directorio creado: ${dirPath}`);
    }
});

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/publicaciones', publiRoutes);
app.use('/api/franquicias', franquiciaRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/cartas', cartaRoutes);
app.use('/api/colecciones', coleccionRoutes);

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ mensaje: 'Servidor funcionando correctamente' });
});


app.get('/debug/usuario/:id', async (req, res) => {
    try {
        const Usuario = (await import('./models/Usuario.js')).default;
        const usuario = await Usuario.findById(req.params.id).select('nombre nickname fotoPerfil');
        res.json({
            id: usuario._id,
            nombre: usuario.nombre,
            nickname: usuario.nickname,
            fotoPerfil: usuario.fotoPerfil,
            urlCompleta: `http://localhost:3000${usuario.fotoPerfil}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Ruta para verificar si una imagen existe (debug)
app.get('/check-image/:filename', (req, res) => {
    const imagePath = path.join(uploadsPath, 'perfiles', req.params.filename);
    if (fs.existsSync(imagePath)) {
        res.json({ exists: true, path: imagePath });
    } else {
        res.json({ exists: false, path: imagePath });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📸 URL base de imágenes: http://localhost:${PORT}/uploads/\n`);
});
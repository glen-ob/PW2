import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import connectDB from "./config/dbClient.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import publiRoutes from "./routes/publiRoutes.js";
import reaccionRoutes from './routes/reaccionRoutes.js';
import franquiciaRoutes from "./routes/franquiciaRoutes.js";
import comentarioRoutes from "./routes/comentarioRoutes.js";
import cartaRoutes from "./routes/cartaRoutes.js";
import coleccionRoutes from "./routes/coleccionRoutes.js";
import reporteRoutes from './routes/reporteRoutes.js';
import estadisticaRoutes from './routes/estadisticaRoutes.js';

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

// Servir archivos estaticos - Ruta corregida
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

console.log('Directorio actual:', __dirname);
console.log('Sirviendo archivos estaticos desde:', uploadsPath);

// Verificar si la carpeta existe
if (fs.existsSync(uploadsPath)) {
    console.log('Carpeta uploads existe');
    console.log('Contenido de uploads:', fs.readdirSync(uploadsPath));
    
    const cartasPath = path.join(uploadsPath, 'cartas');
    if (fs.existsSync(cartasPath)) {
        console.log('Carpeta cartas existe');
        console.log('Contenido de cartas:', fs.readdirSync(cartasPath));
        
        // Mostrar cuantas imagenes hay en cada subcarpeta
        const subCarpetas = fs.readdirSync(cartasPath);
        subCarpetas.forEach(folder => {
            const folderPath = path.join(cartasPath, folder);
            if (fs.statSync(folderPath).isDirectory()) {
                const files = fs.readdirSync(folderPath);
                console.log(`  ${folder}: ${files.length} imagenes`);
            }
        });
    } else {
        console.log('Carpeta cartas no existe en:', cartasPath);
    }
    
    const perfilesPath = path.join(uploadsPath, 'perfiles');
    if (fs.existsSync(perfilesPath)) {
        console.log('Carpeta perfiles existe');
    } else {
        console.log('Carpeta perfiles no existe');
    }
} else {
    console.log('Carpeta uploads NO existe');
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('Carpeta uploads creada');
}

// Crear directorios si no existen
['perfiles', 'publicaciones', 'cartas'].forEach(dir => {
    const dirPath = path.join(uploadsPath, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directorio creado: ${dirPath}`);
    }
});

// Rutas estaticas especificas para imagenes de cartas
app.use('/uploads/cartas/imagesPokemon', express.static(path.join(uploadsPath, 'cartas', 'imagesPokemon')));
app.use('/uploads/cartas/imagesMagic', express.static(path.join(uploadsPath, 'cartas', 'imagesMagic')));
app.use('/uploads/cartas/imagesDB', express.static(path.join(uploadsPath, 'cartas', 'imagesDB')));
app.use('/uploads/cartas/imagesYugioh', express.static(path.join(uploadsPath, 'cartas', 'imagesYugioh')));
app.use('/uploads/cartas/imagesDigimon', express.static(path.join(uploadsPath, 'cartas', 'imagesDigimon')));

// Endpoint de depuracion para verificar rutas de imagenes
app.get('/debug/imagenes', (req, res) => {
    const cartasPath = path.join(uploadsPath, 'cartas');
    const resultado = {};
    
    if (fs.existsSync(cartasPath)) {
        const carpetas = fs.readdirSync(cartasPath);
        carpetas.forEach(carpeta => {
            const carpetaPath = path.join(cartasPath, carpeta);
            if (fs.statSync(carpetaPath).isDirectory()) {
                const archivos = fs.readdirSync(carpetaPath);
                resultado[carpeta] = archivos.slice(0, 5); // Mostrar solo primeros 5
            }
        });
    }
    
    res.json({
        uploadsPath: uploadsPath,
        cartasPath: cartasPath,
        existe: fs.existsSync(cartasPath),
        carpetasEncontradas: resultado
    });
});

// Rutas de la API
app.use('/api/publicaciones', publiRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/franquicias', franquiciaRoutes);
app.use('/api/publicaciones/:idPublicacion/comentarios', comentarioRoutes);
app.use('/api/cartas', cartaRoutes);
app.use('/api/colecciones', coleccionRoutes);
app.use('/api/publicaciones/:idPublicacion/reacciones', reaccionRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/estadisticas', estadisticaRoutes);

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
    console.log(`\nServidor corriendo en http://localhost:${PORT}`);
    console.log(`URL base de imagenes: http://localhost:${PORT}/uploads/`);
    console.log(`\nEjemplos de URLs de imagenes:`);
    console.log(`  - http://localhost:${PORT}/uploads/cartas/imagesPokemon/bulbasaur.png`);
    console.log(`  - http://localhost:${PORT}/uploads/cartas/imagesMagic/caballero_templario.png`);
    console.log(`\nEndpoint de depuracion:`);
    console.log(`  - http://localhost:${PORT}/debug/imagenes\n`);
});
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import mongoose from "mongoose";

// Importaciones de rutas
import usuarioRoutes from "./routes/usuarioRoutes.js";
import publiRoutes from "./routes/publiRoutes.js";
import reaccionRoutes from './routes/reaccionRoutes.js';
import franquiciaRoutes from "./routes/franquiciaRoutes.js";
import comentarioRoutes from "./routes/comentarioRoutes.js";
import cartaRoutes from "./routes/cartaRoutes.js";
import coleccionRoutes from "./routes/coleccionRoutes.js";
import reporteRoutes from './routes/reporteRoutes.js';
import estadisticaRoutes from './routes/estadisticaRoutes.js';
import API_URL from "../../frontend/src/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();

// ============ CONFIGURACIÓN DE CORS (ANTES DE LAS RUTAS) ============
// Permitir todos los orígenes (para desarrollo/pruebas)
// app.use(cors());

// Configurar específicamente para Vercel
const corsOptions = {
    origin: ['https://pw-2-72rx.vercel.app', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ CONEXIÓN A MONGODB ============
const mongoURI = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!mongoURI) {
    console.error(' ERROR CRÍTICO: No se encontró variable de conexión a MongoDB');
    console.error('Busqué: MONGO_URL o MONGODB_URI');
    process.exit(1);
}

console.log('Conectando a MongoDB...');
mongoose.connect(mongoURI)
    .then(() => {
        console.log('Conectado exitosamente a MongoDB');
    })
    .catch(err => {
        console.error('❌ Error conectando a MongoDB:', err.message);
        process.exit(1);
    });

// ============ SERVIDOR ============
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos (uploads)
const uploadsPath = path.join(__dirname, '..', 'uploads');

console.log('========================================');
console.log('CONFIGURACION DE SERVIDOR');
console.log('========================================');
console.log('Directorio actual:', __dirname);
console.log('Ruta de uploads:', uploadsPath);
console.log('Existe uploads?', fs.existsSync(uploadsPath));

// Verificar estructura de carpetas
if (fs.existsSync(uploadsPath)) {
    console.log('Contenido de uploads:', fs.readdirSync(uploadsPath));

    const cartasPath = path.join(uploadsPath, 'cartas');
    if (fs.existsSync(cartasPath)) {
        console.log('Contenido de cartas:', fs.readdirSync(cartasPath));
        
        const subCarpetas = fs.readdirSync(cartasPath);
        subCarpetas.forEach(carpeta => {
            const carpetaPath = path.join(cartasPath, carpeta);
            if (fs.statSync(carpetaPath).isDirectory()) {
                const archivos = fs.readdirSync(carpetaPath);
                console.log(`  ${carpeta}: ${archivos.length} archivos`);
            }
        });
    } else {
        console.log('ERROR: No existe carpeta cartas');
    }
} else {
    console.log('ERROR: No existe carpeta uploads');
}

// Middleware para archivos estáticos
app.use('/uploads', express.static(uploadsPath));
app.use('/uploads/cartas', express.static(path.join(uploadsPath, 'cartas')));
app.use('/uploads/perfiles', express.static(path.join(uploadsPath, 'perfiles')));
app.use('/uploads/publicaciones', express.static(path.join(uploadsPath, 'publicaciones')));

// Rutas específicas para imágenes por franquicia
app.use('/imagesPokemon', express.static(path.join(uploadsPath, 'cartas', 'imagesPokemon')));
app.use('/imagesMagic', express.static(path.join(uploadsPath, 'cartas', 'imagesMagic')));
app.use('/imagesDB', express.static(path.join(uploadsPath, 'cartas', 'imagesDB')));
app.use('/imagesYugioh', express.static(path.join(uploadsPath, 'cartas', 'imagesYugioh')));
app.use('/imagesDigimon', express.static(path.join(uploadsPath, 'cartas', 'imagesDigimon')));

// ============ RUTAS DE DEBUG (opcionales, remover en producción) ============
app.get('/debug/imagen/:ruta', (req, res) => {
    const rutaCompleta = path.join(uploadsPath, 'cartas', req.params.ruta);
    const existe = fs.existsSync(rutaCompleta);
    res.json({
        buscado: req.params.ruta,
        rutaCompleta: rutaCompleta,
        existe: existe
    });
});

app.get('/debug/listar-imagenes', (req, res) => {
    const cartasPath = path.join(uploadsPath, 'cartas');
    const resultado = {};
    if (fs.existsSync(cartasPath)) {
        const carpetas = fs.readdirSync(cartasPath);
        carpetas.forEach(carpeta => {
            const carpetaPath = path.join(cartasPath, carpeta);
            if (fs.statSync(carpetaPath).isDirectory()) {
                resultado[carpeta] = fs.readdirSync(carpetaPath);
            }
        });
    }
    res.json({ imagenes: resultado });
});

app.get('/test-imagen', (req, res) => {
    const testPath = path.join(uploadsPath, 'cartas', 'imagesPokemon', 'bulbasaur.png');
    const existe = fs.existsSync(testPath);
    res.send(`
        <html><body>
            <h1>Test de Imagen</h1>
            <p>Ruta: ${testPath}</p>
            <p>Existe: ${existe}</p>
            ${existe ? '<img src="/uploads/cartas/imagesPokemon/bulbasaur.png" />' : '<p>Imagen no encontrada</p>'}
        </body></html>
    `);
});

// ============ RUTAS DE LA API ============
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
            fotoPerfil: usuario.fotoPerfil
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/check-image/:filename', (req, res) => {
    const imagePath = path.join(uploadsPath, 'perfiles', req.params.filename);
    res.json({ exists: fs.existsSync(imagePath), path: imagePath });
});

// ============ INICIAR SERVIDOR ============
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(` Serviendo archivos estáticos desde: ${uploadsPath}`);
});


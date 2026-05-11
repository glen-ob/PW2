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
        
        // Verificar subcarpetas
        const subCarpetas = fs.readdirSync(cartasPath);
        subCarpetas.forEach(carpeta => {
            const carpetaPath = path.join(cartasPath, carpeta);
            if (fs.statSync(carpetaPath).isDirectory()) {
                const archivos = fs.readdirSync(carpetaPath);
                console.log(`  ${carpeta}: ${archivos.length} archivos`);
                if (archivos.length > 0) {
                    console.log(`    Ejemplo: ${archivos[0]}`);
                }
            }
        });
    } else {
        console.log('ERROR: No existe carpeta cartas');
    }
} else {
    console.log('ERROR: No existe carpeta uploads');
}


app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
        console.log('Sirviendo archivo:', filePath);
    }
}));


app.use('/uploads/cartas', express.static(path.join(uploadsPath, 'cartas')));
app.use('/uploads/perfiles', express.static(path.join(uploadsPath, 'perfiles')));
app.use('/uploads/publicaciones', express.static(path.join(uploadsPath, 'publicaciones')));


app.use('/imagesPokemon', express.static(path.join(uploadsPath, 'cartas', 'imagesPokemon')));
app.use('/imagesMagic', express.static(path.join(uploadsPath, 'cartas', 'imagesMagic')));
app.use('/imagesDB', express.static(path.join(uploadsPath, 'cartas', 'imagesDB')));
app.use('/imagesYugioh', express.static(path.join(uploadsPath, 'cartas', 'imagesYugioh')));
app.use('/imagesDigimon', express.static(path.join(uploadsPath, 'cartas', 'imagesDigimon')));


app.get('/debug/imagen/:ruta', (req, res) => {
    const rutaCompleta = path.join(uploadsPath, 'cartas', req.params.ruta);
    const existe = fs.existsSync(rutaCompleta);
    
    res.json({
        buscado: req.params.ruta,
        rutaCompleta: rutaCompleta,
        existe: existe,
        uploadsPath: uploadsPath
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
    
    res.json({
        uploadsPath: uploadsPath,
        cartasPath: cartasPath,
        imagenes: resultado
    });
});

// Ruta de prueba para imagen
app.get('/test-imagen', (req, res) => {
    const testPath = path.join(uploadsPath, 'cartas', 'imagesPokemon', 'bulbasaur.png');
    const existe = fs.existsSync(testPath);
    
    res.send(`
        <html>
            <body>
                <h1>Test de Imagen</h1>
                <p>Ruta: ${testPath}</p>
                <p>Existe: ${existe}</p>
                ${existe ? '<img src="/uploads/cartas/imagesPokemon/bulbasaur.png" />' : '<p>Imagen no encontrada</p>'}
                <br/>
                <a href="/debug/listar-imagenes">Ver todas las imagenes</a>
            </body>
        </html>
    `);
});



app.use('/api/publicaciones', publiRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/franquicias', franquiciaRoutes);
app.use('/api/publicaciones/:idPublicacion/comentarios', comentarioRoutes);
app.use('/api/cartas', cartaRoutes);
app.use('/api/colecciones', coleccionRoutes);
app.use('/api/publicaciones/:idPublicacion/reacciones', reaccionRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/estadisticas', estadisticaRoutes);


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

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log(`\n========================================`);
    
// });

export default app;
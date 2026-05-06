import mongoose from "mongoose";

const publicacionesSchema = new mongoose.Schema({
    Idusuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El ID del usuario es obligatorio']
    },
    Idconjunto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coleccion',
        default: null
    },
    Titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        maxlength: [100, 'El título no puede exceder los 100 caracteres']
    },
    Texto: {
        type: String,
        trim: true,
        maxlength: [500, 'El texto no puede exceder los 500 caracteres'],
        default: ''
    },
    Tipo: {
        type: String,
        required: [true, 'El tipo de publicación es obligatorio'],
        enum: {
            values: ['venta', 'intercambio', 'coleccion'],
            message: 'Tipo debe ser: venta, intercambio o coleccion'
        }
    },
    Monto: {
        type: Number,
        min: [0, 'El monto no puede ser negativo'],
        default: null,
        validate: {
            validator: function(value) {
                if (this.Tipo === 'venta') {
                    return value !== null && value > 0;
                }
                return value === null;
            },
            message: function(props) {
                if (this.Tipo === 'venta') {
                    return 'Para publicaciones de venta, el monto es obligatorio y debe ser mayor a 0';
                }
                return 'Solo las publicaciones de venta pueden tener monto';
            }
        }
    },
    Fotos: {
        type: [String], 
        validate: {
            validator: function(v) {
                if (this.Tipo === 'venta' || this.Tipo === 'intercambio') {
                    return v.length <= 10;
                }
                if (this.Tipo === 'coleccion') {
                    return v.length <= 10;
                }
                return true;
            },
            message: 'Máximo 10 imágenes por publicación'
        },
        default: []
    },
    Franquicia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franquicia',
        required: true
    },
    Cantidad: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [1, 'La cantidad mínima es 1'],
        max: [999, 'La cantidad máxima es 999'],
        default: 1
    },
    Estado: {
        type: String,
        enum: {
            values: ['activo', 'vendido', 'cancelado', 'completado'],
            default: 'activo'
        }
    },
    MeGusta: {
        type: Number,
        default: 0,
        min: 0
    },
    UsuariosMeGusta: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }],
    Comentarios: [{
        Idusuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        Texto: {
            type: String,
            required: true,
            maxlength: 200
        },
        Fecha: {
            type: Date,
            default: Date.now
        }
    }],
    Visitas: {
        type: Number,
        default: 0
    },
    CartasColeccion: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carta'
    }],
    Condicion: {
        type: String,
        enum: ['nueva', 'como nueva', 'buena', 'aceptable', 'mala'],
        default: 'buena'
    },
}, {
    timestamps: true 
});

// Índices
publicacionesSchema.index({ Idusuario: 1, createdAt: -1 });
publicacionesSchema.index({ Tipo: 1, createdAt: -1 });
publicacionesSchema.index({ Franquicia: 1, Tipo: 1 });
publicacionesSchema.index({ Estado: 1, createdAt: -1 });


publicacionesSchema.virtual('fotosUrls').get(function() {
    if (!this.Fotos || this.Fotos.length === 0) return [];
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return this.Fotos.map(foto => `${baseUrl}/uploads/publicaciones/${foto}`);
});

// Métodos
publicacionesSchema.methods.usuarioDioLike = function(usuarioId) {
    return this.UsuariosMeGusta.includes(usuarioId);
};

publicacionesSchema.methods.toggleLike = async function(usuarioId) {
    const index = this.UsuariosMeGusta.indexOf(usuarioId);
    if (index === -1) {
        this.UsuariosMeGusta.push(usuarioId);
        this.MeGusta += 1;
    } else {
        this.UsuariosMeGusta.splice(index, 1);
        this.MeGusta -= 1;
    }
    return await this.save();
};

publicacionesSchema.methods.agregarComentario = async function(usuarioId, texto) {
    this.Comentarios.push({
        Idusuario: usuarioId,
        Texto: texto,
        Fecha: new Date()
    });
    return await this.save();
};

// Middleware pre-save
publicacionesSchema.pre('save', function() {
    if (this.Tipo === 'coleccion' && (!this.CartasColeccion || this.CartasColeccion.length === 0)) {
        throw new Error('Las publicaciones de colección deben tener al menos una carta');
    }
    
    if ((this.Tipo === 'venta' || this.Tipo === 'intercambio') && (!this.Fotos || this.Fotos.length === 0)) {
        throw new Error('Las publicaciones de venta/intercambio deben tener al menos una imagen');
    }
});

// Métodos estáticos
publicacionesSchema.statics.obtenerPorTipo = async function(tipo, limite = 20, pagina = 1) {
    const skip = (pagina - 1) * limite;
    return await this.find({ Tipo: tipo, Estado: 'activo' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite)
        .populate('Idusuario', 'nombre email avatar')
        .populate('CartasColeccion');
};

publicacionesSchema.statics.obtenerPorUsuario = async function(usuarioId, limite = 20, pagina = 1) {
    const skip = (pagina - 1) * limite;
    return await this.find({ Idusuario: usuarioId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite)
        .populate('CartasColeccion');
};


publicacionesSchema.set('toJSON', {
    virtuals: true,  
    transform: function(doc, ret) {
        delete ret.UsuariosMeGusta;
        delete ret.__v;
        return ret;
    }
});

const Publicacion = mongoose.model("Publicacion", publicacionesSchema);

export default Publicacion;
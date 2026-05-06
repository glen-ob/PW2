// models/reaccionModel.js
import mongoose from "mongoose";

const reaccionSchema = new mongoose.Schema({
    idPublicacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publicacion',
        required: true
    },
    idUsuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tipo: {
        type: String,
        enum: ['like', 'corazon'],
        default: 'like'
    }
}, {
    timestamps: true
});

// Índice único para evitar duplicados
reaccionSchema.index({ idPublicacion: 1, idUsuario: 1 }, { unique: true });

const Reaccion = mongoose.model("Reaccion", reaccionSchema);

export default Reaccion;
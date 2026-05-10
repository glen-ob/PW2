import mongoose from "mongoose";

const coleccionSchema = new mongoose.Schema({
    idPublicacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publicacion',
        required: true
    },

    idFranquicia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Franquicia',
        required: true
    },

    idUsuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    tipo: {
        type: String,
        enum: ['collection', 'pool'],
        required: true
    },

    deck: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Carta'
        }
    ]

}, {
    timestamps: true
});


// Este index impide que el usuario cree más de una colección de
coleccionSchema.index(
  { idUsuario: 1, idFranquicia: 1, tipo: 1 },
  { unique: true, partialFilterExpression: { tipo: 'collection' } }
);


const Coleccion = mongoose.model("Coleccion", coleccionSchema);

export default Coleccion;
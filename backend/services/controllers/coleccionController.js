import Coleccion from '../models/coleccionModel.js';

export const crearColeccion = async (req, res) => {
  try {
    const { idFranquicia, tipo } = req.body;
    const idUsuario = req.usuario.id;


    const deck = req.body.deck ? JSON.parse(req.body.deck) : [];

   
    if (!idFranquicia || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios'
      });
    }

   
    if (tipo === 'collection') {
      const existe = await Coleccion.findOne({
        idUsuario,
        idFranquicia,
        tipo: 'collection'
      });

      if (existe) {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes una colección de esta franquicia'
        });
      }
    }

   
    const nuevaColeccion = new Coleccion({
      idUsuario,
      idFranquicia,
      tipo,
      deck
    });

    await nuevaColeccion.save();

    res.status(201).json({
      success: true,
      coleccion: nuevaColeccion
    });

  } catch (error) {


    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una colección de esta franquicia'
      });
    }

    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const obtenerColeccionesUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const colecciones = await Coleccion.find({ idUsuario: usuarioId })
      .populate('deck') // trae las cartas completas
      .populate('idFranquicia', 'nombre')
      .sort({ createdAt: 1 });;

    res.json({
      success: true,
      colecciones
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const obtenerColeccionesPorUsuario = async (req, res) => {

  try {

    const { userId } = req.params;

    const colecciones = await Coleccion.find({
      idUsuario: userId
    })
    .populate('deck')
    .populate('idFranquicia', 'nombre')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      colecciones
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: 'Error obteniendo colecciones'
    });

  }

};
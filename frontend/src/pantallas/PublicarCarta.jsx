import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Gallery from '../componentes/Modals/Gallery';
import { useEffect } from 'react';
import axios from 'axios';

const PublicarCarta = () => {
  const navigate = useNavigate();
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedCartas, setSelectedCartas] = useState([]);
  const [tipoPublicacion, setTipoPublicacion] = useState('');
  const [imagenesVenta, setImagenesVenta] = useState([]);
  const [erroresImagen, setErroresImagen] = useState([]);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState(1);

  //Esto contiene las cartas que se adjuntaron desde gallery (chris)
  const [deck, setDeck] = useState([]);


  //Esta contiene solo la franquicia que selecciona el usaurio (chris)
  const [franquicia, setFranquicia] = useState('');

  //Esta contiene todas las franquicias, traidas desde la BD (chris)
  const [franquicias, setFranquicias] = useState([]);

  //Aquí ya se llaman las franquicias desde la BD
  useEffect(() => {
    const fetchFranquicias = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/franquicias');
        setFranquicias(res.data.franquicias);
      } catch (error) {
        console.error('Error cargando franquicias:', error);
      }
    };

    fetchFranquicias();
  }, []);

  useEffect(() => {
    setSelectedCartas([]);
    setDeck([]);
  }, [franquicia]);

  const handleTipoChange = (e) => {
    const tipo = e.target.value;
    setTipoPublicacion(tipo);

    if (tipo !== 'venta' && tipo !== 'intercambio') {
      setImagenesVenta([]);
    }

    if (tipo === 'coleccion') {
      setShowGalleryModal(true);
    }
  };

  const handleSelectCartas = (cartas) => {
    setSelectedCartas(cartas);

    //Se extraen los ID de las cartas seleccionadas (chris _ publicaciones de tipo coleccion)
    const ids = cartas.map(c => c.id);
    setDeck(ids);

    console.log('Cartas seleccionadas para colección:', cartas);
  };

  const eliminarCarta = (cartaId) => {
    setSelectedCartas(prev => prev.filter(c => c.id !== cartaId));
  };

  const validarImagen = (file) => {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

    if (!tiposPermitidos.includes(file.type) && !extensionesPermitidas.includes('.' + file.name.split('.').pop().toLowerCase())) {
      return {
        valido: false,
        error: `Formato no permitido: ${file.name}. Solo se permiten imagenes`
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        valido: false,
        error: `Archivo demasiado grande: ${file.name}. Maximo 5MB`
      };
    }

    return { valido: true, error: null };
  };

  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files);
    const nuevasImagenes = [];
    const nuevosErrores = [];

    if (imagenesVenta.length + files.length > 10) {
      alert('Maximo 10 imagenes por publicacion');
      return;
    }

    files.forEach(file => {
      const validacion = validarImagen(file);

      if (validacion.valido) {
        const reader = new FileReader();
        reader.onloadend = () => {
          nuevasImagenes.push({
            id: Date.now() + Math.random(),
            file: file,
            preview: reader.result,
            nombre: file.name
          });

          if (nuevasImagenes.length === files.length) {
            setImagenesVenta(prev => [...prev, ...nuevasImagenes]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        nuevosErrores.push(validacion.error);
      }
    });

    if (nuevosErrores.length > 0) {
      setErroresImagen(nuevosErrores);
      setTimeout(() => setErroresImagen([]), 5000);
    }
  };

  const eliminarImagen = (id) => {
    setImagenesVenta(prev => prev.filter(img => img.id !== id));
  };

  const handlePublicar = async () => {
    try {
      if (!tipoPublicacion) {
        alert('Por favor selecciona un tipo de publicacion');
        return;
      }

      if (tipoPublicacion === 'venta') {
        if (!titulo || !precio || imagenesVenta.length === 0) {
          alert('Faltan datos obligatorios: titulo, precio o imagenes');
          return;
        }
      }

      if (tipoPublicacion === 'intercambio') {
        if (!titulo || imagenesVenta.length === 0) {
          alert('Faltan datos obligatorios: titulo o imagenes');
          return;
        }
      }

      if (tipoPublicacion === 'coleccion') {
        if (selectedCartas.length === 0) {
          alert('Por favor selecciona al menos una carta para tu coleccion');
          return;
        }
      }

      const formDataToSend = new FormData();

      formDataToSend.append('Titulo', titulo);
      formDataToSend.append('Texto', descripcion);
      formDataToSend.append('Tipo', tipoPublicacion);
      if (precio) formDataToSend.append('Monto', precio);
      formDataToSend.append('Franquicia', franquicia);
      
      if (tipoPublicacion !== 'coleccion') {
        formDataToSend.append('Cantidad', cantidad);
      }
      
      formDataToSend.append('Condicion', 'buena');

      if (tipoPublicacion === 'venta' || tipoPublicacion === 'intercambio') {
        imagenesVenta.forEach((img) => {
          formDataToSend.append('imagenes', img.file);
        });
      }

      if (tipoPublicacion === 'coleccion') {
        formDataToSend.append('CartasColeccion', JSON.stringify(deck));
      }

      const response = await fetch('http://localhost:3000/api/publicaciones', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('❌ Error backend completo:', data);
        throw new Error(
          data.message || 
          (data.errores ? data.errores.join(', ') : 'Error desconocido')
        );
      }
      console.log('✅ Publicación creada:', data);

      alert('Publicacion creada con exito');
      navigate('/mi-perfil');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  return (
    <>
      {!showGalleryModal && (
        <div className="min-h-screen font-sans p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <div className="relative w-full max-w-2xl rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl mx-auto" style={{ 
            border: `2px solid var(--border-color)`,
            backgroundColor: 'var(--background-slate)'
          }}>
            {/* Boton X Circular - Ahora sí es un círculo perfecto */}
            <button
              onClick={() => navigate('/mi-perfil')}
              className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 md:-top-6 md:-right-6
                w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
                rounded-full flex items-center justify-center 
                transition-all duration-300 hover:scale-110 active:scale-95
                shadow-lg hover:shadow-xl z-10"
              style={{ 
                backgroundColor: 'var(--button-color)',
                border: `2px solid var(--border-color)`,
                color: 'var(--primary-text-color)'
              }}
            >
              <span className="text-base sm:text-lg md:text-xl font-bold transition-colors hover:text-red-500">X</span>
            </button>

            <form className="space-y-5 sm:space-y-6 md:space-y-8" onSubmit={(e) => e.preventDefault()}>
              {/* Tipo y Franquicia */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative w-full sm:w-auto flex-1">
                  <select
                    className="search-bar rounded-full py-2 px-4 sm:px-6 pr-8 sm:pr-10 outline-none appearance-none cursor-pointer text-sm font-medium w-full transition-all"
                    style={{ color: 'white' }}
                    value={tipoPublicacion}
                    onChange={handleTipoChange}
                  >
                    <option value="" disabled>Seleccionar tipo</option>
                    <option value="venta">Venta</option>
                    <option value="intercambio">Intercambio</option>
                    <option value="coleccion">Coleccion</option>
                  </select>
                  <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-white">▼</span>
                </div>

                <div className="relative w-full sm:w-auto flex-1">
                  <select 
                    value={franquicia}
                    onChange={(e) => setFranquicia(e.target.value)}
                    className="search-bar rounded-full py-2 px-4 sm:px-6 pr-8 sm:pr-10 outline-none appearance-none cursor-pointer text-sm font-medium w-full transition-all"
                    style={{ color: 'white' }}
                  >
                    <option value="">Selecciona franquicia</option>
                    {franquicias.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-white">▼</span>
                </div>
              </div>

              {/* Titulo y Cantidad */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-[4] w-full">
                  <label className="block text-sm font-bold mb-2 ml-1 tracking-tight highlight">Titulo</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full bg-transparent rounded-2xl py-2 px-4 outline-none transition-all"
                    style={{ 
                      border: `2px dashed var(--border-color)`,
                      color: 'var(--primary-text-color)'
                    }}
                    placeholder="Ej: Carta rara de Pokemon"
                  />
                </div>
                
                {tipoPublicacion !== 'coleccion' && tipoPublicacion !== '' && (
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold mb-2 ml-1 tracking-tight highlight">Cantidad</label>
                    <input
                      type="number"
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value))}
                      className="w-full bg-transparent rounded-2xl py-2 px-4 outline-none text-center transition-all"
                      style={{ 
                        border: `2px dashed var(--border-color)`,
                        color: 'var(--primary-text-color)'
                      }}
                      min="1"
                    />
                  </div>
                )}
              </div>

              {/* Precio (solo venta) */}
              {tipoPublicacion === 'venta' && (
                <div>
                  <label className="block text-sm font-bold mb-2 ml-1 tracking-tight highlight">Precio</label>
                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full bg-transparent rounded-2xl py-2 px-4 outline-none transition-all"
                    style={{ 
                      border: `2px dashed var(--border-color)`,
                      color: 'var(--primary-text-color)'
                    }}
                    placeholder="$0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {/* Imagenes (venta e intercambio) */}
              {(tipoPublicacion === 'venta' || tipoPublicacion === 'intercambio') && (
                <div>
                  <label className="block text-sm font-bold mb-2 ml-1 tracking-tight highlight">
                    Imagenes de la carta
                    <span className="text-xs opacity-70 ml-2">(Maximo 10 imagenes)</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imagenesVenta.map((img) => (
                      <div key={img.id} className="relative group">
                        <div className="relative pt-[100%] rounded-xl overflow-hidden transition-all" style={{ 
                          border: `2px solid var(--border-color)`,
                          backgroundColor: 'var(--background-slate)'
                        }}>
                          <img
                            src={img.preview}
                            alt={img.nombre}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <button
                            onClick={() => eliminarImagen(img.id)}
                            className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <span className="text-white text-xs sm:text-sm font-bold">X</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {imagenesVenta.length < 10 && (
                      <div className="relative group">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
                          multiple
                          onChange={handleImagenesChange}
                          className="hidden"
                          id="imagenes-input"
                        />
                        <label htmlFor="imagenes-input" className="cursor-pointer block">
                          <div className="relative pt-[100%] rounded-xl overflow-hidden transition-all group" style={{ 
                            border: `2px dashed var(--border-color)`,
                            backgroundColor: 'var(--background-slate)'
                          }}>
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">📸</span>
                              <p className="text-xs text-center px-2" style={{ color: 'var(--secondary-text-color)' }}>
                                {imagenesVenta.length === 0 ? 'Agregar imagenes' : 'Agregar mas'}
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {imagenesVenta.length > 0 && (
                    <p className="text-xs mt-3 text-center highlight">
                      {imagenesVenta.length} / 10 imagenes seleccionadas
                    </p>
                  )}

                  {erroresImagen.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444' }}>
                      {erroresImagen.map((error, idx) => (
                        <p key={idx} className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Seleccion de cartas para coleccion */}
              {tipoPublicacion === 'coleccion' && (
                <div>
                  <label className="block text-sm font-bold mb-2 ml-1 tracking-tight highlight">
                    Cartas en tu coleccion
                    <span className="text-xs opacity-70 ml-2">(Puedes seleccionar varias)</span>
                  </label>

                  <div
                    className={`w-full min-h-[200px] border-2 border-dashed rounded-3xl p-4 transition-all cursor-pointer
                      ${selectedCartas.length > 0 ? 'bg-opacity-40' : ''}`}
                    style={{ 
                      borderColor: 'var(--border-color)',
                      backgroundColor: selectedCartas.length > 0 ? 'var(--background-slate)' : 'transparent'
                    }}
                    onClick={() => {
                      if (!franquicia) {
                        alert('Selecciona una franquicia antes de elegir cartas');
                        return;
                      }
                      setShowGalleryModal(true);
                    }}
                  >
                    {selectedCartas.length > 0 ? (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm font-semibold highlight">
                            {selectedCartas.length} carta{selectedCartas.length !== 1 ? 's' : ''} seleccionada{selectedCartas.length !== 1 ? 's' : ''}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCartas([]);
                            }}
                            className="text-xs underline transition-colors"
                            style={{ color: '#ef4444' }}
                          >
                            Limpiar todas
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedCartas.map((carta) => (
                            <div key={carta.id} className="relative group rounded-xl p-2" style={{ 
                              backgroundColor: 'var(--background-slate)',
                              border: `1px solid var(--border-color)`
                            }}>
                              <div className="flex gap-2">
                                <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--background-slate)' }}>
                                  <img
                                    src={carta.imagen}
                                    alt={carta.nombre}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/300x450/1e293b/56ab91?text=Imagen+No+Encontrada';
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate" style={{ color: 'var(--primary-text-color)' }}>{carta.nombre}</p>
                                  <p className="text-[10px] capitalize" style={{ color: 'var(--secondary-text-color)' }}>{carta.franquicia}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    eliminarCarta(carta.id);
                                  }}
                                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                                  style={{ backgroundColor: '#ef4444' }}
                                >
                                  <span className="text-white text-[10px]">X</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowGalleryModal(true);
                          }}
                          className="mt-3 text-xs underline transition-colors highlight"
                        >
                          + Agregar mas cartas
                        </button>
                      </div>
                    ) : (
                      <div className="h-[200px] flex flex-col items-center justify-center">
                        <div className="button px-4 py-2 rounded-xl shadow-lg transition-all group">
                          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary-text-color)' }}>
                            Seleccionar cartas para tu coleccion
                          </span>
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'var(--secondary-text-color)' }}>Haz clic para seleccionar multiples cartas</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descripcion */}
              <div>
                <label className="block text-sm font-bold mb-2 ml-1 tracking-tight highlight">Descripcion</label>
                <textarea
                  rows="4"
                  className="w-full bg-transparent rounded-3xl py-3 sm:py-4 px-4 outline-none resize-none text-sm transition-all"
                  style={{ 
                    border: `2px dashed var(--border-color)`,
                    color: 'var(--primary-text-color)'
                  }}
                  placeholder={tipoPublicacion === 'coleccion'
                    ? 'Describe tu coleccion...'
                    : tipoPublicacion === 'venta'
                      ? 'Describe la carta que vendes (estado, rareza, detalles)...'
                      : tipoPublicacion === 'intercambio'
                        ? 'Describe la carta que ofreces para intercambio...'
                        : 'Selecciona un tipo de publicacion primero...'}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              {/* Boton Publicar */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handlePublicar}
                  type="button"
                  className={`button font-black py-3 px-8 sm:px-24 rounded-xl shadow-lg transform active:scale-95 transition-all uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs sm:text-sm
                    ${!tipoPublicacion ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    backgroundColor: !tipoPublicacion ? 'var(--button-color)' : 'var(--button-color)',
                    color: 'white'
                  }}
                  disabled={!tipoPublicacion}
                  onMouseEnter={(e) => {
                    if (tipoPublicacion) {
                      e.target.style.backgroundColor = 'var(--hover-button-color)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tipoPublicacion) {
                      e.target.style.backgroundColor = 'var(--button-color)';
                    }
                  }}
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Gallery
        isOpen={showGalleryModal}
        franquicia={franquicia}
        setFranquicia={setFranquicia}
        selectedCartas={selectedCartas}
        setSelectedCartas={setSelectedCartas}
        onSelectCartas={handleSelectCartas}
        onClose={() => setShowGalleryModal(false)}
      />
    </>
  );
};

export default PublicarCarta;
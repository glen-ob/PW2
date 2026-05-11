import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../componentes/Layout/Navbar';
import Avatar from '../componentes/Avatar';
import CartaConEfecto from '../componentes/Cards/CartaConEfecto';
import '../App.css';
import '../pantallas/index.css';
import '../componentes/Cards/cartas_efecto.css';

const PerfilPublico = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cartasUsuario, setCartasUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCartas, setLoadingCartas] = useState(true);
  const [carruselIndex, setCarruselIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  //Para hacer carruseles independientes
  const [carruseles, setCarruseles] = useState({});
  const getCarrusel = (colId, total) => {
    return carruseles[colId] || { index: 0, animando: false, total };
  };

  //Aquí se guardarán las collections del usuario
  const [collections, setCollections] = useState([]);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!userId) {
        navigate('/');
        return;
      }
      
      try {
        const response = await axios.get(`http://localhost:3000/api/usuarios/${userId}`);
        setUsuario(response.data);
      } catch (error) {
        console.error('Error cargando usuario:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [userId, navigate]);

    useEffect(() => {
      const fetchColecciones = async () => {
        try {

          const res = await axios.get(
            `http://localhost:3000/api/colecciones/usuario/${userId}`
          );

          const colecciones = res.data.colecciones;

          setCollections(colecciones);

          if (colecciones.length > 0) {

            const cartas = colecciones[0].deck.map(c => ({
              id: c._id,
              nombre: c.nombre,
              imagen: c.imagen,
              rareza: c.rareza || 'N/A'
            }));

            setCartasUsuario(cartas);
          }

        } catch (error) {
          console.error('Error cargando colecciones:', error);
        } finally {
          setLoadingCartas(false);
        }
      };

      if (userId) {
        fetchColecciones();
      }

    }, [userId]);

  const cartasMostrar = cartasUsuario.slice(0, 10);
  const totalCartas = cartasMostrar.length;


  const siguienteCarrusel = (colId, total) => {
    const carrusel = getCarrusel(colId, total);

    if (!carrusel.animando && total > 0) {
      setCarruseles(prev => ({
        ...prev,
        [colId]: {
          ...carrusel,
          animando: true,
          index: (carrusel.index + 1) % total
        }
      }));

      setTimeout(() => {
        setCarruseles(prev => ({
          ...prev,
          [colId]: {
            ...prev[colId],
            animando: false
          }
        }));
      }, 500);
    }
  };

  const anteriorCarrusel = (colId, total) => {
    const carrusel = getCarrusel(colId, total);

    if (!carrusel.animando && total > 0) {
      setCarruseles(prev => ({
        ...prev,
        [colId]: {
          ...carrusel,
          animando: true,
          index: (carrusel.index - 1 + total) % total
        }
      }));

      setTimeout(() => {
        setCarruseles(prev => ({
          ...prev,
          [colId]: {
            ...prev[colId],
            animando: false
          }
        }));
      }, 500);
    }
  };



  const getCartaStyle = (idx, colId, total) => {
    const { index } = getCarrusel(colId, total);

    let relativeIndex = (idx - index + total) % total;

    if (relativeIndex > total / 2) {
      relativeIndex -= total;
    }

    const position = relativeIndex;
    const abs = Math.abs(position);

    return {
      transform: `translateX(${position * 220}px) rotateY(${position * -25}deg) scale(${position === 0 ? 1.2 : 1 - abs * 0.15})`,
      opacity: position === 0 ? 1 : Math.max(0.4, 1 - abs * 0.3),
      zIndex: position === 0 ? 20 : 10 - abs,
      filter: `blur(${position === 0 ? 0 : abs * 2}px)`,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-white">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 overflow-x-hidden">
      <Navbar />
      
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-[#2d2a3e] px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          ← Volver
        </button>
      </div>

      {/* Tarjeta de perfil */}
      <div className="border-2 border-[#56ab91] rounded-[30px] p-8 mb-8 relative bg-slate-900/50">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Avatar - AHORA USA EL COMPONENTE CORRECTAMENTE */}
          <Avatar 
            fotoPerfil={usuario.fotoPerfil}
            nombre={usuario.nombre}
            size="w-40 h-40"
            textSize="text-6xl"
            borderColor="border-[#2d2a3e]"
          />

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2">{usuario.nombre}</h1>
            <p className="text-emerald-400 mb-1">@{usuario.nickname}</p>
            <p className="text-gray-400 mb-2">Miembro desde: {formatearFecha(usuario.createdAt)}</p>
            <p className="text-emerald-400 mb-2 font-bold">Colección: {cartasUsuario.length} cartas</p>
            {usuario.bio && (
              <p className="text-gray-300 max-w-md italic">
                {usuario.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sección de colección */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-emerald-400 mb-6 text-center">
          Colección de {usuario.nombre}
        </h2>
        
        {collections.map((col) => {
          const cartas = col.deck.map(c => ({
            id: c._id,
            nombre: c.nombre,
            imagen: c.imagenUrl,
            rareza: c.rareza || 'N/A',
            descripcion: c.descripcion || 'Sin descripción'
          }));

          const cartasMostrar = cartas.slice(0, 10);
          const total = cartasMostrar.length;
          const { index } = getCarrusel(col._id, total);

          return (
            <div key={col._id} className="mb-12">
              <h2 className="text-2xl font-bold highlight">
                {col.idFranquicia?.nombre || 'Colección'}
              </h2>

              {!loadingCartas && cartasMostrar.length > 0 && (
                <div className="mb-12">
                  <div className="flex justify-between items-center mb-6 px-4">
                    
                    
                  </div>

                  <div className="relative min-h-[500px] flex items-center justify-center">
                    <div className="relative w-full flex justify-center items-center" style={{ perspective: '1200px', overflow: 'visible' }}>
                      <div className="relative flex justify-center items-center" style={{ height: '450px' }}>

                        {cartasMostrar.map((carta, idx) => {
                          const style = getCartaStyle(idx, col._id, total);
                          const isCenter = (idx  - index + total) % total === 0;
                          
                          const handleCardNavigation = () => {
                            const diff = (idx - index + total) % total;
                            if (diff <= total / 2) {
                              for (let i = 0; i < diff; i++) {
                                siguienteCarrusel(col._id, total);
                              }
                            } else {
                              for (let i = 0; i < total - diff; i++) {
                                anteriorCarrusel(col._id, total);
                              }
                            }
                          };

                          return (
                            <div
                              key={carta.id}
                              className="absolute transition-all duration-500"
                              style={style}
                            >
                              <CartaConEfecto 
                                carta={carta}
                                isCenter={isCenter}
                                onClick={handleCardNavigation}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {total > 0 && (
                      <>
                        <button
                          onClick={() => anteriorCarrusel(col._id, total)}
                          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border hover:bg-emerald-600 transition-all z-30 hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => siguienteCarrusel(col._id, total)}
                          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 hover:bg-emerald-600 transition-all z-30 hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })}

      </div>
    </div>
  );
};

export default PerfilPublico;
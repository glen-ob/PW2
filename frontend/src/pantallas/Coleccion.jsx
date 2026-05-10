import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../componentes/Layout/navbar';
import PubliCard from '../componentes/Cards/PubliCard';
import Avatar from '../componentes/Avatar'; 
import { useReaccion } from '../hooks/useReaccion';
import '../App.css';
import '../index.css';
import axios from 'axios';

const Coleccion = () => {
  const navigate = useNavigate();
  const { usuario, token, isAuthenticated } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [imagenesPublicacion, setImagenesPublicacion] = useState([]);
  const [imagenActual, setImagenActual] = useState(0);
  const [publicacionActual, setPublicacionActual] = useState(null);
  const [publicacionIdActual, setPublicacionIdActual] = useState(null);
  const [modalComentarios, setModalComentarios] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [publicaciones, setPublicaciones] = useState([]);
  const [loadingPublicaciones, setLoadingPublicaciones] = useState(true);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  
  const comentarioInputRef = useRef(null);
  const comentarioValueRef = useRef('');


  const { 
    tieneLike: modalTieneLike, 
    cantidadLikes: modalCantidadLikes, 
    cargando: modalCargandoLike, 
    toggleLike: modalToggleLike,
    refreshLikes: modalRefreshLikes  
  } = useReaccion(publicacionIdActual);

  const formatearTiempo = (fecha) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const minutos = Math.floor(diff / 60000);
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias} d`;
  };

  const fetchComentarios = async (publicacionId) => {
    if (!publicacionId) return;
    
    setCargandoComentarios(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/publicaciones/${publicacionId}/comentarios`);
      console.log('Comentarios recibidos:', res.data);
      
      const comentariosMapeados = (res.data.comentarios || []).map(c => ({
        id: c._id,
        texto: c.texto,
        fecha: c.createdAt,
        usuario: {
          id: c.idUsuario?._id,
          nombre: c.idUsuario?.nombre,
          nickname: c.idUsuario?.nickname,
          fotoPerfil: c.idUsuario?.fotoPerfil
        }
      }));
      
      setModalComentarios(comentariosMapeados);
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      setModalComentarios([]);
    } finally {
      setCargandoComentarios(false);
    }
  };

  const fetchPublicaciones = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/publicaciones?tipo=coleccion');
      console.log('Publicaciones recibidas:', res.data.publicaciones);

      const pubs = res.data.publicaciones.map(p => {
        const cartas = p.Idconjunto?.deck?.length > 0
          ? p.Idconjunto.deck
          : p.CartasColeccion || [];

        return {
          id: p._id,
          usuario: p.Idusuario?.nombre || 'Usuario',
          usuarioId: p.Idusuario?._id,
          avatar: p.Idusuario?.fotoPerfil
            ? `http://localhost:3000${p.Idusuario.fotoPerfil}`
            : null,
          franquicia: p.Franquicia?.nombre || 'General',
          titulo: p.Titulo || '',
          descripcion: p.Texto || '',
          imagenes: cartas
            .map(c => {
              if (!c.imagen) return null;
              if (c.imagen.startsWith('http')) return c.imagen;
              if (c.imagen.startsWith('/uploads')) return `http://localhost:3000${c.imagen}`;
              return `http://localhost:3000/uploads/cartas/${c.imagen}`;
            })
            .filter(Boolean),
          likes: p.MeGusta || 0,
          comentariosCount: p.Comentarios?.length || 0,
          timestamp: formatearTiempo(p.createdAt)
        };
      });

      console.log('Publicaciones procesadas:', pubs.length);
      setPublicaciones(pubs);
    } catch (error) {
      console.error('Error cargando publicaciones:', error);
    } finally {
      setLoadingPublicaciones(false);
    }
  };

  useEffect(() => {
    fetchPublicaciones();
  }, []);

  
  const handleLikeChange = useCallback((publicacionId, nuevoEstado, nuevoContador) => {
    setPublicaciones(prev => prev.map(pub => 
      pub.id === publicacionId 
        ? { ...pub, likes: nuevoContador }
        : pub
    ));
  }, []);


  const handleComentarioChange = useCallback((publicacionId, nuevoContador) => {
    setPublicaciones(prev => prev.map(pub => 
      pub.id === publicacionId 
        ? { ...pub, comentariosCount: nuevoContador }
        : pub
    ));
    
    if (publicacionIdActual === publicacionId) {
      setPublicacionActual(prev => ({
        ...prev,
        comentariosCount: nuevoContador
      }));
      fetchComentarios(publicacionId);
    }
  }, [publicacionIdActual]);

  const abrirModal = (publicacion, indiceImagen) => {
    setPublicacionActual(publicacion);
    setPublicacionIdActual(publicacion.id);
    setImagenesPublicacion(publicacion.imagenes);
    setImagenActual(indiceImagen);
    setModalAbierto(true);
    comentarioValueRef.current = '';
    if (comentarioInputRef.current) comentarioInputRef.current.value = '';
    fetchComentarios(publicacion.id);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPublicacionActual(null);
    setPublicacionIdActual(null);
    setImagenesPublicacion([]);
    setImagenActual(0);
    setModalComentarios([]);
  
    setForceUpdateKey(prev => prev + 1);
  };

  const imagenSiguiente = () => setImagenActual((prev) => (prev + 1) % imagenesPublicacion.length);
  const imagenAnterior = () => setImagenActual((prev) => (prev - 1 + imagenesPublicacion.length) % imagenesPublicacion.length);

  const handleModalLike = async () => {
    if (!isAuthenticated) {
      alert('Inicia sesion para dar like');
      return;
    }
    
    const estadoAnterior = modalTieneLike;
    await modalToggleLike();
    await modalRefreshLikes(); 

    const nuevoContador = estadoAnterior ? modalCantidadLikes - 1 : modalCantidadLikes + 1;
    setPublicaciones(prev => prev.map(pub => 
      pub.id === publicacionIdActual 
        ? { ...pub, likes: nuevoContador }
        : pub
    ));
  };

  const handleModalComentario = async (e) => {
    e.preventDefault();
    const texto = comentarioValueRef.current;
    
    if (!texto.trim()) return;
    
    if (!isAuthenticated) {
      alert('Inicia sesion para comentar');
      return;
    }
    
    try {
      await axios.post(
        `http://localhost:3000/api/publicaciones/${publicacionIdActual}/comentarios`,
        { texto: texto.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchComentarios(publicacionIdActual);
      
      const nuevoContador = (publicacionActual?.comentariosCount || 0) + 1;
      setPublicacionActual(prev => ({
        ...prev,
        comentariosCount: nuevoContador
      }));
      
      setPublicaciones(prev => prev.map(pub => 
        pub.id === publicacionIdActual 
          ? { ...pub, comentariosCount: nuevoContador }
          : pub
      ));
      
      comentarioValueRef.current = '';
      if (comentarioInputRef.current) comentarioInputRef.current.value = '';
      
    } catch (error) {
      console.error('Error enviando comentario:', error);
      alert('No se pudo enviar el comentario: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loadingPublicaciones) {
    return (
      <div className="text-white text-center mt-10">
        Cargando publicaciones...
      </div>
    );
  }

  return (      
    <div className='App' id='App'>
      <div className="min-h-screen primary-text font-sans p-4">
       
        {modalAbierto && publicacionActual && (
          <>
            <style>{`
              .modal-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.55);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                z-index: 999999;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding: 3rem 1rem 2rem;
                box-sizing: border-box;
              }
              
              .modal-inner {
                position: relative;
                width: 100%;
                max-width: 900px;
              }
             
              .modal-close-btn {
                position: fixed;
                top: 0.75rem;
                right: 0.75rem;
                width: 2.25rem;
                height: 2.25rem;
                background: #dc2626;
                border-radius: 9999px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border: 2px solid white;
                cursor: pointer;
                z-index: 1000000;
                transition: transform 0.2s;
              }
              .modal-close-btn:hover { transform: scale(1.1); }

              .modal-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 1rem;
              }
              @media (min-width: 768px) {
                .modal-grid {
                  grid-template-columns: 1fr 1fr;
                  align-items: start;
                }
              }
             
              .modal-panel {
                border: 1.5px solid var(--border-color);
                border-radius: 1rem;
                background: var(--background-slate);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
              }
              
              .modal-nav-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 2.25rem;
                height: 2.25rem;
                background: var(--button-color);
                border-radius: 9999px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid var(--border-color);
                cursor: pointer;
                z-index: 10;
                transition: background 0.2s;
                color: var(--primary-text-color);
                font-size: 1.4rem;
              }
              .modal-nav-btn:hover { background: var(--hover-button-color); }

              .modal-like-btn {
                font-size: 1.6rem;
                background: none;
                border: none;
                cursor: pointer;
                transition: transform 0.2s;
                padding: 0.2rem;
                line-height: 1;
                flex-shrink: 0;
              }
              .modal-like-btn:hover { transform: scale(1.15); }
              .modal-like-btn:disabled { opacity: 0.5; cursor: not-allowed; }

              .modal-send-btn {
                color: var(--hightlight-text-color);
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                padding: 0.2rem 0.4rem;
                transition: transform 0.2s;
                flex-shrink: 0;
              }
              .modal-send-btn:hover { transform: translateX(3px); }
              .modal-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

              .modal-comment-input {
                background: transparent;
                flex: 1;
                outline: none;
                font-size: 0.75rem;
                color: var(--primary-text-color);
                border: none;
                padding: 0.2rem 0;
                min-width: 0;
              }
              .modal-comment-input::placeholder { color: var(--secondary-text-color); }

              .modal-scroll::-webkit-scrollbar { width: 4px; }
              .modal-scroll::-webkit-scrollbar-track { background: var(--background-slate); border-radius: 10px; }
              .modal-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
              .modal-scroll::-webkit-scrollbar-thumb:hover { background: var(--hightlight-text-color); }

              .modal-divider {
                height: 1px;
                background: var(--border-color);
                opacity: 0.35;
                margin: 0.6rem 0 0.5rem;
              }
            `}</style>

            <div className="modal-overlay" onClick={cerrarModal}>
              <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
                <button onClick={cerrarModal} className="modal-close-btn">
                  <span style={{ color: 'white', fontSize: '1.1rem' }}>✕</span>
                </button>

                <div className="modal-grid">
                  <div className="modal-panel" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    padding: '1rem',
                    minHeight: '280px'
                  }}>
                    {imagenesPublicacion.length > 1 && (
                      <>
                        <button className="modal-nav-btn" onClick={imagenAnterior} style={{ left: '0.5rem' }}>‹</button>
                        <button className="modal-nav-btn" onClick={imagenSiguiente} style={{ right: '0.5rem' }}>›</button>
                      </>
                    )}

                    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={imagenesPublicacion[imagenActual]}
                        alt={`Imagen ${imagenActual + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '60vh',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          borderRadius: '0.75rem',
                          display: 'block'
                        }}
                      />
                      {imagenesPublicacion.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0.5rem',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--button-color)',
                          border: '1px solid var(--border-color)',
                          padding: '0.15rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          color: 'var(--primary-text-color)'
                        }}>
                          {imagenActual + 1} / {imagenesPublicacion.length}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="modal-panel" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <h2 style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: 'var(--primary-text-color)',
                          margin: 0,
                          flex: 1,
                          paddingRight: '0.5rem'
                        }}>
                          {publicacionActual.titulo}
                        </h2>
                        <button
                          onClick={handleModalLike}
                          disabled={modalCargandoLike}
                          className="modal-like-btn"
                          style={{ color: modalTieneLike ? '#ec4899' : 'var(--secondary-text-color)' }}
                        >
                          {modalTieneLike ? '❤️' : '🤍'}
                        </button>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: 'var(--paragraph-color)', margin: '0.25rem 0' }}>
                        <span style={{ color: 'var(--hightlight-text-color)', fontWeight: 'bold' }}>Usuario:</span> {publicacionActual.usuario}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--paragraph-color)', margin: '0.25rem 0' }}>
                        <span style={{ color: 'var(--hightlight-text-color)', fontWeight: 'bold' }}>Fandom:</span> {publicacionActual.franquicia}
                      </p>

                      <div className="modal-divider" />

                      <p style={{
                        fontWeight: 'bold',
                        color: 'var(--hightlight-text-color)',
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '0 0 0.25rem'
                      }}>
                        Descripcion:
                      </p>
                      <p style={{
                        color: 'var(--paragraph-color)',
                        fontSize: '0.78rem',
                        lineHeight: '1.5',
                        textAlign: 'justify',
                        margin: 0
                      }}>
                        {publicacionActual.descripcion}
                      </p>

                      <div style={{ marginTop: '0.6rem' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--secondary-text-color)', margin: '0.2rem 0' }}>
                          Publicado: {publicacionActual.timestamp}
                        </p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--secondary-text-color)', margin: '0.2rem 0' }}>
                          {modalTieneLike ? '❤️' : '🤍'} {modalCantidadLikes} Me gusta
                        </p>
                      </div>
                    </div>
                    
                    <div className="modal-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h3 style={{
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--hightlight-text-color)',
                        margin: 0
                      }}>
                        Comentarios ({publicacionActual.comentariosCount || modalComentarios.length})
                      </h3>

                      <div className="modal-scroll" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        paddingRight: '0.25rem'
                      }}>
                        {cargandoComentarios ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            color: 'var(--secondary-text-color)',
                            fontSize: '0.75rem'
                          }}>
                            Cargando comentarios...
                          </div>
                        ) : modalComentarios.length > 0 ? (
                          modalComentarios.map((comentario) => (
                            <div key={comentario.id} style={{
                              backgroundColor: comentario.usuario?.id === usuario?.id
                                ? 'var(--hover-button-color)'
                                : 'var(--button-color)',
                              padding: '0.5rem',
                              borderRadius: '0.65rem',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.5rem',
                              border: '1px solid var(--border-color)'
                            }}>
                              <div style={{ width: '1.6rem', height: '1.6rem', flexShrink: 0 }}>
                                <Avatar
                                  fotoPerfil={comentario.usuario?.fotoPerfil}
                                  nombre={comentario.usuario?.nombre || 'Usuario'}
                                  size="w-full h-full"
                                  textSize="text-xs"
                                  borderColor="border-transparent"
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--hightlight-text-color)' }}>
                                    {comentario.usuario?.nickname || comentario.usuario?.nombre || 'Usuario'}
                                    {comentario.usuario?.id === usuario?.id && (
                                      <span style={{ fontSize: '0.6rem', marginLeft: '0.4rem', color: 'var(--border-color)' }}>(Tu)</span>
                                    )}
                                  </span>
                                  {comentario.fecha && (
                                    <span style={{ fontSize: '0.55rem', color: 'var(--secondary-text-color)' }}>
                                      {formatearTiempo(comentario.fecha)}
                                    </span>
                                  )}
                                </div>
                                <p style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--primary-text-color)',
                                  marginTop: '0.15rem',
                                  lineHeight: '1.4',
                                  wordBreak: 'break-word',
                                  margin: '0.15rem 0 0'
                                }}>
                                  {comentario.texto}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            color: 'var(--secondary-text-color)',
                            fontSize: '0.75rem'
                          }}>
                            No hay comentarios aun. ¡Se el primero!
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleModalComentario} style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.65rem',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--button-color)'
                      }}>
                        <div style={{ width: '1.6rem', height: '1.6rem', flexShrink: 0 }}>
                          <Avatar
                            fotoPerfil={usuario?.fotoPerfil}
                            nombre={usuario?.nombre}
                            size="w-full h-full"
                            textSize="text-xs"
                            borderColor="border-transparent"
                          />
                        </div>
                        <input
                          ref={comentarioInputRef}
                          type="text"
                          placeholder={isAuthenticated 
                            ? `Comentar como ${usuario?.nombre || 'Usuario'}...`
                            : "Inicia sesion para comentar"}
                          className="modal-comment-input"
                          autoComplete="off"
                          disabled={!isAuthenticated}
                          onChange={(e) => { comentarioValueRef.current = e.target.value; }}
                        />
                        <button 
                          type="submit" 
                          className="modal-send-btn"
                          disabled={!isAuthenticated}
                        >
                          ➤
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      
        <Navbar />
        
        <div className="max-w-4xl mx-auto space-y-4">
         {publicaciones.map((pub) => (
          <PubliCard 
            key={`${pub.id}-${forceUpdateKey}`} 
            publicacion={pub}
            abrirModal={abrirModal} 
            usuarioActual={usuario}
            tokenActual={token}
            onLikeChange={handleLikeChange}
            onComentarioChange={handleComentarioChange}
            forceUpdateKey={forceUpdateKey}
          />
        ))}
        </div>
      </div>
    </div>
  );
};

export default Coleccion;
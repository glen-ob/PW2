import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useReaccion } from '../../hooks/useReaccion';
import { useAuth } from '../../../context/AuthContext';

const PubliCard = ({ 
  publicacion,
  abrirModal,
  usuarioActual,
  tokenActual,
  onLikeChange,
  onComentarioChange,
  forceUpdateKey
}) => {
  const { usuario: usuarioContext } = useAuth();
  const usuario = usuarioActual || usuarioContext;
  
  const { 
    tieneLike, 
    cantidadLikes, 
    cargando, 
    toggleLike,
    refreshLikes  
  } = useReaccion(publicacion.id);
  
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentariosLocal, setComentariosLocal] = useState(publicacion?.comentarios || []);

  
  useEffect(() => {
    if (forceUpdateKey) {
      refreshLikes(); 
    }
  }, [forceUpdateKey, refreshLikes]);
  
  useEffect(() => {
    if (mostrarComentarios && publicacion.id) {
      fetchComentarios();
    }
  }, [mostrarComentarios, publicacion.id]);
  
  const fetchComentarios = async () => {
    try {
      const token = tokenActual || localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/api/publicaciones/${publicacion.id}/comentarios`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const comentariosMapeados = (response.data.comentarios || []).map(c => ({
        id: c._id,
        texto: c.texto,
        fecha: c.createdAt,
        usuario: {
          id: c.idUsuario?._id,
          nickname: c.idUsuario?.nickname,
          nombre: c.idUsuario?.nombre,
          fotoPerfil: c.idUsuario?.fotoPerfil
        }
      }));
      
      setComentariosLocal(comentariosMapeados);
      
      if (onComentarioChange) {
        onComentarioChange(publicacion.id, comentariosMapeados.length);
      }
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    }
  };
  
  const handleLike = async () => {
    const estadoAnterior = tieneLike;
    await toggleLike();
    
   
    await refreshLikes();
    
    
    const nuevoContador = estadoAnterior ? cantidadLikes - 1 : cantidadLikes + 1;
    
    if (onLikeChange) {
      onLikeChange(publicacion.id, !estadoAnterior, nuevoContador);
    }
  };
  
  const handleAgregarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    
    try {
      const token = tokenActual || localStorage.getItem("token");
      
      await axios.post(
        `http://localhost:3000/api/publicaciones/${publicacion.id}/comentarios`, 
        { texto: nuevoComentario },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchComentarios();
      setNuevoComentario('');
      
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      alert('Error al comentar: ' + (error.response?.data?.message || error.message));
    }
  };
  
  if (!publicacion) return null;
  
  const likesCount = cantidadLikes;
  const comentariosCount = comentariosLocal.length;
  
  return (
    <div className="bg-slate-900/60 rounded-xl border border-[#56ab91]/30 overflow-hidden hover:border-[#56ab91]/60 transition-all shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#56ab91]">
            <img
              src={publicacion.avatar}
              alt={publicacion.usuario}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
                {publicacion.usuario}
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-gray-400 text-xs">{publicacion.timestamp}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-emerald-400">{publicacion.franquicia}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors text-sm">
          ⋯
        </button>
      </div>

      {/* Contenido */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1">
          <h1 className="font-bold text-base text-white mb-1">{publicacion.titulo}</h1>
        </div>
        <h2 className="text-gray-300 text-xs leading-relaxed text-justify">
          {publicacion.descripcion}
        </h2>
      </div>

      {/* Imágenes */}
      {publicacion.imagenes && publicacion.imagenes.length > 0 && (
        <div className={`grid gap-0.5 bg-black/20 ${
          publicacion.imagenes.length === 1 ? 'grid-cols-1' :
          publicacion.imagenes.length === 2 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {publicacion.imagenes.slice(0, 4).map((img, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden bg-slate-800 cursor-pointer ${
                publicacion.imagenes.length === 3 && idx === 0 ? 'row-span-2' : ''
              }`}
              style={{ paddingBottom: '60%' }}
              onClick={() => {
                if (abrirModal && typeof abrirModal === 'function') {
                  abrirModal(publicacion, idx);
                }
              }}
            >
              <img
                src={img}
                alt={`Imagen ${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {publicacion.imagenes.length === 4 && idx === 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center hover:bg-black/60 transition-colors">
                  <span className="text-white font-bold text-sm">
                    +{publicacion.imagenes.length - 3}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      <div className="px-3 py-1.5 border-t border-[#56ab91]/20 flex justify-between text-xs text-gray-400">
        <button 
          onClick={handleLike}
          disabled={cargando}
          className="flex items-center gap-1 hover:text-pink-500 transition-colors"
        >
          <span>{tieneLike ? '❤️' : '🤍'}</span>
          <span>{likesCount}</span>
        </button>
        <button 
          onClick={() => setMostrarComentarios(!mostrarComentarios)}
          className="hover:text-emerald-400 transition-colors"
        >
          {comentariosCount} comentarios
        </button>
      </div>

      {/* Botones de acción */}
      <div className="px-3 py-1.5 border-t border-[#56ab91]/20 flex gap-2">
        <button 
          onClick={handleLike}
          disabled={cargando}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-xs ${
            tieneLike ? 'text-pink-500' : 'text-gray-300'
          }`}
        >
          <span className={`text-base ${tieneLike ? 'text-pink-500' : ''}`}>
            {tieneLike ? '❤️' : '🤍'}
          </span>
          <span className="font-medium highlight">Me gusta</span>
        </button>
        <button 
          onClick={() => setMostrarComentarios(!mostrarComentarios)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-gray-300 hover:text-emerald-400 text-xs"
        >
          <span className="text-base">💬</span>
          <span className="font-medium highlight">Comentar</span>
        </button>
      </div>

      {/* Sección de comentarios */}

      {mostrarComentarios && (
        <div className="px-3 pb-3 pt-1 border-t border-[#56ab91]/20">
          <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
            {comentariosLocal.length > 0 ? (
              comentariosLocal.map((comentario) => (
                <div key={comentario.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={
                        comentario.usuario?.fotoPerfil 
                          ? comentario.usuario.fotoPerfil.startsWith('http') 
                            ? comentario.usuario.fotoPerfil 
                            : `http://localhost:3000${comentario.usuario.fotoPerfil}`
                          : "https://media.tenor.com/pgRHsHG3M2MAAAAe/gato-serio.png"
                      } 
                      alt={comentario.usuario?.nickname || 'Usuario'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 bg-slate-800/50 rounded-lg px-2 py-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-semibold text-xs focus block">
                        {comentario.usuario?.nickname || comentario.usuario?.nombre || 'Usuario'}
                      </span>
                    </div>
                    <p className=" text-xs text-justify leading-relaxed">
                      {comentario.texto}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-xs text-center py-2">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </p>
            )}
          </div>

          <form onSubmit={handleAgregarComentario} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={usuario?.fotoPerfil 
                  ? usuario.fotoPerfil.startsWith('http') 
                    ? usuario.fotoPerfil 
                    : `http://localhost:3000${usuario.fotoPerfil}`
                  : "https://media.tenor.com/pgRHsHG3M2MAAAAe/gato-serio.png"
                } 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="w-full bg-slate-800 rounded-full py-1.5 px-3 pr-10 outline-none border border-[#56ab91]/30 focus:border-[#56ab91] text-xs text-white placeholder-gray-500"
                placeholder="Escribe un comentario..."
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 transition-colors px-2"
              >
                ➤
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PubliCard;
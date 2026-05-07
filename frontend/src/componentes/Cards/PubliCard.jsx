
import axios from 'axios';
import React, { useState } from 'react';
import { useReaccion } from '../../hooks/useReaccion';
import { useAuth } from '../../../context/AuthContext';

const PubliCard = ({ publicacion, abrirModal }) => {
  const { usuario } = useAuth();
  const { tieneLike, cantidadLikes, cargando, toggleLike } = useReaccion(
    publicacion.id,
    usuario?.id
  );
  
  const [comentarios, setComentarios] = useState(publicacion?.comentarios || []);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [mostrarComentarios, setMostrarComentarios] = useState(false);

  const handleLike = async () => {
    await toggleLike();
  };

const handleAgregarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    
    try {
      const token = localStorage.getItem("token");
      console.log(' Enviando comentario a:', `http://localhost:3000/api/publicaciones/${publicacion.id}/comentarios`);
      
      const response = await axios.post(
        `http://localhost:3000/api/publicaciones/${publicacion.id}/comentarios`, 
        { texto: nuevoComentario },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(' Comentario enviado:', response.data);
      
     
      const nuevoComentarioObj = {
        id: response.data.comentario._id,
        texto: nuevoComentario,
        fecha: new Date(),
        usuario: {
          nickname: usuario?.nickname,
          nombre: usuario?.nombre,
          fotoPerfil: usuario?.fotoPerfil
        }
      };
      
      setComentarios([...comentarios, nuevoComentarioObj]);
      setNuevoComentario('');
      
      // Actualizar el contador en la publicación si es necesario
      if (publicacion.onComentarioAdded) {
        publicacion.onComentarioAdded();
      }
    } catch (error) {
      console.error(' Error al agregar comentario:', error);
      console.error(' Detalles:', error.response?.data);
      alert('Error al comentar: ' + (error.response?.data?.message || error.message));
    }
};
  if (!publicacion) return null;

  return (
    <div className="bg-slate-900/60 rounded-xl border border-[#56ab91]/30 overflow-hidden hover:border-[#56ab91]/60 transition-all shadow-lg">
      {/* Header más compacto */}
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
              onClick={() => abrirModal(publicacion, idx)}
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
          <span>{cantidadLikes}</span>
        </button>
        <button 
          onClick={() => setMostrarComentarios(!mostrarComentarios)}
          className="hover:text-emerald-400 transition-colors"
        >
          {comentarios.length} comentarios
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
          <span className="font-medium">Me gusta</span>
        </button>
        <button 
          onClick={() => setMostrarComentarios(!mostrarComentarios)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-gray-300 hover:text-emerald-400 text-xs"
        >
          <span className="text-base">💬</span>
          <span className="font-medium">Comentar</span>
        </button>
      </div>

      {/* Sección de comentarios (igual que antes) */}
      {mostrarComentarios && (
        <div className="px-3 pb-3 pt-1 border-t border-[#56ab91]/20">
          {/* ... mantener la misma estructura de comentarios ... */}
          <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
            {comentarios.length > 0 ? (
              comentarios.map((comentario, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={comentario.usuario?.fotoPerfil || "https://media.tenor.com/pgRHsHG3M2MAAAAe/gato-serio.png"} 
                      alt={comentario.usuario?.nickname} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 bg-slate-800/50 rounded-lg px-2 py-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-semibold text-xs text-emerald-400 block">
                        {comentario.usuario?.nickname || 'Usuario'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs text-justify leading-relaxed">
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
                src={usuario?.fotoPerfil ? `http://localhost:3000${usuario.fotoPerfil}` : "https://media.tenor.com/pgRHsHG3M2MAAAAe/gato-serio.png"} 
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
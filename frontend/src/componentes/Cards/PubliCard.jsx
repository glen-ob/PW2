import React, { useState } from 'react';

const PubliCard = ({ publicacion, abrirModal }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(publicacion?.likes || 0);
  const [comentarios, setComentarios] = useState(publicacion?.comentarios || []);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [mostrarComentarios, setMostrarComentarios] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
      setLiked(false);
    } else {
      setLikesCount(likesCount + 1);
      setLiked(true);
    }
  };

  const handleAgregarComentario = (e) => {
    e.preventDefault();
    if (nuevoComentario.trim()) {
      const nuevoComentarioObj = {
        usuario: "Tú",
        texto: nuevoComentario,
        avatar: "https://media.tenor.com/pgRHsHG3M2MAAAAe/gato-serio.png"
      };
      setComentarios([...comentarios, nuevoComentarioObj]);
      setNuevoComentario('');
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

      
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1">
        <h1 className="font-bold text-base text-white mb-1">{publicacion.titulo}</h1>
        </div>
        <h2 className="text-gray-300 text-xs leading-relaxed text-justify">
          {publicacion.descripcion}
        </h2>
      </div>

     
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

      <div className="px-3 py-1.5 border-t border-[#56ab91]/20 flex justify-between text-xs text-gray-400">
        <button 
          onClick={handleLike}
          className="flex items-center gap-1 hover:text-pink-500 transition-colors"
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likesCount}</span>
        </button>
        <button 
          onClick={() => setMostrarComentarios(!mostrarComentarios)}
          className="hover:text-emerald-400 transition-colors"
        >
          {comentarios.length} comentarios
        </button>
      </div>


      <div className="px-3 py-1.5 border-t border-[#56ab91]/20 flex gap-2">
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-xs ${
            liked ? 'text-pink-500' : 'text-gray-300'
          }`}
        >
          <span className={`text-base ${liked ? 'text-pink-500' : ''}`}>
            {liked ? '❤️' : '🤍'}
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

      
      {mostrarComentarios && (
        <div className="px-3 pb-3 pt-1 border-t border-[#56ab91]/20">
          
          <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
            {comentarios.length > 0 ? (
              comentarios.map((comentario, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={comentario.avatar} 
                      alt={comentario.usuario} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 bg-slate-800/50 rounded-lg px-2 py-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-semibold focus text-xs block">
                      {comentario.usuario}
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

          {/* Input para nuevo comentario */}
          <form onSubmit={handleAgregarComentario} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src="https://media.tenor.com/pgRHsHG3M2MAAAAe/gato-serio.png" 
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
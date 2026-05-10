
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { useReaccion } from '../../hooks/useReaccion';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios'; 
const Card = ({ card, onClick }) => {
  const { isAuthenticated, token } = useAuth();
  const { tieneLike, cantidadLikes, cargando, toggleLike } = useReaccion(card.id);
  const [totalComentarios, setTotalComentarios] = useState(card.comentariosCount || 0);


  const fetchComentariosCount = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/publicaciones/${card.id}/comentarios`);
      const count = response.data.totalComentarios || response.data.comentarios?.length || 0;
      setTotalComentarios(count);
      
    } catch (error) {
      console.error('Error obteniendo contador de comentarios:', error);
    }
  };

  useEffect(() => {
    fetchComentariosCount();
  }, [card.id]);

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert("Inicia sesión para dar like");
      return;
    }

    await toggleLike();
  };

  return (
    <div
      className="relative overflow-hidden cursor-pointer group bg-slate-800/40 border-2 border-[#56ab91]/20 rounded-xl sm:rounded-2xl transition-all duration-300 hover:border-[#56ab91]/50 hover:shadow-[0_0_20px_rgba(86,171,145,0.2)] hover:transform hover:scale-[1.02]"
      onClick={() => onClick(card)}
    >
      <div className="relative w-full pt-[100%] overflow-hidden">
        <img
          src={card.image || "https://via.placeholder.com/300x400/1e293b/56ab91?text=Imagen+Carta"}
          alt={card.fandom}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {card.isVenta && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-500/90 backdrop-blur-sm rounded-lg text-[8px] sm:text-[10px] font-bold text-white uppercase shadow-lg">
              Venta
            </span>
          )}
          {card.isIntercambio && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-blue-500/90 backdrop-blur-sm rounded-lg text-[8px] sm:text-[10px] font-bold text-white uppercase shadow-lg">
              Intercambio
            </span>
          )}
        </div>
      </div>
      
      <div className="p-2 sm:p-3">
        <div className="flex justify-between items-start gap-1 mb-1 sm:mb-2">
          <span className="text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 bg-[#56ab91]/20 rounded-full uppercase border border-[#56ab91]/30">
            {card.type || "Carta"}
          </span>
          <span className="text-xs sm:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#56ab91] to-[#3a8b6f]">
            {card.price}
          </span>
        </div>
        
        <h4 className="font-bold text-[10px] sm:text-xs text-[#56ab91] truncate">{card.fandom}</h4>
        <p className="text-white font-semibold text-xs sm:text-sm line-clamp-2 mt-0.5">{card.description}</p>
        <p className="text-gray-400 text-[9px] sm:text-xs italic line-clamp-1 mt-0.5">{card.reverse || "Edicion Estandar"}</p>
        
        <div className="flex justify-between items-center text-gray-500 border-t border-white/10 pt-2 mt-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={handleLikeClick}
              disabled={cargando}
              className={`flex items-center gap-1 transition-all transform hover:scale-110 active:scale-95 ${
                tieneLike ? 'text-rose-400' : 'hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all ${tieneLike ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span className="text-[8px] sm:text-[9px] font-medium">{cantidadLikes}</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClick(card);
              }}
              className="flex items-center gap-1 hover:text-sky-400 transition-all"
            >
              <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[8px] sm:text-[9px] font-medium">{totalComentarios}</span> {/* ✅ Mostrar contador real */}
            </button>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-slate-900 rounded-full text-[9px] sm:text-xs font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-xl">
          VER DETALLES
        </span>
      </div>
    </div>
  );
};

export default Card;
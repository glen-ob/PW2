import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, TrendingUp, Calendar, User } from 'lucide-react';
import axios from 'axios';
import '../../App.css';
import '../../pantallas/index.css';

const PublicacionesTopReport = ({ onClose }) => {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/reportes/top-publicaciones', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPublicaciones(response.data.data);
      } catch (err) {
        console.error('Error cargando publicaciones:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden" style={{ 
        backgroundColor: 'var(--background-slate)', 
        border: `2px solid var(--border-color)`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div className="flex justify-between items-center p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold highlight">
              Publicaciones con más reacciones
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 rounded-full transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: 'var(--button-color)' }}
          >
            <X size={20} className="sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {cargando && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <p className="mt-3 text-gray-400">Cargando publicaciones...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-400 mb-2">⚠️</div>
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && publicaciones.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No hay publicaciones con reacciones</p>
            </div>
          )}

          {!cargando && !error && publicaciones.length > 0 && (
            <div className="space-y-4">
              {publicaciones.map((pub, index) => (
                <div 
                  key={pub._id} 
                  className="bg-slate-800/30 rounded-xl p-4 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === pub._id ? null : pub._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                        #{index + 1}
                      </span>
                    </div>

                    {pub.imagen && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700">
                        <img 
                          src={pub.imagen} 
                          alt={pub.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ 
                          backgroundColor: 'rgba(86, 171, 145, 0.2)',
                          color: '#56ab91'
                        }}>
                          {pub.franquicia?.nombre || 'Sin franquicia'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-gray-300">
                          {pub.tipo === 'venta' ? '💰 Venta' : pub.tipo === 'intercambio' ? '🔄 Intercambio' : '📚 Colección'}
                        </span>
                      </div>

                      <h3 className="text-white font-semibold text-sm sm:text-base mb-2 line-clamp-2">
                        {pub.titulo}
                      </h3>

                      {expandedId === pub._id && pub.texto && (
                        <p className="text-gray-300 text-xs sm:text-sm mb-3">
                          {pub.texto}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Heart size={14} className="text-pink-500" />
                          <span>{pub.meGusta} reacciones</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={14} className="text-blue-400" />
                          <span>{pub.usuario?.nickname || 'Usuario'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-500" />
                          <span>{formatDate(pub.createdAt)}</span>
                        </div>
                      </div>

                      {!expandedId && pub.texto && (
                        <p className="text-gray-400 text-xs mt-2 line-clamp-1">
                          {pub.texto}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicacionesTopReport;
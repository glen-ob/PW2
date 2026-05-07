import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award, Users, FileText, Heart } from 'lucide-react';
import axios from 'axios';
import '../../App.css';
import '../../pantallas/index.css';

const UsuariosTopReport = ({ onClose }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/reportes/top-usuarios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuarios(response.data.data);
      } catch (err) {
        console.error('Error cargando usuarios:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const getMedalla = (index) => {
    if (index === 0) return <Trophy size={22} className="text-yellow-500" />;
    if (index === 1) return <Medal size={22} className="text-gray-400" />;
    if (index === 2) return <Medal size={22} className="text-amber-600" />;
    return <Award size={22} className="text-gray-600" />;
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
            <Users className="w-5 h-5 sm:w-6 sm:h-6 highlight" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold highlight">
              TOP 10 Usuarios más activos
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
              <p className="mt-3 text-gray-400">Cargando usuarios...</p>
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

          {!cargando && !error && usuarios.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No hay usuarios activos</p>
            </div>
          )}

          {!cargando && !error && usuarios.length > 0 && (
            <div className="space-y-3">
              {usuarios.map((usuario, index) => (
                <div 
                  key={usuario._id} 
                  className="bg-slate-800/30 rounded-xl p-4 hover:bg-slate-800/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center justify-center w-10 sm:w-12">
                      {getMedalla(index)}
                    </div>

                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                      {usuario.fotoPerfil ? (
                        <img 
                          src={`http://localhost:3000${usuario.fotoPerfil}`} 
                          alt={usuario.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg sm:text-xl font-bold text-emerald-400">
                          {usuario.nickname?.charAt(0).toUpperCase() || usuario.nombre?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2">
                        <span className="text-white font-semibold text-sm sm:text-base truncate">
                          {usuario.nickname || usuario.nombre}
                        </span>
                        <span className="text-emerald-400 font-bold text-sm sm:text-base">
                          {usuario.totalPublicaciones} publicaciones
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <FileText size={12} className="text-emerald-400" />
                          <span>{usuario.totalPublicaciones} posts</span>
                        </div>
                        {usuario.totalReacciones > 0 && (
                          <div className="flex items-center gap-1">
                            <Heart size={12} className="text-pink-500" />
                            <span>{usuario.totalReacciones} likes recibidos</span>
                          </div>
                        )}
                      </div>
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

export default UsuariosTopReport;
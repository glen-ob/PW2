import React, { useState, useEffect } from 'react';
import { X, Calendar, TrendingUp, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import axios from 'axios';
import '../../App.css';
import '../../pantallas/index.css';

const ActividadSemanalReport = ({ onClose }) => {
  const [actividad, setActividad] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [tipoActividad, setTipoActividad] = useState('publicaciones');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/reportes/actividad-semanal', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActividad(response.data.data);
      } catch (err) {
        console.error('Error cargando actividad:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const maxPublicaciones = Math.max(...actividad.map(d => d.total), 0);
  const maxReacciones = Math.max(...actividad.map(d => d.totalReacciones), 0);
  const valorActual = tipoActividad === 'publicaciones' ? maxPublicaciones : maxReacciones;

  const getBarHeight = (valor) => {
    const minHeight = 30;
    const maxHeight = isMobile ? 100 : 160;
    if (valorActual === 0) return `${minHeight}px`;
    return `${Math.max(minHeight, (valor / valorActual) * maxHeight)}px`;
  };

  const getBarColor = () => {
    return tipoActividad === 'publicaciones' 
      ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
      : 'bg-gradient-to-t from-pink-500 to-pink-400';
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
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 highlight" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold highlight">
              Actividad Semanal
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
              <p className="mt-3 text-gray-400">Cargando actividad...</p>
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

          {!cargando && !error && actividad.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No hay actividad en la última semana</p>
            </div>
          )}

          {!cargando && !error && actividad.length > 0 && (
            <div>
              {/* Selector de tipo de actividad */}
              <div className="flex justify-center gap-2 sm:gap-4 mb-6">
                <button
                  onClick={() => setTipoActividad('publicaciones')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    tipoActividad === 'publicaciones'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  📝 Publicaciones
                </button>
                <button
                  onClick={() => setTipoActividad('reacciones')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    tipoActividad === 'reacciones'
                      ? 'bg-pink-500 text-white'
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  ❤️ Reacciones
                </button>
              </div>

              {/* Gráfico de barras */}
              <div className="rounded-xl p-4 sm:p-6" style={{ backgroundColor: 'rgba(86, 171, 145, 0.05)' }}>
                <div className="flex gap-2 sm:gap-4 items-end justify-center h-48 sm:h-64">
                  {actividad.map((dia) => (
                    <div key={dia.dia} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full group">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${getBarColor()} hover:opacity-80 cursor-pointer`}
                          style={{ 
                            height: getBarHeight(tipoActividad === 'publicaciones' ? dia.total : dia.totalReacciones)
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] sm:text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {tipoActividad === 'publicaciones' ? `${dia.total} publicaciones` : `${dia.totalReacciones} reacciones`}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                        {dia.nombreDia.substring(0, isMobile ? 3 : 6)}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-bold ${
                        tipoActividad === 'publicaciones' ? 'text-emerald-400' : 'text-pink-400'
                      }`}>
                        {tipoActividad === 'publicaciones' ? dia.total : dia.totalReacciones}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'rgba(86, 171, 145, 0.2)' }}>
                <p className="text-xs text-gray-400">
                  📊 Datos de los últimos 7 días
                </p>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-400">Publicaciones</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    <span className="text-gray-400">Reacciones</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActividadSemanalReport;
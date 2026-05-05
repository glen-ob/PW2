import React, { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import axios from 'axios';
import '../../App.css';
import '../../pantallas/index.css';

const FandomsTopReport = ({ onClose }) => {
  const [fandoms, setFandoms] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/reportes/top-fandoms', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFandoms(response.data.data);
      } catch (err) {
        console.error('Error cargando fandoms:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const maxPublicaciones = fandoms.length > 0 ? fandoms[0].totalPublicaciones : 1;

  return (
    <div className="w-full">
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden" style={{ 
        backgroundColor: 'var(--background-slate)', 
        border: `2px solid var(--border-color)`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div className="flex justify-between items-center p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 highlight" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold highlight">
              Fandoms con mayor número de publicaciones
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
              <p className="mt-3 text-gray-400">Cargando datos...</p>
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

          {!cargando && !error && fandoms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No hay datos disponibles</p>
            </div>
          )}

          {!cargando && !error && fandoms.length > 0 && (
            <div className="space-y-4">
              {fandoms.map((fandom, index) => (
                <div key={fandom._id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl sm:text-2xl font-bold text-emerald-400 w-8">
                        #{index + 1}
                      </span>
                      <span className="text-white font-semibold text-sm sm:text-base">
                        {fandom.nombre}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm sm:text-base">
                      {fandom.totalPublicaciones} publicaciones
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2 sm:h-3" style={{ backgroundColor: 'rgba(86, 171, 145, 0.2)' }}>
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 sm:h-3 rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ width: `${(fandom.totalPublicaciones / maxPublicaciones) * 100}%` }}
                    />
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

export default FandomsTopReport;
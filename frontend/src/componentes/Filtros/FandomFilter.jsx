import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import '../../App.css'

const FandomFilter = ({ selectedFandoms, onFandomChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [fandoms, setFandoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch fandoms from backend
  useEffect(() => {
    const fetchFandoms = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:3000/api/franquicias');
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
       
        if (data.success && data.franquicias) {
          const formattedFandoms = data.franquicias.map(franquicia => ({
            id: franquicia._id,
            label: franquicia.nombre,
            slug: franquicia.slug
          }));
          
          setFandoms(formattedFandoms);
        } else {
          throw new Error('Formato de datos inválido');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching fandoms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFandoms();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectAll = () => {
    if (selectedFandoms.length === fandoms.length) {
      onFandomChange([]);
    } else {
      onFandomChange(fandoms.map(f => f.id));
    }
  };

  // Mostrar loading state
  if (loading) {
    return (
      <div className="w-full bg-slate-900/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-[#56ab91]/30 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold highlight text-sm sm:text-base flex items-center gap-2">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 highlight" /> 
            <span>Cargando franquicias...</span>
          </h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Mostrar error state
  if (error) {
    return (
      <div className="w-full bg-slate-900/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-red-500/30 shadow-xl">
        <div className="text-red-400 text-sm text-center">
          Error al cargar franquicias: {error}
        </div>
      </div>
    );
  }

  if (fandoms.length === 0) {
    return (
      <div className="w-full bg-slate-900/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-[#56ab91]/30 shadow-xl">
        <div className="text-gray-400 text-sm text-center">
          No hay franquicias disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-[#56ab91]/30 shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold highlight text-sm sm:text-base flex items-center gap-2">
          <Filter className="w-3 h-3 sm:w-4 sm:h-4 highlight" /> 
          <span>Filtrar por franquicia</span>
          {selectedFandoms.length > 0 && (
            <span className="text-[10px] sm:text-xs bg-[#56ab91]/30 px-1.5 sm:px-2 py-0.5 rounded-full">
              {selectedFandoms.length}
            </span>
          )}
        </h3>
        
        {/* botones de accion */}
        <div className="flex gap-2">
          {fandoms.length > 1 && !isMobile && (
            <button
              onClick={handleSelectAll}
              className="text-[9px] sm:text-xs text-[#56ab91] hover:text-[#6bcbad] transition-colors"
            >
              {selectedFandoms.length === fandoms.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-[#56ab91] transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
          )}
        </div>
      </div>
      
      <div className={`space-y-2 sm:space-y-3 ${isMobile && !isExpanded ? 'hidden' : ''}`}>
        {fandoms.map(fandom => (
          <label 
            key={fandom.id} 
            className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer border border-transparent w-full
              ${selectedFandoms.includes(fandom.id) 
                ? `bg-[#56ab91]/20 border-[#56ab91]/50 shadow-[0_0_10px_rgba(86,171,145,0.2)]` 
                : 'hover:bg-white/5'}`}
          >
            <input
              type="checkbox"
              checked={selectedFandoms.includes(fandom.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  onFandomChange([...selectedFandoms, fandom.id]);
                } else {
                  onFandomChange(selectedFandoms.filter(f => f !== fandom.id));
                }
              }}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border bg-transparent highlight focus:ring-[#56ab91] cursor-pointer"
            />
            <span className={`text-xs sm:text-sm font-medium ${
              selectedFandoms.includes(fandom.id) ? 'text-white' : 'text-gray-400'
            }`}>
              {fandom.label}
            </span>
          </label>
        ))}
      </div>

      {/* limpiar filtros*/}
      {isMobile && selectedFandoms.length > 0 && (
        <button
          onClick={() => onFandomChange([])}
          className="w-full mt-3 text-xs text-red-400 hover:text-red-300 transition-colors py-1"
        >
          Limpiar filtros ({selectedFandoms.length})
        </button>
      )}
    </div>
  );
};

export default FandomFilter;
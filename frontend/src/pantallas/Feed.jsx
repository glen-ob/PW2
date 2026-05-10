import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../componentes/Layout/navbar";
import LeftSidebar from "../componentes/Sidebar/LeftSidebar";
import FeedControls from "../componentes/Filtros/FeedControls";
import CardGrid from "../componentes/Cards/CardGrid";
import ReportesAside from "../componentes/Layout/ReportesAside";
import FandomFilter from "../componentes/Filtros/FandomFilter"; // Importa el nuevo componente
import '../App.css';
import '../pantallas/index.css';

import { useEffect } from 'react';
import axios from 'axios';

const Feed = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState("all");
  const [selectedFandoms, setSelectedFandoms] = useState([]);
  const [sortBy, setSortBy] = useState("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileReportsOpen, setMobileReportsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [fandomsList, setFandomsList] = useState([]); // Para guardar la lista de fandoms

  // Aquí se contendrán las publicaciones, traidas desde la BD
  const [publicaciones, setPublicaciones] = useState([]);

  // Cargar publicaciones
  useEffect(() => {
    const fetchPublicaciones = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/publicaciones?tipo=feed');
        setPublicaciones(res.data.publicaciones);
      } catch (error) {
        console.error('Error cargando publicaciones:', error);
      }
    };

    fetchPublicaciones();
  }, []);

  // Cargar fandoms desde el backend
  useEffect(() => {
    const fetchFandoms = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/franquicias');
        if (res.data.success && res.data.franquicias) {
          setFandomsList(res.data.franquicias);
        }
      } catch (error) {
        console.error('Error cargando franquicias:', error);
      }
    };
    fetchFandoms();
  }, []);

  // Mapear publicaciones a cards
  const cards = publicaciones.map(pub => ({
    id: pub._id,
    type: pub.Idusuario?.nickname || 'Usuario',
    fandom: pub.Franquicia?.nombre || 'Sin franquicia',
    fandomId: pub.Franquicia?._id,
    image: pub.fotosUrls && pub.fotosUrls.length > 0 
      ? pub.fotosUrls[0]
      : 'https://via.placeholder.com/300x400/1e293b/56ab91?text=Sin+Imagen',
    reverse: pub.Texto || 'Sin descripcion',
    description: pub.Titulo,
    price: pub.Monto ? `$${pub.Monto}` : '',
    cantidad: pub.Cantidad,
    isVenta: pub.Tipo === 'venta',
    isIntercambio: pub.Tipo === 'intercambio',
    isColeccion: pub.Tipo === 'coleccion', // Asegúrate de incluir este campo
    comentariosCount: pub.comentariosCount || 0
  }));

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filtro por fandom
  const filteredByFandom = selectedFandoms.length > 0
    ? cards.filter(card => selectedFandoms.includes(card.fandomId))
    : cards;

  // Filtro por tipo de publicación 
  const filteredByType = filteredByFandom.filter(card => {
    if (filterType === 'all') return true;
    if (filterType === 'sale') return card.isVenta === true;
    if (filterType === 'trade') return card.isIntercambio === true;
    if (filterType === 'coleccion') return card.isColeccion === true;
    return true;
  });

  // Ordenamiento
  const sortedCards = [...filteredByType].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': {
        const priceA = parseFloat(a.price?.replace('$', '') || 0);
        const priceB = parseFloat(b.price?.replace('$', '') || 0);
        return priceA - priceB;
      }
      case 'price_desc': {
        const priceA = parseFloat(a.price?.replace('$', '') || 0);
        const priceB = parseFloat(b.price?.replace('$', '') || 0);
        return priceB - priceA;
      }
      case 'recent':
        return new Date(b.id) - new Date(a.id); // Mejor usar fechas si las tienes
      default:
        return 0;
    }
  });

  const handleCardClick = (card) => {
    navigate(`/detalle/carta/${card.id}`);
  };

  // Función para obtener el nombre del fandom por su ID
  const getFandomName = (fandomId) => {
    const fandom = fandomsList.find(f => f._id === fandomId);
    return fandom ? fandom.nombre : fandomId;
  };

  return (
    <div className='App' id='App'>
      <div className="min-h-screen text-white font-sans flex flex-col pt-4"> 
        <Navbar />
        <div className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 pt-2 sm:pt-4 pb-6 sm:pb-8">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            
            {/* Sidebar desktop - AHORA USA FandomFilter */}
            <aside className="hidden md:block md:w-[260px] lg:w-[280px] flex-shrink-0">
              <div className="sticky top-4 space-y-6">
                <FandomFilter 
                  selectedFandoms={selectedFandoms} 
                  onFandomChange={setSelectedFandoms} 
                />
                <ReportesAside />
              </div>
            </aside>
            
            <main className="flex-1 flex flex-col min-w-0">
              <FeedControls
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterType={filterType}
                onFilterChange={setFilterType}
                onPublicarClick={() => navigate('/publicar')}
                isMobile={isMobile}
                onMobileFilterClick={() => setMobileFiltersOpen(true)}
                onMobileReportsClick={() => setMobileReportsOpen(true)}
              />
              
              {/* Indicador de filtros activos - ACTUALIZADO para usar nombres dinámicos */}
              {(filterType !== 'all' || selectedFandoms.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filterType !== 'all' && (
                    <span className="text-xs bg-[#56ab91]/20 px-2 py-1 rounded-full flex items-center gap-1">
                      {filterType === 'sale' ? 'Venta' : filterType === 'trade' ? 'Intercambio' : 'Colección'}
                      <button onClick={() => setFilterType('all')} className="ml-1 hover:text-red-400">×</button>
                    </span>
                  )}
                  {selectedFandoms.map(fandomId => (
                    <span key={fandomId} className="text-xs bg-[#56ab91]/20 px-2 py-1 rounded-full flex items-center gap-1">
                      {getFandomName(fandomId)}
                      <button onClick={() => setSelectedFandoms(prev => prev.filter(f => f !== fandomId))} className="ml-1 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="bg-slate-900/50 p-2 sm:p-3 md:p-5 rounded-2xl sm:rounded-3xl md:rounded-[32px] border-2 border shadow-2xl mt-3 sm:mt-4">
                {sortedCards.length === 0 ? (
                  <div className="text-center py-12">
                    <p>No hay cartas que coincidan con los filtros</p>
                    <button 
                      onClick={() => {
                        setFilterType('all');
                        setSelectedFandoms([]);
                      }}
                      className="mt-3 font-bold text-sm highlight underline"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <CardGrid 
                    cards={sortedCards}
                    onCardClick={handleCardClick}
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Filters Sidebar - ACTUALIZADO para usar FandomFilter */}
      {isMobile && mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-[85%] max-w-[320px] z-50 transform transition-transform duration-300 ease-out shadow-2xl overflow-y-auto rounded-r-2xl" style={{ backgroundColor: 'var(--background-slate)' }}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-bold highlight">Filtros</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: 'var(--button-color)', border: `1px solid var(--border-color)` }}>
                  <span className="text-sm font-bold">X</span>
                </button>
              </div>
              
              {/* Filtro de franquicias - usa el nuevo componente */}
              <FandomFilter 
                selectedFandoms={selectedFandoms} 
                onFandomChange={setSelectedFandoms} 
              />
              
              {/* Filtro de tipo dentro del sidebar */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="text-sm font-semibold highlight mb-3">Tipo de publicación</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'Todos'},
                    { value: 'sale', label: 'Venta' },
                    { value: 'trade', label: 'Intercambio' },
                    { value: 'coleccion', label: 'Colección'}
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterType(option.value);
                        setMobileFiltersOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all ${filterType === option.value ? 'bg-[#56ab91]/30 highlight' : 'hover:bg-white/5'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Reports Sidebar */}
      {isMobile && mobileReportsOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => setMobileReportsOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-[85%] max-w-[320px] z-50 transform transition-transform duration-300 ease-out shadow-2xl overflow-y-auto rounded-l-2xl" style={{ backgroundColor: 'var(--background-slate)' }}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-bold highlight">Reportes Rapidos</h2>
                <button onClick={() => setMobileReportsOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: 'var(--button-color)', border: `1px solid var(--border-color)'` }}>
                  <span className="text-sm font-bold">X</span>
                </button>
              </div>
              <ReportesAside isMobileView={true} />
            </div>
          </div>
        </>
      )}

      {/* Botones flotantes */}
      {isMobile && !mobileFiltersOpen && !mobileReportsOpen && (
        <>
          <button onClick={() => setMobileFiltersOpen(true)} className="fixed bottom-6 left-6 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300" style={{ backgroundColor: 'var(--button-color)', border: `2px solid var(--border-color)` }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          
          <button onClick={() => setMobileReportsOpen(true)} className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300" style={{ backgroundColor: 'var(--button-color)', border: `2px solid var(--border-color)` }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default Feed;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import ThemeOption from '../Toggle/ThemeOptions';
import Avatar from '../Avatar';
import '../../App.css'
import '../../pantallas/index.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const buscarUsuarios = async (query) => {
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/usuarios/buscar?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        buscarUsuarios(searchTerm);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const verPerfilUsuario = (usuarioEncontrado) => {
    setShowResults(false);
    setSearchTerm('');
    navigate(`/perfil/${usuarioEncontrado._id}`);
  };

  const irAlHome = () => {
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setMobileMenuOpen(false);
  };

  return (
    <div className='App' id='App'>
      <nav className="header rounded-full p-3 mb-6 shadow-lg relative">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex gap-4 ml-4">
            {/* Logo / Home */}
            <button
              onClick={irAlHome}
              className="hover:scale-110 transition-transform focus:outline-none group relative"
              title="Ir al inicio"
            >
              <img
                src="/logo.png"
                alt="CardDial Logo"
                className="h-10 w-auto object-contain"
              />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Inicio
              </span>
            </button>

            {/* Tienda / Ventas */}
            <button
              onClick={() => navigate('/ventas')}
              className="w-10 h-10 button rounded-md flex items-center justify-center hover:bg-[--hover-button-color] transition-all group"
              title="Tienda"
            >
              <img
                src="https://www.svgrepo.com/show/324791/store-business-marketplace-shop-sale-buy-marketing.svg"
                alt="Tienda"
                className="w-6 h-6 invert opacity-80 group-hover:opacity-100"
              />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Tienda
              </span>
            </button>

            {/* Mi Colección */}
            <button
              onClick={() => navigate('/coleccion')}
              className="w-10 h-10 button rounded-md flex items-center justify-center hover:bg-[--hover-button-color] transition-all group"
              title="Mi Colección"
            >
              <img
                src="https://static.thenounproject.com/png/2221162-200.png"
                alt="Coleccion"
                className="w-6 h-6 invert opacity-80 group-hover:opacity-100"
              />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Colección
              </span>
            </button>

            {/* Publicar (si está autenticado) */}
            {usuario && (
              <button
                onClick={() => navigate('/publicar')}
                className="w-10 h-10 button rounded-md flex items-center justify-center hover:bg-[--hover-button-color] transition-all group"
                title="Publicar carta"
              >
                <svg className="w-6 h-6 opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Publicar
                </span>
              </button>
            )}
          </div>

          {/* Buscador Desktop */}
          <div className="flex-1 max-w-xl mx-8 relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="w-full search-bar rounded-full py-2 px-10 outline-none border-none text-white"
                placeholder="Buscar usuarios..."
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
            </div>

        
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 search-result rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto border">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => verPerfilUsuario(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[--search-hover] transition-colors border-b last:border-b-0"
                  >
                    <Avatar
                      fotoPerfil={user.fotoPerfil}
                      nombre={user.nombre}
                      size="w-10 h-10"
                      textSize="text-sm"
                    />
                    <div className="flex-1 text-left">
                      <p className="primary-text font-semibold">{user.nombre}</p>
                      <p className="highlight text-sm">@{user.nickname}</p>
                    </div>
                    {user._id === usuario?._id && (
                      <span className="text-xs search-bar px-2 py-1 rounded-full">
                        Tú
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

          </div>
          
          {/* Sección derecha: Temas + Usuario Desktop */}
          <div className="flex items-center gap-3 mr-4">
            <div className="theme-options flex gap-1">
              <ThemeOption bg="#000000" theme="dark" />
              <ThemeOption bg="#ffffff" theme="light" />
              <ThemeOption bg="#ca4646" theme="pokemon" />
              <ThemeOption bg="#46ca51" theme="digimon" />
              <ThemeOption bg="#c8ca46" theme="dragonball" />
            </div>
            
            {usuario && (
              <span className="primary-text font-bold hidden sm:block">
                {usuario?.nickname || usuario?.nombre || 'Usuario'}
              </span>
            )}
            
            <button
              onClick={() => usuario ? navigate('/mi-perfil') : navigate('/auth')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-500 hover:ring-2 hover:ring-pink-300 transition-all"
              title={usuario ? "Mi Perfil" : "Iniciar Sesión"}
            >
              {usuario ? (
                <Avatar
                  fotoPerfil={usuario.fotoPerfil}
                  nombre={usuario.nombre}
                  size="w-full h-full"
                  textSize="text-sm"
                  borderColor="border-transparent"
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#2d2a3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </button>

            {usuario && (
              <button
                onClick={handleLogout}
                className="w-8 h-8 button rounded-full flex items-center justify-center hover:bg-red-600/20 transition-all group"
                title="Cerrar sesión"
              >
                <svg className="w-4 h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col gap-3">
          {/* Fila superior: Logo + Buscador + Menú */}
          <div className="flex items-center gap-2">
            {/* Logo */}
            <button onClick={irAlHome} className="flex-shrink-0">
              <img
                src="/logo.png"
                alt="CardDial Logo"
                className="h-8 w-auto object-contain"
              />
            </button>

            {/* Buscador Mobile (siempre visible) */}
            <div className="flex-1 relative" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  className="w-full search-bar rounded-full py-1.5 px-8 outline-none border-none text-white text-sm"
                  placeholder="Buscar usuarios..."
                />
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {loading && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 search-result rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto border">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => verPerfilUsuario(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[--search-hover] transition-colors border-b last:border-b-0"
                    >
                      <Avatar
                        fotoPerfil={user.fotoPerfil}
                        nombre={user.nombre}
                        size="w-8 h-8"
                        textSize="text-xs"
                      />
                      <div className="flex-1 text-left">
                        <p className="primary-text font-semibold text-sm">{user.nombre}</p>
                        <p className="highlight text-xs">@{user.nickname}</p>
                      </div>
                      {user._id === usuario?._id && (
                        <span className="text-xs search-bar px-2 py-0.5 rounded-full">
                          Tú
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-button w-8 h-8 flex flex-col items-center justify-center gap-1.5 flex-shrink-0"
            >
              <span className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>

       
          {mobileMenuOpen && (
            <div 
              ref={mobileMenuRef}
              className="absolute left-0 right-0 top-full mt-2 bg-black/80 backdrop-blur-md rounded-2xl shadow-xl z-40 overflow-hidden border border-white/10"
              style={{ maxWidth: 'calc(100% - 1rem)', margin: '0.5rem auto', left: '0.5rem', right: '0.5rem' }}
            >
              <div className="flex flex-col">
             
                <div className="flex justify-center gap-2 py-3 px-4 border-b border-white/10">
                  <ThemeOption bg="#000000" theme="dark" />
                  <ThemeOption bg="#ffffff" theme="light" />
                  <ThemeOption bg="#ca4646" theme="pokemon" />
                  <ThemeOption bg="#46ca51" theme="digimon" />
                  <ThemeOption bg="#c8ca46" theme="dragonball" />
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/ventas');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all"
                  >
                    <img
                      src="https://www.svgrepo.com/show/324791/store-business-marketplace-shop-sale-buy-marketing.svg"
                      alt="Tienda"
                      className="w-5 h-5 invert opacity-80"
                    />
                    <span className="primary-text text-sm">Tienda</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/coleccion');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all"
                  >
                    <img
                      src="https://static.thenounproject.com/png/2221162-200.png"
                      alt="Coleccion"
                      className="w-5 h-5 invert opacity-80"
                    />
                    <span className="primary-text text-sm">Mi Colección</span>
                  </button>

                  {usuario && (
                    <button
                      onClick={() => {
                        navigate('/publicar');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all"
                    >
                      <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="primary-text text-sm">Publicar</span>
                    </button>
                  )}
                </div>

                <div className="h-px bg-white/10 mx-4"></div>

                {/* User Section */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      usuario ? navigate('/mi-perfil') : navigate('/auth');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                      {usuario ? (
                        <Avatar
                          fotoPerfil={usuario.fotoPerfil}
                          nombre={usuario.nombre}
                          size="w-full h-full"
                          textSize="text-xs"
                          borderColor="border-transparent"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-white/70 m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <span className="primary-text text-sm">
                      {usuario ? (usuario?.nickname || usuario?.nombre || 'Mi Perfil') : 'Iniciar Sesión'}
                    </span>
                  </button>

                  {usuario && (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-600/20 transition-all text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm">Cerrar Sesión</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
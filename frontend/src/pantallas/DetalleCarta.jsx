import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../componentes/Layout/Navbar';
import Avatar from '../componentes/Avatar'; 
import { useReaccion } from '../hooks/useReaccion';
import '../App.css'
import '../pantallas/index.css'
import axios from 'axios';

const DetalleCarta = () => {
  const navigate = useNavigate();
  const { usuario, isAuthenticated, token } = useAuth(); 
  const rutaFotoPerfil = "http://localhost:3000";
  const { id } = useParams();
  
  const [Publicacion, setPublicacion] = useState(null);
  const [comentario, setComentario] = useState('');
  const [comentarios, setComentarios] = useState([]);
  const [cargandoComentario, setCargandoComentario] = useState(false);


  const { tieneLike, cantidadLikes, cargando: cargandoLike, toggleLike } = useReaccion(id);


  useEffect(() => {
    console.log('Usuario autenticado:', isAuthenticated);
    console.log('Token:', token);
    console.log('Usuario:', usuario);
  }, [isAuthenticated, token, usuario]);

  // Traer la publicación
  useEffect(() => {
    const fetchPublicacion = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/publicaciones/${id}`);
        const p = res.data.publicacion;

        const publicacionMapeada = {
          id: p._id,
          titulo: p.Titulo,
          descripcion: p.Texto,
          precio: p.Monto,
          cantidad: p.Cantidad,
          fandom: p.Franquicia?.nombre || "Sin franquicia",
          imagen: p.fotosUrls?.[0] || null,
          imagenes: p.fotosUrls || [],
          usuario: {
            id: p.Idusuario?._id,
            nombre: p.Idusuario?.nombre,
            nickname: p.Idusuario?.nickname,
            foto: p.Idusuario?.fotoPerfil
          }
        };
        setPublicacion(publicacionMapeada);
      } catch (error) {
        console.error(error);
      }
    };
    if (id) fetchPublicacion();
  }, [id]);

  


const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    
    if (!isAuthenticated) {
        alert("Inicia sesión para comentar");
        return;
    }
    
    setCargandoComentario(true);
    try {
       
        
        const response = await axios.post(
            `http://localhost:3000/api/publicaciones/${id}/comentarios`, 
            { texto: comentario },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        
        await fetchComentarios();
        setComentario("");
    } catch (error) {
        console.error(" Error enviando comentario:", error);
        console.error(" Detalles:", error.response?.data);
        alert("No se pudo enviar el comentario: " + (error.response?.data?.message || error.message));
    } finally {
        setCargandoComentario(false);
    }
};


const fetchComentarios = async () => {
    try {
       
        const res = await axios.get(`http://localhost:3000/api/publicaciones/${id}/comentarios`);

        const comentariosMapeados = (res.data.comentarios || []).map(c => ({
            id: c._id,
            texto: c.texto,
            fecha: c.createdAt || c.fecha,
            usuario: {
                id: c.idUsuario?._id,
                nickname: c.idUsuario?.nickname,
                nombre: c.idUsuario?.nombre,
                foto: c.idUsuario?.fotoPerfil
            }
        }));
        
        console.log(' Comentarios mapeados:', comentariosMapeados.length);
        setComentarios(comentariosMapeados);
    } catch (error) {
        console.error(' Error cargando comentarios:', error);
        console.error(' Detalles:', error.response?.data);
    }
};

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString();
  };

  useEffect(() => {
    if (id) fetchComentarios();
  }, [id]);

 

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      alert("Inicia sesión para dar like");
      return;
    }
    await toggleLike();
  };

  if (!Publicacion) {
    return <div className="text-white p-4">Cargando publicación...</div>;
  }

  return (
    <div className='App' id='App'>
      <div className="min-h-screen text-white font-sans p-4">
        <Navbar />

        <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full max-w-7xl mx-auto px-4">
          
          <button
            onClick={() => navigate('/ventas')}
            className="w-10 h-10 bg-slate rounded-full flex-shrink-0 flex items-center justify-center font-bold border hover:bg-red-600 transition-colors shadow-lg"
          >
            X
          </button>

          {/* Imagen */}
          <div className="w-full md:w-[350px] min-h-[500px] border-2 border rounded-3xl bg-slate-900/40 flex items-center justify-center relative shadow-2xl">
            <div className="bg-slate px-6 py-3 rounded-xl border border">
              <span className="text-gray-300 font-bold text-sm uppercase tracking-widest italic text-center block">
                <img 
                  src={Publicacion.imagen} 
                  alt={Publicacion.titulo}
                  className="w-full h-full object-cover rounded-3xl"
                />
              </span>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="w-full md:w-[420px] lg:w-[480px] flex flex-col gap-4 flex-shrink-0">

            {/* Info de la Publicacion */}
            <div className="border-2 border rounded-2xl p-6 bg-slate-900/60 relative shadow-xl">
              <div className="space-y-3 text-sm">
                <h2 className="text-2xl font-bold text-white mb-2">{Publicacion.titulo}</h2>
                <div className="space-y-1">
                  <p className="text-xs">Precio: <span className="italic highlight">${Publicacion.precio}</span></p>
                  <p className="text-xs">Cantidad: <span className="text-white">{Publicacion.cantidad}</span></p>
                  <p className="text-xs">Fandom: <span className="text-white">{Publicacion.fandom}</span></p>
                </div>
                <div className="mt-4 pt-4 border-t border-">
                  <p className="font-bold highlight text-xs uppercase italic">Descripción:</p>
                  <p className="text-xs leading-relaxed mt-1">
                    {Publicacion.descripcion}
                  </p>
                </div>
              </div>

              {/* Botón de Like */}
              <div className="mt-6">
                <button 
                  onClick={handleLikeClick}
                  disabled={cargandoLike}
                  className="w-14 h-10 bg-slate border rounded-xl flex items-center justify-center hover:bg-pink-900/20 transition-all group"
                >
                  <span className={`text-2xl group-hover:scale-125 transition-transform ${tieneLike ? 'text-pink-500' : 'text-gray-400'}`}>
                    {tieneLike ? '❤️' : '🤍'}
                  </span>
                </button>
                <span className="ml-2 text-xs text-gray-400">{cantidadLikes} me gusta</span>
              </div>
            </div>

            {/* Sección de Comentarios */}
            <div className="border-2 border rounded-2xl p-6 bg-slate-900/60 flex flex-col gap-4 shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest highlight">
                Comentarios ({comentarios.length})
              </h3>

              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                {comentarios.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">
                    No hay comentarios aún. ¡Sé el primero en comentar!
                  </p>
                ) : (
                  comentarios.map((c) => (
                    <div key={c.id} className={`p-4 rounded-2xl flex items-start gap-3 border ${
                        c.usuario?.id === usuario?._id || c.usuario?.id === usuario?.id
                        ? 'bg-emerald-900/20 border-emerald-500/50' 
                        : 'bg-[#2d2a3e]/60 border-gray-700'
                      }`}>
                      <div className="w-8 h-8 shrink-0">
                        <Avatar
                          fotoPerfil={c.usuario?.foto ? rutaFotoPerfil + c.usuario.foto : null}
                          nombre={c.usuario?.nickname || c.usuario?.nombre || 'Usuario'}
                          size="w-full h-full"
                          textSize="text-xs"
                          borderColor="border-emerald-500"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold highlight block">
                            {c.usuario?.nickname || c.usuario?.nombre || 'Usuario'}
                            {(c.usuario?.id === usuario?._id || c.usuario?.id === usuario?.id) && (
                              <span className="ml-2 text-emerald-400 text-[8px]">(Tú)</span>
                            )}
                          </span>
                          {c.fecha && (
                            <span className="text-[8px] text-gray-500">{formatearFecha(c.fecha)}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-200 mt-1 text-justify">{c.texto}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Formulario para nuevo comentario */}
              <form onSubmit={handleEnviarComentario} className="mt-2 border-2 border-dashed border rounded-2xl p-4 flex items-center gap-3 bg-black/30 focus-within:border-emerald-500 transition-colors">
                <div className="w-8 h-8 shrink-0">
                  <Avatar
                    fotoPerfil={usuario?.fotoPerfil ? rutaFotoPerfil + usuario.fotoPerfil : null}
                    nombre={usuario?.nombre || 'Usuario'}
                    size="w-full h-full"
                    textSize="text-xs"
                    borderColor="border-transparent"
                  />
                </div>
                <input
                  type="text"
                  placeholder={isAuthenticated 
                    ? `Comentar como ${usuario?.nombre || usuario?.correo?.split('@')[0] || 'Usuario'}...`
                    : "Inicia sesión para comentar"}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  disabled={cargandoComentario || !isAuthenticated}
                  className="bg-transparent flex-1 outline-none text-xs placeholder-gray-600 text-white disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={cargandoComentario || !comentario.trim() || !isAuthenticated}
                  className="primary-text hover:scale-125 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {cargandoComentario ? '⏳' : '➤'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleCarta;
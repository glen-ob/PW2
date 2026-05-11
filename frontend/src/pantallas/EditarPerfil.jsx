
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../componentes/Layout/Navbar';
import Avatar from '../componentes/Avatar';
import { Camera, X, Save, AlertCircle } from 'lucide-react';
import '../App.css';
import '../pantallas/index.css';

const EditarPerfil = () => {
  const navigate = useNavigate();
  const { usuario, actualizarPerfil, actualizarFotoPerfil } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); 
  const [mostrarAvatar, setMostrarAvatar] = useState(true); 
  
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    nickname: '',
    bio: ''
  });

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        nickname: usuario.nickname || '',
        bio: usuario.bio || ''
      });
    }
    
   
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [usuario]);


  useEffect(() => {
    if (usuario?.fotoPerfil && !nuevaFoto) {
      // Limpiar preview si existe
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setMostrarAvatar(prev => !prev); // Forzar re-render
    }
  }, [usuario?.fotoPerfil]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleActualizarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    // Limpiar preview anterior si existe
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Crear nuevo blob URL para preview
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setNuevaFoto(file);
    setMostrarAvatar(prev => !prev); // Forzar re-render del avatar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await actualizarPerfil(formData);

      if (result.success) {
        if (nuevaFoto) {
          const fotoFormData = new FormData();
          fotoFormData.append('fotoPerfil', nuevaFoto);
          const fotoResult = await actualizarFotoPerfil(fotoFormData);

          if (fotoResult.success) {
            setSuccess('Perfil y foto actualizados correctamente');
            // Limpiar preview después de guardar
            if (previewUrl && previewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
            setNuevaFoto(null);
          } else {
            setError('Perfil actualizado pero hubo error con la foto: ' + fotoResult.error);
          }
        } else {
          setSuccess('Perfil actualizado correctamente');
        }

        setTimeout(() => {
          navigate('/mi-perfil');
        }, 2000);
      } else {
        setError(result.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    navigate('/mi-perfil');
  };

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  
  const fotoParaMostrar = previewUrl || usuario.fotoPerfil;

  return (
    <div className='App' id='App'>
      <div className="min-h-screen bg-slate text-white font-windows p-4 overflow-x-hidden">
        <Navbar />

        <div className="max-w-3xl mx-auto">
          <div className="border-2 border rounded-[40px] p-8 bg-slate-900/50">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold highlight">Editar Perfil</h1>
              <button
                onClick={handleCancelar}
                className="w-10 h-10 bg-slate rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-500/20 border-2 border-green-500 text-green-100 px-4 py-3 rounded-lg flex items-center gap-2">
                <Save className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4">
                    <Avatar
                      key={mostrarAvatar ? 'avatar-1' : 'avatar-2'}
                      fotoPerfil={fotoParaMostrar}
                      nombre={formData.nombre}
                      size="w-full h-full"
                      textSize="text-4xl"
                      borderColor="border-transparent"
                    />
                  </div>
                  <label
                    htmlFor="foto-perfil"
                    className="absolute bottom-0 right-0 button rounded-full p-2 cursor-pointer hover:bg-[--hover-button-color] transition-all border-2 border-white"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      ref={fileInputRef}
                      id="foto-perfil"
                      type="file"
                      accept="image/*"
                      onChange={handleActualizarFoto}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Haz clic en la cámara para cambiar tu foto
                </p>
                {previewUrl && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Vista previa - Guarda los cambios para aplicar
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 highlight">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full bg-slate border-2 border rounded-2xl p-3 text-white outline-none focus:border-[--focus-color] transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 highlight">
                  Nickname
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className="w-full bg-slate border-2 border rounded-2xl p-3 text-white outline-none focus:border-[--focus-color] transition-all"
                  placeholder="Cómo te llaman"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Este es tu nombre de usuario único
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 highlight">
                  Biografía
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full bg-slate border-2 border rounded-2xl p-3 text-white outline-none focus:border-[--focus-color] transition-all resize-none"
                  placeholder="Cuéntanos sobre ti, tus colecciones favoritas, etc."
                  maxLength="500"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs">
                    Cuéntale a la comunidad sobre ti
                  </p>
                  <p className="text-xs">
                    {formData.bio.length}/500 caracteres
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={usuario.correo}
                  disabled
                  className="w-full bg-slate border-2 border rounded-2xl p-3 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede cambiar
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Miembro desde
                </label>
                <input
                  type="text"
                  value={usuario.createdAt ? new Date(usuario.createdAt).toLocaleDateString('es-MX') : 'Fecha no disponible'}
                  disabled
                  className="w-full bg-slate border-2 border border-[#56ab91]/20 rounded-2xl p-3 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hover:bg-[--hover-button-color] text-white font-bold py-3 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar cambios
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="px-6 bg-[#2d2a3e] hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarPerfil;
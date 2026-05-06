import React, { useState, useRef, useEffect } from 'react';
import '../Cards/cartas_efecto.css';

const CartaConEfecto = ({ carta, isCenter, onClick }) => {
  const [flipped, setFlipped] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({});
  const [sparkles, setSparkles] = useState([]);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const mousePositionRef = useRef({ x: 50, y: 50 });

  // actualizar brillitos constantemente
  const updateSparkles = () => {
    if (!containerRef.current || flipped) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }
    
    // ref del cursor
    const currentMouseX = mousePositionRef.current.x;
    const currentMouseY = mousePositionRef.current.y;
    
    setSparkles(prevSparkles => {
      const updatedSparkles = prevSparkles
        .map(sparkle => ({
          ...sparkle,
          x: sparkle.x + sparkle.vx,
          y: sparkle.y + sparkle.vy,
          life: sparkle.life - 0.015,
          size: sparkle.size * 0.98
        }))
        .filter(sparkle => sparkle.life > 0);
      
      // crea brillitos nuevos en la pos del cursor
      const newSparkles = [];
      const sparklesPerFrame = 5;
      
      for (let i = 0; i < sparklesPerFrame; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.0 + 0.3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        const colors = ['#FFD700', '#3eee44', '#FF69B4', '#00FFFF', '#FFFFFF', '#8b09ac', '#4ECDC4', '#FFE66D'];
        
        newSparkles.push({
          id: Math.random() + Date.now() + i,
          x: currentMouseX,
          y: currentMouseY,
          vx: vx,
          vy: vy,
          size: Math.random() * 10 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
        });
      }
      
      return [...updatedSparkles, ...newSparkles];
    });
    
    animationRef.current = requestAnimationFrame(updateSparkles);
  };

  const handleMouseEnter = () => {
    if (flipped) return;
    
    setSparkles([]);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(updateSparkles);
  };

  const handleMouseLeave = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setSparkles([]);
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
    });
    setGlareStyle({});
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current || flipped) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    mousePositionRef.current = { x: percentX, y: percentY };
    
    // efecto tilt cuando pasas el cursor
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      transition: 'transform 0.1s ease-out'
    });
    
    // glare
    setGlareStyle({
      background: `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0) 70%)`
    });
  };
  
  const handleCardClick = (e) => {
    e.stopPropagation();
    setFlipped(!flipped);
    
    if (!flipped && onClick) {
      onClick();
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const containerStyles = {
    width: '220px',
    height: '320px',
    cursor: 'pointer',
    perspective: '1500px',
    position: 'relative',
    overflow: 'visible'
  };

  const cardStyles = {
    position: 'relative',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
    transformStyle: 'preserve-3d',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    ...tiltStyle,
    transform: flipped ? 'rotateY(180deg)' : (tiltStyle.transform || 'none')
  };

  const frontStyles = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: '1rem',
    overflow: 'hidden',
    backgroundColor: '#1e1b2e',
    transform: 'rotateY(0deg)'
  };

  const backStyles = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: '1rem',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    transform: 'rotateY(180deg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    gap: '0.5rem'
  };

  const glareStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '1rem',
    pointerEvents: 'none',
    zIndex: 10,
    transition: 'background 0.05s ease',
    ...glareStyle
  };

  const getSparkleStyle = (sparkle) => ({
    position: 'absolute',
    left: `${sparkle.x}%`,
    top: `${sparkle.y}%`,
    width: `${sparkle.size}px`,
    height: `${sparkle.size}px`,
    pointerEvents: 'none',
    zIndex: 20, 
    opacity: sparkle.life,
    transform: `scale(${sparkle.life})`,
    filter: `drop-shadow(0 0 ${3 + sparkle.life * 3}px ${sparkle.color})`
  });

  return (
    <div
      ref={containerRef}
      style={containerStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div style={cardStyles} onClick={handleCardClick}>
        {/* frente de la carta */}
        <div style={frontStyles}>
          <img 
            src={carta.imagen} 
            alt={carta.nombre} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
            opacity: isCenter ? 1 : 0,
            transition: 'opacity 0.3s'
          }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem' }}>
              <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.25rem' }}>{carta.nombre}</p>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 'semibold',
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: carta.rareza === 'Épica' ? '#a855f7' : carta.rareza === 'Rara' ? '#3b82f6' : '#6b7280',
                color: 'white'
              }}>
                {carta.rareza}
              </span>
            </div>
          </div>
          
          {/* glare */}
          <div style={glareStyles} />
          
          {/* brillitos que siguen al mouse */}
          {!flipped && sparkles.map((sparkle) => (
            <div key={sparkle.id} style={getSparkleStyle(sparkle)}>
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill={sparkle.color} stroke={sparkle.color} strokeWidth="1"/>
                <path d="M12 4L13 8L17 9L13 10L12 14L11 10L7 9L11 8L12 4Z" fill="white" opacity="0.9"/>
              </svg>
            </div>
          ))}
        </div>
        
        {/* parte de atrás */}
        <div style={backStyles}>
          <svg style={{ width: '4rem', height: '4rem', color: 'white', marginBottom: '1rem' }} fill="currentColor" viewBox="0 0 24 24">
          </svg>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{carta.nombre}</h3>
          <p style={{ fontSize: '0.875rem', color: '#e2e8f0', textAlign: 'center' }}>Rareza: {carta.rareza}</p>
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#cbd5f5', 
            textAlign: 'center',
            marginTop: '0.5rem',
            lineHeight: '1.2'
          }}>
            {carta.descripcion}
          </p>
          
          <button 
            style={{ marginTop: '1rem', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', border: 'none', color: 'white' }}
            onClick={(e) => {
              e.stopPropagation();
              setFlipped(false);
            }}
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartaConEfecto;
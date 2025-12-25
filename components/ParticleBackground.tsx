import React, { useRef, useEffect } from 'react';
import { Particle } from '../types';

interface Props {
  isDark: boolean;
  onDoubleClick: () => void;
}

const ParticleBackground: React.FC<Props> = ({ isDark, onDoubleClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; isActive: boolean }>({ x: 0, y: 0, isActive: false });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      // Adjust density based on screen size
      const count = Math.min(window.innerWidth / 15, 100);
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        newParticles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 0.3, // Slower, drift-like speed
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          color: isDark 
            ? `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.1})` 
            : `rgba(0, 0, 0, ${Math.random() * 0.15 + 0.05})`,
          baseX: x,
          baseY: y,
          density: (Math.random() * 30) + 1
        });
      }
      particlesRef.current = newParticles;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((p) => {
        // Natural Drift
        p.x += p.vx;
        p.y += p.vy;

        // Soft boundaries - wrap around instead of bounce for "flow" feel
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Mouse Interaction
        if (mouseRef.current.isActive) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const forceRadius = 200;

          if (distance < forceRadius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            // Create a subtle attraction then repulsion (wave effect)
            const maxDistance = forceRadius;
            const force = (maxDistance - distance) / maxDistance;
            
            // Gentle Repulsion
            const directionX = forceDirectionX * force * p.density * 0.6;
            const directionY = forceDirectionY * force * p.density * 0.6;

            p.x -= directionX;
            p.y -= directionY;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Connect particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Dynamic connection distance based on mouse proximity
          let connectDistance = 120;

          if (distance < connectDistance) {
            ctx.beginPath();
            ctx.strokeStyle = isDark 
              ? `rgba(255, 255, 255, ${0.08 - distance/1500})` 
              : `rgba(0, 0, 0, ${0.08 - distance/1500})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDark]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY, isActive: true };
  };

  const handleMouseLeave = () => {
    mouseRef.current.isActive = false;
  };

  const handleClick = (e: React.MouseEvent) => {
     const burstRadius = 250;
     particlesRef.current.forEach(p => {
       const dx = p.x - e.clientX;
       const dy = p.y - e.clientY;
       const dist = Math.sqrt(dx*dx + dy*dy);
       if (dist < burstRadius) {
         // Push away faster on click
         p.vx += (dx / dist) * 2;
         p.vy += (dy / dist) * 2;
       }
     });
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full cursor-pointer touch-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        mouseRef.current = { x: touch.clientX, y: touch.clientY, isActive: true };
      }}
      onTouchEnd={() => mouseRef.current.isActive = false}
    />
  );
};

export default ParticleBackground;
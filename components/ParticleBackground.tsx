import React, { useRef, useEffect } from 'react';
import { Particle, ParticleConfig } from '../types';

interface Props {
  isDark: boolean;
  isAlarming?: boolean;
  config: ParticleConfig;
  onDoubleClick: () => void;
}

const ParticleBackground: React.FC<Props> = ({ isDark, isAlarming = false, config, onDoubleClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; isActive: boolean }>({ x: 0, y: 0, isActive: false });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      // Density multiplier controls count
      const baseCount = Math.min(window.innerWidth / 15, 100);
      const count = Math.floor(baseCount * config.density); 
      
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const vx = (Math.random() - 0.5) * 0.3;
        const vy = (Math.random() - 0.5) * 0.3;
        
        newParticles.push({
          x: x,
          y: y,
          vx: vx,
          vy: vy,
          baseVx: vx,
          baseVy: vy,
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

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Init

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [config.density, isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, isActive: true };
    };
    const handleInteractionEnd = () => {
       mouseRef.current.isActive = false;
    };
    const handleInteractionStart = (x: number, y: number) => {
        const burstRadius = 300;
        const burstForce = 15;
        particlesRef.current.forEach(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < burstRadius) {
                const force = (burstRadius - distance) / burstRadius;
                const angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * force * burstForce;
                p.vy += Math.sin(angle) * force * burstForce;
            }
        });
    };
    const handleMouseDown = (e: MouseEvent) => handleInteractionStart(e.clientX, e.clientY);
    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
            mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, isActive: true };
        }
    };
    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, isActive: true };
        }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleInteractionEnd);
    window.addEventListener('mouseup', handleInteractionEnd);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((p) => {
        // --- PHYSICS UPDATE ---
        const targetVx = p.baseVx * config.speed;
        const targetVy = p.baseVy * config.speed;

        p.vx = p.vx * 0.96 + targetVx * 0.04;
        p.vy = p.vy * 0.96 + targetVy * 0.04;

        let jitterX = 0;
        let jitterY = 0;
        if (isAlarming) {
            jitterX = (Math.random() - 0.5) * 4;
            jitterY = (Math.random() - 0.5) * 4;
        }

        p.x += p.vx + jitterX;
        p.y += p.vy + jitterY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // --- MOUSE INTERACTION ---
        if (mouseRef.current.isActive) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const forceRadius = 250; 

          if (distance < forceRadius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxDistance = forceRadius;
            const force = (maxDistance - distance) / maxDistance;
            
            const directionX = forceDirectionX * force * p.density * 1.5;
            const directionY = forceDirectionY * force * p.density * 1.5;

            p.x -= directionX;
            p.y -= directionY;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * config.size, 0, Math.PI * 2);
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

          if (distance < config.connections) {
            ctx.beginPath();
            ctx.strokeStyle = isDark 
              ? `rgba(255, 255, 255, ${0.08 - distance/ (config.connections * 10)})` 
              : `rgba(0, 0, 0, ${0.08 - distance/ (config.connections * 10)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleInteractionEnd);
      window.removeEventListener('mouseup', handleInteractionEnd);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [config.speed, config.size, config.connections, isAlarming, isDark]); 

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full touch-none"
      onDoubleClick={onDoubleClick}
    />
  );
};

export default ParticleBackground;
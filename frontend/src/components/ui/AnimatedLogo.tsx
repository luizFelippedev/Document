// frontend/src/components/ui/AnimatedLogo.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { APP_NAME } from '@/config/constants';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';

interface AnimatedLogoProps {
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedLogo = ({ 
  className, 
  animated = true,
  size = 'md' 
}: AnimatedLogoProps) => {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };
  
  // Draw animated particles if animated is true
  useEffect(() => {
    if (!animated || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      
      constructor(canvas: HTMLCanvasElement) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        
        // Use theme-based colors
        const colors = resolvedTheme === 'dark' 
          ? ['#60a5fa', '#818cf8', '#c084fc'] // Blue to purple
          : ['#3b82f6', '#6366f1', '#8b5cf6']; // Blue to purple
          
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Initialize particles
    const particlesArray: Particle[] = [];
    const particleCount = 20; // Adjust based on size
    
    for (let i = 0; i < particleCount; i++) {
      particlesArray.push(new Particle(canvas));
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw circle background
      ctx.fillStyle = resolvedTheme === 'dark' ? '#1e40af' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw letter
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${canvas.width * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(APP_NAME.charAt(0), canvas.width / 2, canvas.height / 2 + 2);
      
      // Update and draw particles
      for (const particle of particlesArray) {
        particle.update();
        particle.draw(ctx);
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    let animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [animated, resolvedTheme]);
  
  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className={cn("rounded-lg overflow-hidden", sizeMap[size], className)}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          aria-label={`${APP_NAME} logo`}
        />
      </motion.div>
    );
  }
  
  // Static logo (no animation)
  return (
    <div 
      className={cn(
        "flex items-center justify-center bg-blue-600 text-white font-bold rounded-lg",
        sizeMap[size],
        className
      )}
      aria-label={`${APP_NAME} logo`}
    >
      {APP_NAME.charAt(0)}
    </div>
  );
};
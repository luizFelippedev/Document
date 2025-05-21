// frontend/src/components/ui/AnimatedLogo.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface AnimatedLogoProps {
  /** Additional class name for the logo */
  className?: string;
  /** Whether to animate the logo on mount */
  animate?: boolean;
  /** Whether to animate the logo continuously */
  continuous?: boolean;
  /** The color of the logo */
  color?: string;
  /** The size of the logo */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show a hover effect */
  hoverEffect?: boolean;
  /** Whether to show a click effect */
  clickEffect?: boolean;
  /** Called when the logo is clicked */
  onClick?: () => void;
}

/**
 * Animated SVG logo component
 */
export const AnimatedLogo = ({
  className,
  animate = true,
  continuous = false,
  color,
  size = 'md',
  hoverEffect = true,
  clickEffect = true,
  onClick,
}: AnimatedLogoProps) => {
  const pathControls = useAnimation();
  const circleControls = useAnimation();
  const containerControls = useAnimation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Define animation sequences
  const animateLogo = async () => {
    // Verificar se o componente ainda está montado
    if (!isMountedRef.current) return;

    // Reset animations
    await Promise.all([
      pathControls.set({ pathLength: 0, opacity: 0 }),
      circleControls.set({ scale: 0, opacity: 0 }),
    ]);

    // Animate path drawing
    await pathControls.start({
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.2, ease: 'easeInOut' },
    });

    // Verificar se o componente ainda está montado
    if (!isMountedRef.current) return;

    // Animate circles
    await circleControls.start({
      scale: 1,
      opacity: 1,
      transition: { duration: 0.8, ease: 'backOut' },
    });

    // If continuous, loop the animation with a safe approach
    if (continuous && isMountedRef.current) {
      // Add a pause between animations using a ref for cleanup
      timeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        // Animate out
        await Promise.all([
          pathControls.start({
            opacity: 0,
            transition: { duration: 0.5 },
          }),
          circleControls.start({
            scale: 0,
            opacity: 0,
            transition: { duration: 0.5 },
          }),
        ]);

        // Start again if still mounted
        if (isMountedRef.current) {
          animateLogo();
        }
      }, 3000);
    }
  };

  // Start animation on mount or when props change
  useEffect(() => {
    // Reset the mounted flag on new effect run
    isMountedRef.current = true;

    // Start animation if animate prop is true
    if (animate) {
      animateLogo();
    }

    // Cleanup function
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Stop all animations
      pathControls.stop();
      circleControls.stop();
      containerControls.stop();
    };
  }, [animate, continuous]); // Re-run when these props change

  // Get size based on prop
  const getSize = () => {
    if (typeof size === 'number') return size;

    const sizeMap = {
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
    };

    return sizeMap[size] || 48;
  };

  // Get color based on prop
  const getColor = () => {
    return color || 'currentColor';
  };

  // Handle click animation
  const handleClick = () => {
    if (clickEffect) {
      containerControls
        .start({
          scale: 0.95,
          transition: { duration: 0.1 },
        })
        .then(() => {
          if (isMountedRef.current) {
            containerControls.start({
              scale: 1,
              transition: {
                duration: 0.2,
                type: 'spring',
                stiffness: 400,
                damping: 10,
              },
            });
          }
        });
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      className={cn(
        'inline-flex items-center justify-center',
        hoverEffect && 'cursor-pointer',
        className,
      )}
      animate={containerControls}
      whileHover={hoverEffect ? { scale: 1.05 } : undefined}
      onClick={handleClick}
    >
      <svg
        width={getSize()}
        height={getSize()}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Logo background */}
        <rect
          width="100"
          height="100"
          rx="20"
          fill="currentColor"
          fillOpacity="0.1"
        />

        {/* Animated path */}
        <motion.path
          d="M30 70L40 30H60L70 70"
          stroke={getColor()}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: animate ? 0 : 1, opacity: animate ? 0 : 1 }}
          animate={pathControls}
        />

        <motion.path
          d="M25 50H75"
          stroke={getColor()}
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: animate ? 0 : 1, opacity: animate ? 0 : 1 }}
          animate={pathControls}
        />

        {/* Animated circles */}
        <motion.circle
          cx="25"
          cy="50"
          r="5"
          fill={getColor()}
          initial={{ scale: animate ? 0 : 1, opacity: animate ? 0 : 1 }}
          animate={circleControls}
        />

        <motion.circle
          cx="75"
          cy="50"
          r="5"
          fill={getColor()}
          initial={{ scale: animate ? 0 : 1, opacity: animate ? 0 : 1 }}
          animate={circleControls}
        />

        <motion.circle
          cx="40"
          cy="30"
          r="5"
          fill={getColor()}
          initial={{ scale: animate ? 0 : 1, opacity: animate ? 0 : 1 }}
          animate={circleControls}
        />

        <motion.circle
          cx="60"
          cy="30"
          r="5"
          fill={getColor()}
          initial={{ scale: animate ? 0 : 1, opacity: animate ? 0 : 1 }}
          animate={circleControls}
        />

        <motion.circle
          cx="30"
          cy="70"
          r="5"
          fill={getColor()}
          initial={{ scale: animate ? 0 : 1, opacity: animate ? 0 : 1 }}
          animate={circleControls}
        />

        <motion.circle
          cx="70"
          cy="70"
          r="5"
          fill={getColor()}
          initial={{ scale: animate ? 0 : 1, opacity: animate ? 0 : 1 }}
          animate={circleControls}
        />
      </svg>
    </motion.div>
  );
};

import { useEffect, useState, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import dragonImage from "@/assets/dragon-fire.png";

export function DragonAnimation() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const glowControls = useAnimation();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    
    if ('getBattery' in navigator) {
      (navigator as any).getBattery?.().then((battery: any) => {
        setIsLowPower(battery.level < 0.2 && !battery.charging);
      });
    }
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleInteraction = useCallback(() => {
    setIsInteracting(true);
    glowControls.start({
      scale: [1, 1.3, 1],
      opacity: [0.4, 0.8, 0.4],
      transition: { duration: 0.8, ease: "easeOut" }
    });
    setTimeout(() => setIsInteracting(false), 800);
  }, [glowControls]);

  useEffect(() => {
    const handleClick = () => handleInteraction();
    const handleKeyDown = () => handleInteraction();
    
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleInteraction]);

  if (prefersReducedMotion || isLowPower) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-accent/5" />
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    >
      {/* Reactive pulsing glow overlay */}
      <motion.div
        animate={glowControls}
        initial={{ opacity: 0.3, scale: 1 }}
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255, 100, 0, 0.2) 0%, transparent 70%)",
        }}
      />

      {/* Continuous ambient pulse */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.15, 0.25, 0.15],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(ellipse at 30% 70%, rgba(255, 69, 0, 0.15) 0%, transparent 50%)",
        }}
      />

      {/* Real Dragon Image - Bottom Left */}
      <motion.div
        className="absolute -bottom-20 -left-20 w-[600px] h-[600px]"
        animate={{
          y: [0, -15, 0],
          x: [0, 8, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.img
          src={dragonImage}
          alt=""
          className="w-full h-full object-contain"
          style={{ 
            filter: `drop-shadow(0 0 60px rgba(255, 100, 0, ${isInteracting ? 0.8 : 0.5})) drop-shadow(0 0 120px rgba(255, 50, 0, 0.3))`,
            opacity: isInteracting ? 0.9 : 0.7,
          }}
          animate={{
            scale: isInteracting ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      {/* Real Dragon Image - Top Right (mirrored) */}
      <motion.div
        className="absolute -top-20 -right-20 w-[500px] h-[500px]"
        animate={{
          y: [0, 12, 0],
          x: [0, -6, 0],
          rotate: [2, -2, 2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <motion.img
          src={dragonImage}
          alt=""
          className="w-full h-full object-contain"
          style={{ 
            filter: `drop-shadow(0 0 50px rgba(255, 100, 0, ${isInteracting ? 0.7 : 0.4})) drop-shadow(0 0 100px rgba(255, 50, 0, 0.25))`,
            opacity: isInteracting ? 0.8 : 0.6,
            transform: "scaleX(-1)",
          }}
          animate={{
            scale: isInteracting ? [1, 1.03, 1] : 1,
          }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
      </motion.div>

      {/* Intense floating ember particles - bottom left */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`ember-bl-${i}`}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 10,
            height: 4 + Math.random() * 10,
            left: `${5 + Math.random() * 30}%`,
            bottom: `${5 + Math.random() * 35}%`,
            background: `radial-gradient(circle, ${
              i % 4 === 0 ? '#ffff66' : i % 4 === 1 ? '#ffaa00' : i % 4 === 2 ? '#ff6600' : '#ff3300'
            } 0%, transparent 70%)`,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${8 + Math.random() * 12}px ${
              i % 2 === 0 ? '#ff6600' : '#ffaa00'
            }`,
          }}
          animate={{
            y: [0, -50 - Math.random() * 60, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
            opacity: [0.9, 0.4, 0.9],
            scale: [1, 0.6, 1],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Intense floating ember particles - top right */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`ember-tr-${i}`}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 10,
            height: 4 + Math.random() * 10,
            right: `${5 + Math.random() * 30}%`,
            top: `${5 + Math.random() * 35}%`,
            background: `radial-gradient(circle, ${
              i % 4 === 0 ? '#ffff66' : i % 4 === 1 ? '#ffaa00' : i % 4 === 2 ? '#ff6600' : '#ff3300'
            } 0%, transparent 70%)`,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${8 + Math.random() * 12}px ${
              i % 2 === 0 ? '#ff6600' : '#ffaa00'
            }`,
          }}
          animate={{
            y: [0, 50 + Math.random() * 60, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
            opacity: [0.9, 0.4, 0.9],
            scale: [1, 0.6, 1],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Spark streaks - bottom left */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`spark-bl-${i}`}
          className="absolute"
          style={{
            width: 2,
            height: 12 + Math.random() * 20,
            left: `${10 + Math.random() * 20}%`,
            bottom: `${20 + Math.random() * 25}%`,
            background: `linear-gradient(to top, transparent, #ffcc00, #ff6600, transparent)`,
            borderRadius: "50%",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -80 - Math.random() * 80],
            x: [0, (Math.random() - 0.5) * 40],
            opacity: [0, 1, 0],
            rotate: [0, (Math.random() - 0.5) * 30],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Spark streaks - top right */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`spark-tr-${i}`}
          className="absolute"
          style={{
            width: 2,
            height: 12 + Math.random() * 20,
            right: `${10 + Math.random() * 20}%`,
            top: `${20 + Math.random() * 25}%`,
            background: `linear-gradient(to bottom, transparent, #ffcc00, #ff6600, transparent)`,
            borderRadius: "50%",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, 80 + Math.random() * 80],
            x: [0, (Math.random() - 0.5) * 40],
            opacity: [0, 1, 0],
            rotate: [0, (Math.random() - 0.5) * 30],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Ambient glow overlays */}
      <div 
        className="absolute bottom-0 left-0 w-2/3 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 15% 85%, rgba(255, 60, 0, 0.25) 0%, rgba(255, 100, 0, 0.12) 30%, transparent 65%)",
        }}
      />
      <div 
        className="absolute top-0 right-0 w-2/3 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 85% 15%, rgba(255, 60, 0, 0.2) 0%, rgba(255, 100, 0, 0.1) 30%, transparent 65%)",
        }}
      />
    </div>
  );
}

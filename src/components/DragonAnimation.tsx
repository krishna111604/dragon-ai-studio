import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import dragonImage from "@/assets/dragon-fire.png";

export function DragonAnimation() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const glowControls = useAnimation();
  const dragon1Controls = useAnimation();
  const dragon2Controls = useAnimation();

  // Generate random positions for roaming
  const generateRandomPosition = useCallback(() => ({
    x: Math.random() * 60 - 30,
    y: Math.random() * 60 - 30,
    rotate: Math.random() * 20 - 10,
  }), []);

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

  // Continuous roaming animation for dragon 1
  useEffect(() => {
    if (prefersReducedMotion || isLowPower) return;

    const roamDragon1 = async () => {
      while (true) {
        const pos = generateRandomPosition();
        await dragon1Controls.start({
          x: pos.x,
          y: pos.y,
          rotate: pos.rotate,
          transition: { duration: 8 + Math.random() * 4, ease: "easeInOut" }
        });
      }
    };

    roamDragon1();
  }, [dragon1Controls, generateRandomPosition, prefersReducedMotion, isLowPower]);

  // Continuous roaming animation for dragon 2
  useEffect(() => {
    if (prefersReducedMotion || isLowPower) return;

    const roamDragon2 = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Offset start
      while (true) {
        const pos = generateRandomPosition();
        await dragon2Controls.start({
          x: -pos.x,
          y: -pos.y,
          rotate: -pos.rotate,
          transition: { duration: 10 + Math.random() * 4, ease: "easeInOut" }
        });
      }
    };

    roamDragon2();
  }, [dragon2Controls, generateRandomPosition, prefersReducedMotion, isLowPower]);

  const handleInteraction = useCallback(() => {
    setIsInteracting(true);
    glowControls.start({
      scale: [1, 1.4, 1],
      opacity: [0.4, 0.9, 0.4],
      transition: { duration: 0.8, ease: "easeOut" }
    });
    
    // Make dragons react to interaction
    dragon1Controls.start({
      scale: [1, 1.15, 1],
      transition: { duration: 0.5 }
    });
    dragon2Controls.start({
      scale: [1, 1.1, 1],
      transition: { duration: 0.5, delay: 0.1 }
    });
    
    setTimeout(() => setIsInteracting(false), 800);
  }, [glowControls, dragon1Controls, dragon2Controls]);

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

      {/* Roaming Dragon 1 - Bottom Left Area */}
      <motion.div
        animate={dragon1Controls}
        className="absolute -bottom-16 -left-16"
        style={{ width: 450, height: 450 }}
      >
        <motion.div
          animate={{
            y: [0, -12, 0, -8, 0],
            rotate: [-3, 3, -2, 2, -3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-full h-full"
        >
          <img
            src={dragonImage}
            alt=""
            className="w-full h-full object-contain"
            style={{ 
              filter: `drop-shadow(0 0 50px rgba(255, 100, 0, ${isInteracting ? 0.9 : 0.6})) drop-shadow(0 0 100px rgba(255, 50, 0, 0.4))`,
              opacity: isInteracting ? 0.95 : 0.8,
            }}
          />
        </motion.div>
      </motion.div>

      {/* Roaming Dragon 2 - Top Right Area (mirrored) */}
      <motion.div
        animate={dragon2Controls}
        className="absolute -top-12 -right-12"
        style={{ width: 380, height: 380 }}
      >
        <motion.div
          animate={{
            y: [0, 10, 0, 6, 0],
            rotate: [2, -2, 1, -1, 2],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="w-full h-full"
        >
          <img
            src={dragonImage}
            alt=""
            className="w-full h-full object-contain"
            style={{ 
              filter: `drop-shadow(0 0 40px rgba(255, 100, 0, ${isInteracting ? 0.8 : 0.5})) drop-shadow(0 0 80px rgba(255, 50, 0, 0.3))`,
              opacity: isInteracting ? 0.9 : 0.7,
              transform: "scaleX(-1)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Small roaming dragon 3 - Center area */}
      <motion.div
        className="absolute top-1/2 left-1/2"
        style={{ width: 200, height: 200 }}
        animate={{
          x: ["-50%", "-40%", "-60%", "-45%", "-55%", "-50%"],
          y: ["-50%", "-40%", "-60%", "-55%", "-45%", "-50%"],
          rotate: [0, 15, -10, 5, -15, 0],
          scale: [0.8, 0.85, 0.75, 0.9, 0.8],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img
          src={dragonImage}
          alt=""
          className="w-full h-full object-contain"
          style={{ 
            filter: `drop-shadow(0 0 30px rgba(255, 100, 0, 0.4)) drop-shadow(0 0 60px rgba(255, 50, 0, 0.2))`,
            opacity: 0.5,
          }}
        />
      </motion.div>

      {/* Intense floating ember particles following dragons */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 8,
            height: 3 + Math.random() * 8,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            background: `radial-gradient(circle, ${
              i % 4 === 0 ? '#ffff66' : i % 4 === 1 ? '#ffaa00' : i % 4 === 2 ? '#ff6600' : '#ff3300'
            } 0%, transparent 70%)`,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${6 + Math.random() * 10}px ${
              i % 2 === 0 ? '#ff6600' : '#ffaa00'
            }`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 50, 0],
            x: [0, (Math.random() - 0.5) * 60, 0],
            opacity: [0.8, 0.3, 0.8],
            scale: [1, 0.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 4,
          }}
        />
      ))}

      {/* Spark streaks */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute"
          style={{
            width: 2,
            height: 10 + Math.random() * 15,
            left: `${15 + Math.random() * 70}%`,
            top: `${15 + Math.random() * 70}%`,
            background: `linear-gradient(to top, transparent, #ffcc00, #ff6600, transparent)`,
            borderRadius: "50%",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -60 - Math.random() * 60],
            x: [0, (Math.random() - 0.5) * 30],
            opacity: [0, 1, 0],
            rotate: [0, (Math.random() - 0.5) * 40],
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 4,
          }}
        />
      ))}

      {/* Ambient glow overlays */}
      <div 
        className="absolute bottom-0 left-0 w-2/3 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 15% 85%, rgba(255, 60, 0, 0.2) 0%, rgba(255, 100, 0, 0.1) 30%, transparent 65%)",
        }}
      />
      <div 
        className="absolute top-0 right-0 w-2/3 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 85% 15%, rgba(255, 60, 0, 0.15) 0%, rgba(255, 100, 0, 0.08) 30%, transparent 65%)",
        }}
      />
    </div>
  );
}

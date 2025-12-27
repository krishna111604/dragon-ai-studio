import { useEffect, useState, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";

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
      scale: [1, 1.4, 1],
      opacity: [0.4, 0.9, 0.4],
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
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-background to-accent/10" />
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    >
      {/* Main fire gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 100%, rgba(255, 80, 0, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(255, 50, 0, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 85%, rgba(255, 100, 0, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 40, 0, 0.08) 0%, transparent 70%)
          `,
        }}
      />

      {/* Reactive pulsing glow overlay */}
      <motion.div
        animate={glowControls}
        initial={{ opacity: 0.3, scale: 1 }}
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255, 100, 0, 0.25) 0%, transparent 70%)",
        }}
      />

      {/* Continuous ambient fire pulse from bottom */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.2, 0.35, 0.2],
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(ellipse at 50% 120%, rgba(255, 69, 0, 0.4) 0%, rgba(255, 100, 0, 0.15) 40%, transparent 70%)",
        }}
      />

      {/* Secondary fire glow - left */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        style={{
          background: "radial-gradient(ellipse at 10% 90%, rgba(255, 50, 0, 0.3) 0%, transparent 50%)",
        }}
      />

      {/* Secondary fire glow - right */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{
          background: "radial-gradient(ellipse at 90% 85%, rgba(255, 80, 0, 0.25) 0%, transparent 45%)",
        }}
      />

      {/* Rising heat waves */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`heat-${i}`}
          className="absolute bottom-0"
          style={{
            left: `${15 + i * 18}%`,
            width: "120px",
            height: "60%",
            background: `linear-gradient(to top, rgba(255, ${60 + i * 10}, 0, 0.15) 0%, transparent 100%)`,
            filter: "blur(30px)",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.5, 0.3],
            scaleY: [1, 1.1, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7,
          }}
        />
      ))}

      {/* Intense floating ember particles */}
      {[...Array(35)].map((_, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 6,
            height: 2 + Math.random() * 6,
            left: `${5 + Math.random() * 90}%`,
            bottom: `${Math.random() * 20}%`,
            background: `radial-gradient(circle, ${
              i % 4 === 0 ? '#ffff66' : i % 4 === 1 ? '#ffaa00' : i % 4 === 2 ? '#ff6600' : '#ff3300'
            } 0%, transparent 70%)`,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${4 + Math.random() * 8}px ${
              i % 2 === 0 ? '#ff6600' : '#ffaa00'
            }`,
          }}
          animate={{
            y: [0, -100 - Math.random() * 200],
            x: [0, (Math.random() - 0.5) * 80],
            opacity: [0.9, 0],
            scale: [1, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Larger floating embers */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`large-ember-${i}`}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 8,
            height: 4 + Math.random() * 8,
            left: `${10 + Math.random() * 80}%`,
            bottom: "-5%",
            background: `radial-gradient(circle, #ffcc00 0%, #ff6600 50%, transparent 70%)`,
            boxShadow: `0 0 ${10 + Math.random() * 15}px #ff6600`,
          }}
          animate={{
            y: [0, -150 - Math.random() * 300],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [1, 0.8, 0],
            scale: [1, 0.7, 0.2],
          }}
          transition={{
            duration: 5 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 6,
          }}
        />
      ))}

      {/* Spark streaks rising */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute"
          style={{
            width: 2,
            height: 12 + Math.random() * 20,
            left: `${10 + Math.random() * 80}%`,
            bottom: "0%",
            background: `linear-gradient(to top, transparent, #ffcc00, #ff6600, transparent)`,
            borderRadius: "50%",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -100 - Math.random() * 150],
            x: [0, (Math.random() - 0.5) * 40],
            opacity: [0, 1, 0],
            rotate: [0, (Math.random() - 0.5) * 30],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Bottom fire glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(255, 60, 0, 0.3) 0%, rgba(255, 80, 0, 0.1) 50%, transparent 100%)",
        }}
      />

      {/* Corner ambient glows */}
      <div 
        className="absolute bottom-0 left-0 w-2/3 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 0% 100%, rgba(255, 60, 0, 0.25) 0%, transparent 60%)",
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-2/3 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 100% 100%, rgba(255, 80, 0, 0.2) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

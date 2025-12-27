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

  // Handle user interaction for reactive glow
  const handleInteraction = useCallback(() => {
    setIsInteracting(true);
    glowControls.start({
      scale: [1, 1.3, 1],
      opacity: [0.3, 0.6, 0.3],
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
        initial={{ opacity: 0.2, scale: 1 }}
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255, 100, 0, 0.15) 0%, transparent 70%)",
        }}
      />

      {/* Continuous ambient pulse */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(ellipse at 30% 70%, rgba(255, 69, 0, 0.1) 0%, transparent 50%)",
        }}
      />

      {/* Main fiery dragon border - swirling around the entire viewport */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Intense fire gradient for dragon body */}
          <linearGradient id="fireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff1a00" />
            <stop offset="20%" stopColor="#ff5500" />
            <stop offset="40%" stopColor="#ff8800" />
            <stop offset="60%" stopColor="#ff5500" />
            <stop offset="80%" stopColor="#ff2200" />
            <stop offset="100%" stopColor="#aa0000" />
          </linearGradient>

          {/* Bright core gradient */}
          <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffcc00" />
            <stop offset="50%" stopColor="#ffff66" />
            <stop offset="100%" stopColor="#ffcc00" />
          </linearGradient>

          {/* Trail gradient */}
          <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3300" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ff6600" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff9900" stopOpacity="0" />
          </linearGradient>
          
          {/* Ember glow gradient */}
          <radialGradient id="emberGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffaa00" stopOpacity="1" />
            <stop offset="30%" stopColor="#ff6600" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ff3300" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#990000" stopOpacity="0" />
          </radialGradient>
          
          {/* Super intense fire glow */}
          <filter id="fireGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="20" result="blur1" />
            <feGaussianBlur stdDeviation="40" result="blur2" />
            <feGaussianBlur stdDeviation="60" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="12" />
          </filter>

          <filter id="intenseGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
        </defs>

        {/* FLAME TRAIL 1 - Bottom-left outer sweep */}
        <motion.path
          d="M-200,1000 Q100,1200 400,1000 Q700,800 600,500 Q500,200 200,350 Q-100,500 0,750 Q100,1000 350,1100 Q700,1200 1000,1000"
          stroke="url(#trailGradient)"
          strokeWidth="80"
          fill="none"
          strokeLinecap="round"
          filter="url(#intenseGlow)"
          opacity="0.25"
          animate={{
            d: [
              "M-200,1000 Q100,1200 400,1000 Q700,800 600,500 Q500,200 200,350 Q-100,500 0,750 Q100,1000 350,1100 Q700,1200 1000,1000",
              "M-200,1050 Q50,1150 350,950 Q650,750 550,450 Q450,150 150,300 Q-150,450 -50,700 Q50,950 300,1050 Q650,1150 950,950",
              "M-200,1000 Q100,1200 400,1000 Q700,800 600,500 Q500,200 200,350 Q-100,500 0,750 Q100,1000 350,1100 Q700,1200 1000,1000",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* FLAME TRAIL 2 - Top-right outer sweep */}
        <motion.path
          d="M2120,100 Q1900,-150 1650,100 Q1400,350 1500,650 Q1600,950 1850,800 Q2100,650 2000,400 Q1900,150 1650,50 Q1300,-100 1050,100"
          stroke="url(#trailGradient)"
          strokeWidth="75"
          fill="none"
          strokeLinecap="round"
          filter="url(#intenseGlow)"
          opacity="0.25"
          animate={{
            d: [
              "M2120,100 Q1900,-150 1650,100 Q1400,350 1500,650 Q1600,950 1850,800 Q2100,650 2000,400 Q1900,150 1650,50 Q1300,-100 1050,100",
              "M2120,50 Q1850,-100 1600,150 Q1350,400 1450,700 Q1550,1000 1800,850 Q2050,700 1950,450 Q1850,200 1600,100 Q1250,-50 1000,150",
              "M2120,100 Q1900,-150 1650,100 Q1400,350 1500,650 Q1600,950 1850,800 Q2100,650 2000,400 Q1900,150 1650,50 Q1300,-100 1050,100",
            ],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main dragon body - bottom left */}
        <motion.path
          d="M-100,900 Q200,1100 400,950 Q600,800 500,600 Q400,400 200,500 Q0,600 100,800 Q200,1000 400,1050 Q700,1100 900,950"
          stroke="url(#fireGradient)"
          strokeWidth="70"
          fill="none"
          strokeLinecap="round"
          filter="url(#fireGlow)"
          opacity={isInteracting ? 0.5 : 0.35}
          animate={{
            d: [
              "M-100,900 Q200,1100 400,950 Q600,800 500,600 Q400,400 200,500 Q0,600 100,800 Q200,1000 400,1050 Q700,1100 900,950",
              "M-100,950 Q200,1050 350,900 Q550,750 450,550 Q350,350 150,450 Q-50,550 50,750 Q150,950 350,1000 Q650,1050 850,900",
              "M-100,900 Q200,1100 400,950 Q600,800 500,600 Q400,400 200,500 Q0,600 100,800 Q200,1000 400,1050 Q700,1100 900,950",
            ],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Main dragon body - top right */}
        <motion.path
          d="M2020,200 Q1800,-50 1600,150 Q1400,350 1500,550 Q1600,750 1800,650 Q2000,550 1900,350 Q1800,150 1600,100 Q1300,-50 1100,150"
          stroke="url(#fireGradient)"
          strokeWidth="65"
          fill="none"
          strokeLinecap="round"
          filter="url(#fireGlow)"
          opacity={isInteracting ? 0.5 : 0.35}
          animate={{
            d: [
              "M2020,200 Q1800,-50 1600,150 Q1400,350 1500,550 Q1600,750 1800,650 Q2000,550 1900,350 Q1800,150 1600,100 Q1300,-50 1100,150",
              "M2020,150 Q1750,0 1550,200 Q1350,400 1450,600 Q1550,800 1750,700 Q1950,600 1850,400 Q1750,200 1550,150 Q1250,0 1050,200",
              "M2020,200 Q1800,-50 1600,150 Q1400,350 1500,550 Q1600,750 1800,650 Q2000,550 1900,350 Q1800,150 1600,100 Q1300,-50 1100,150",
            ],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary flame layer - bottom left */}
        <motion.path
          d="M-50,850 Q250,1050 450,900 Q650,750 550,550 Q450,350 250,450 Q50,550 150,750 Q250,950 450,1000"
          stroke="#ff5500"
          strokeWidth="40"
          fill="none"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.35"
          animate={{
            d: [
              "M-50,850 Q250,1050 450,900 Q650,750 550,550 Q450,350 250,450 Q50,550 150,750 Q250,950 450,1000",
              "M-50,900 Q250,1000 400,850 Q600,700 500,500 Q400,300 200,400 Q0,500 100,700 Q200,900 400,950",
              "M-50,850 Q250,1050 450,900 Q650,750 550,550 Q450,350 250,450 Q50,550 150,750 Q250,950 450,1000",
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />

        {/* Secondary flame layer - top right */}
        <motion.path
          d="M1970,250 Q1750,0 1550,200 Q1350,400 1450,600 Q1550,800 1750,700 Q1950,600 1850,400"
          stroke="#ff5500"
          strokeWidth="35"
          fill="none"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.35"
          animate={{
            d: [
              "M1970,250 Q1750,0 1550,200 Q1350,400 1450,600 Q1550,800 1750,700 Q1950,600 1850,400",
              "M1970,200 Q1700,50 1500,250 Q1300,450 1400,650 Q1500,850 1700,750 Q1900,650 1800,450",
              "M1970,250 Q1750,0 1550,200 Q1350,400 1450,600 Q1550,800 1750,700 Q1950,600 1850,400",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />

        {/* Bright white-hot core - bottom left */}
        <motion.path
          d="M0,880 Q300,1080 500,930 Q700,780 600,580 Q500,380 300,480 Q100,580 200,780"
          stroke="url(#coreGradient)"
          strokeWidth="15"
          fill="none"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.5"
          animate={{
            d: [
              "M0,880 Q300,1080 500,930 Q700,780 600,580 Q500,380 300,480 Q100,580 200,780",
              "M0,930 Q300,1030 450,880 Q650,730 550,530 Q450,330 250,430 Q50,530 150,730",
              "M0,880 Q300,1080 500,930 Q700,780 600,580 Q500,380 300,480 Q100,580 200,780",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1,
          }}
        />

        {/* Bright white-hot core - top right */}
        <motion.path
          d="M1950,220 Q1720,20 1520,220 Q1320,420 1420,620 Q1520,820 1720,720"
          stroke="url(#coreGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.5"
          animate={{
            d: [
              "M1950,220 Q1720,20 1520,220 Q1320,420 1420,620 Q1520,820 1720,720",
              "M1950,170 Q1670,70 1470,270 Q1270,470 1370,670 Q1470,870 1670,770",
              "M1950,220 Q1720,20 1520,220 Q1320,420 1420,620 Q1520,820 1720,720",
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />
      </svg>

      {/* Intense floating ember particles - bottom left */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`ember-bl-${i}`}
          className="absolute rounded-full"
          style={{
            width: 5 + Math.random() * 12,
            height: 5 + Math.random() * 12,
            left: `${3 + Math.random() * 35}%`,
            bottom: `${3 + Math.random() * 40}%`,
            background: `radial-gradient(circle, ${
              i % 4 === 0 ? '#ffff66' : i % 4 === 1 ? '#ffaa00' : i % 4 === 2 ? '#ff6600' : '#ff3300'
            } 0%, transparent 70%)`,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${10 + Math.random() * 15}px ${
              i % 2 === 0 ? '#ff6600' : '#ffaa00'
            }`,
          }}
          animate={{
            y: [0, -40 - Math.random() * 80, 0],
            x: [0, (Math.random() - 0.5) * 60, 0],
            opacity: [0.8, 0.3, 0.8],
            scale: [1, 0.5, 1],
          }}
          transition={{
            duration: 2.5 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Intense floating ember particles - top right */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`ember-tr-${i}`}
          className="absolute rounded-full"
          style={{
            width: 5 + Math.random() * 12,
            height: 5 + Math.random() * 12,
            right: `${3 + Math.random() * 35}%`,
            top: `${3 + Math.random() * 40}%`,
            background: `radial-gradient(circle, ${
              i % 4 === 0 ? '#ffff66' : i % 4 === 1 ? '#ffaa00' : i % 4 === 2 ? '#ff6600' : '#ff3300'
            } 0%, transparent 70%)`,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${10 + Math.random() * 15}px ${
              i % 2 === 0 ? '#ff6600' : '#ffaa00'
            }`,
          }}
          animate={{
            y: [0, 40 + Math.random() * 80, 0],
            x: [0, (Math.random() - 0.5) * 60, 0],
            opacity: [0.8, 0.3, 0.8],
            scale: [1, 0.5, 1],
          }}
          transition={{
            duration: 2.5 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Spark streaks - bottom left */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`spark-bl-${i}`}
          className="absolute"
          style={{
            width: 2,
            height: 15 + Math.random() * 25,
            left: `${10 + Math.random() * 25}%`,
            bottom: `${15 + Math.random() * 30}%`,
            background: `linear-gradient(to top, transparent, #ffcc00, #ff6600, transparent)`,
            borderRadius: "50%",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -100 - Math.random() * 100],
            x: [0, (Math.random() - 0.5) * 50],
            opacity: [0, 1, 0],
            rotate: [0, (Math.random() - 0.5) * 45],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Spark streaks - top right */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`spark-tr-${i}`}
          className="absolute"
          style={{
            width: 2,
            height: 15 + Math.random() * 25,
            right: `${10 + Math.random() * 25}%`,
            top: `${15 + Math.random() * 30}%`,
            background: `linear-gradient(to bottom, transparent, #ffcc00, #ff6600, transparent)`,
            borderRadius: "50%",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, 100 + Math.random() * 100],
            x: [0, (Math.random() - 0.5) * 50],
            opacity: [0, 1, 0],
            rotate: [0, (Math.random() - 0.5) * 45],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Ambient glow overlays - intensified */}
      <div 
        className="absolute bottom-0 left-0 w-2/3 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 15% 85%, rgba(255, 60, 0, 0.2) 0%, rgba(255, 100, 0, 0.1) 30%, transparent 65%)",
        }}
      />
      <div 
        className="absolute top-0 right-0 w-2/3 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 85% 15%, rgba(255, 60, 0, 0.2) 0%, rgba(255, 100, 0, 0.1) 30%, transparent 65%)",
        }}
      />

      {/* Interactive pulse indicator */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          boxShadow: isInteracting 
            ? "inset 0 0 100px 20px rgba(255, 100, 0, 0.15)" 
            : "inset 0 0 60px 10px rgba(255, 100, 0, 0.05)",
        }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

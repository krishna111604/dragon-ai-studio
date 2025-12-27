import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function DragonAnimation() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);

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
      {/* Main fiery dragon border - swirling around the entire viewport */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Fire gradient for dragon body */}
          <linearGradient id="fireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff2d00" />
            <stop offset="25%" stopColor="#ff6a00" />
            <stop offset="50%" stopColor="#ff4500" />
            <stop offset="75%" stopColor="#ff2d00" />
            <stop offset="100%" stopColor="#8b0000" />
          </linearGradient>
          
          {/* Ember glow gradient */}
          <radialGradient id="emberGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ff2d00" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b0000" stopOpacity="0" />
          </radialGradient>
          
          {/* Intense fire glow */}
          <filter id="fireGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="15" result="blur1" />
            <feGaussianBlur stdDeviation="30" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Bottom-left swirling dragon */}
        <motion.path
          d="M-100,900 Q200,1100 400,950 Q600,800 500,600 Q400,400 200,500 Q0,600 100,800 Q200,1000 400,1050 Q700,1100 900,950"
          stroke="url(#fireGradient)"
          strokeWidth="60"
          fill="none"
          strokeLinecap="round"
          filter="url(#fireGlow)"
          opacity="0.3"
          animate={{
            d: [
              "M-100,900 Q200,1100 400,950 Q600,800 500,600 Q400,400 200,500 Q0,600 100,800 Q200,1000 400,1050 Q700,1100 900,950",
              "M-100,950 Q200,1050 350,900 Q550,750 450,550 Q350,350 150,450 Q-50,550 50,750 Q150,950 350,1000 Q650,1050 850,900",
              "M-100,900 Q200,1100 400,950 Q600,800 500,600 Q400,400 200,500 Q0,600 100,800 Q200,1000 400,1050 Q700,1100 900,950",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Top-right swirling dragon */}
        <motion.path
          d="M2020,200 Q1800,-50 1600,150 Q1400,350 1500,550 Q1600,750 1800,650 Q2000,550 1900,350 Q1800,150 1600,100 Q1300,-50 1100,150"
          stroke="url(#fireGradient)"
          strokeWidth="55"
          fill="none"
          strokeLinecap="round"
          filter="url(#fireGlow)"
          opacity="0.3"
          animate={{
            d: [
              "M2020,200 Q1800,-50 1600,150 Q1400,350 1500,550 Q1600,750 1800,650 Q2000,550 1900,350 Q1800,150 1600,100 Q1300,-50 1100,150",
              "M2020,150 Q1750,0 1550,200 Q1350,400 1450,600 Q1550,800 1750,700 Q1950,600 1850,400 Q1750,200 1550,150 Q1250,0 1050,200",
              "M2020,200 Q1800,-50 1600,150 Q1400,350 1500,550 Q1600,750 1800,650 Q2000,550 1900,350 Q1800,150 1600,100 Q1300,-50 1100,150",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner fire layer - bottom left */}
        <motion.path
          d="M-50,850 Q250,1050 450,900 Q650,750 550,550 Q450,350 250,450 Q50,550 150,750 Q250,950 450,1000"
          stroke="#ff6a00"
          strokeWidth="30"
          fill="none"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.25"
          animate={{
            d: [
              "M-50,850 Q250,1050 450,900 Q650,750 550,550 Q450,350 250,450 Q50,550 150,750 Q250,950 450,1000",
              "M-50,900 Q250,1000 400,850 Q600,700 500,500 Q400,300 200,400 Q0,500 100,700 Q200,900 400,950",
              "M-50,850 Q250,1050 450,900 Q650,750 550,550 Q450,350 250,450 Q50,550 150,750 Q250,950 450,1000",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />

        {/* Inner fire layer - top right */}
        <motion.path
          d="M1970,250 Q1750,0 1550,200 Q1350,400 1450,600 Q1550,800 1750,700 Q1950,600 1850,400"
          stroke="#ff6a00"
          strokeWidth="25"
          fill="none"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.25"
          animate={{
            d: [
              "M1970,250 Q1750,0 1550,200 Q1350,400 1450,600 Q1550,800 1750,700 Q1950,600 1850,400",
              "M1970,200 Q1700,50 1500,250 Q1300,450 1400,650 Q1500,850 1700,750 Q1900,650 1800,450",
              "M1970,250 Q1750,0 1550,200 Q1350,400 1450,600 Q1550,800 1750,700 Q1950,600 1850,400",
            ],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />

        {/* Bright core - bottom left */}
        <motion.path
          d="M0,880 Q300,1080 500,930 Q700,780 600,580 Q500,380 300,480 Q100,580 200,780"
          stroke="#ffaa00"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.35"
          animate={{
            d: [
              "M0,880 Q300,1080 500,930 Q700,780 600,580 Q500,380 300,480 Q100,580 200,780",
              "M0,930 Q300,1030 450,880 Q650,730 550,530 Q450,330 250,430 Q50,530 150,730",
              "M0,880 Q300,1080 500,930 Q700,780 600,580 Q500,380 300,480 Q100,580 200,780",
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />

        {/* Bright core - top right */}
        <motion.path
          d="M1950,220 Q1720,20 1520,220 Q1320,420 1420,620 Q1520,820 1720,720"
          stroke="#ffaa00"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.35"
          animate={{
            d: [
              "M1950,220 Q1720,20 1520,220 Q1320,420 1420,620 Q1520,820 1720,720",
              "M1950,170 Q1670,70 1470,270 Q1270,470 1370,670 Q1470,870 1670,770",
              "M1950,220 Q1720,20 1520,220 Q1320,420 1420,620 Q1520,820 1720,720",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        />
      </svg>

      {/* Floating ember particles - bottom left */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`ember-bl-${i}`}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 8,
            height: 4 + Math.random() * 8,
            left: `${5 + Math.random() * 30}%`,
            bottom: `${5 + Math.random() * 35}%`,
            background: `radial-gradient(circle, ${
              i % 3 === 0 ? '#ffaa00' : i % 3 === 1 ? '#ff6a00' : '#ff2d00'
            } 0%, transparent 70%)`,
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -30 - Math.random() * 50, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
            opacity: [0.6, 0.2, 0.6],
            scale: [1, 0.6, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Floating ember particles - top right */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`ember-tr-${i}`}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 8,
            height: 4 + Math.random() * 8,
            right: `${5 + Math.random() * 30}%`,
            top: `${5 + Math.random() * 35}%`,
            background: `radial-gradient(circle, ${
              i % 3 === 0 ? '#ffaa00' : i % 3 === 1 ? '#ff6a00' : '#ff2d00'
            } 0%, transparent 70%)`,
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, 30 + Math.random() * 50, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
            opacity: [0.6, 0.2, 0.6],
            scale: [1, 0.6, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Ambient glow overlays */}
      <div 
        className="absolute bottom-0 left-0 w-1/2 h-1/2 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 20% 80%, rgba(255, 45, 0, 0.15) 0%, transparent 60%)",
        }}
      />
      <div 
        className="absolute top-0 right-0 w-1/2 h-1/2 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 80% 20%, rgba(255, 45, 0, 0.15) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

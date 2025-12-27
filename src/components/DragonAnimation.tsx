import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, animate } from "framer-motion";

interface Point {
  x: number;
  y: number;
}

export function DragonAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Motion values for smooth animation
  const dragonX = useMotionValue(0);
  const dragonY = useMotionValue(0);
  const dragonRotation = useMotionValue(0);
  
  // Smooth spring physics
  const springX = useSpring(dragonX, { stiffness: 30, damping: 20 });
  const springY = useSpring(dragonY, { stiffness: 30, damping: 20 });
  const springRotation = useSpring(dragonRotation, { stiffness: 40, damping: 25 });

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    
    // Check for low-power mode (battery saver)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery?.().then((battery: any) => {
        setIsLowPower(battery.level < 0.2 && !battery.charging);
      });
    }
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || isLowPower || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const margin = 50;
    
    // Define flight paths
    const borderPath: Point[] = [
      { x: margin, y: margin },
      { x: width - margin, y: margin },
      { x: width - margin, y: height - margin },
      { x: margin, y: height - margin },
    ];

    const sectionPath: Point[] = [
      { x: width * 0.2, y: height * 0.3 },
      { x: width * 0.5, y: height * 0.2 },
      { x: width * 0.8, y: height * 0.4 },
      { x: width * 0.6, y: height * 0.7 },
      { x: width * 0.3, y: height * 0.6 },
    ];

    let currentPathIndex = 0;
    let isBorderMode = true;
    let animationId: number;
    let lastTime = 0;
    const speed = 0.15;

    const getPath = () => isBorderMode ? borderPath : sectionPath;
    
    const animateDragon = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      
      if (delta > 16) { // ~60fps cap
        const path = getPath();
        const currentPoint = path[currentPathIndex];
        const nextIndex = (currentPathIndex + 1) % path.length;
        const nextPoint = path[nextIndex];
        
        const currentX = dragonX.get();
        const currentY = dragonY.get();
        
        const dx = nextPoint.x - currentX;
        const dy = nextPoint.y - currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 20) {
          currentPathIndex = nextIndex;
          
          // Switch modes occasionally
          if (nextIndex === 0) {
            isBorderMode = !isBorderMode;
          }
        } else {
          const moveX = (dx / distance) * speed * delta;
          const moveY = (dy / distance) * speed * delta;
          
          dragonX.set(currentX + moveX);
          dragonY.set(currentY + moveY);
          
          // Calculate rotation based on movement direction
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          dragonRotation.set(angle);
        }
        
        lastTime = timestamp;
      }
      
      animationId = requestAnimationFrame(animateDragon);
    };

    // Start animation
    dragonX.set(margin);
    dragonY.set(margin);
    animationId = requestAnimationFrame(animateDragon);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [dimensions, prefersReducedMotion, isLowPower, dragonX, dragonY, dragonRotation]);

  // Static fallback for reduced motion
  if (prefersReducedMotion || isLowPower) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-accent/5" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    >
      {/* Ambient glow effects */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl"
          style={{
            x: springX,
            y: springY,
            background: "radial-gradient(circle, hsl(0, 70%, 50%, 0.15) 0%, transparent 70%)",
            translateX: "-50%",
            translateY: "-50%",
          }}
        />
      </div>

      {/* Dragon SVG */}
      <motion.svg
        width="200"
        height="80"
        viewBox="0 0 200 80"
        className="absolute"
        style={{
          x: springX,
          y: springY,
          rotate: springRotation,
          translateX: "-50%",
          translateY: "-50%",
          opacity: 0.25,
          filter: "blur(0.5px)",
        }}
      >
        {/* Dragon body - serpentine shape */}
        <defs>
          <linearGradient id="dragonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(0, 80%, 45%)" />
            <stop offset="50%" stopColor="hsl(20, 90%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 70%, 40%)" />
          </linearGradient>
          <filter id="dragonGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="emberGlow">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Main body */}
        <motion.path
          d="M10 40 Q30 20 50 40 T90 40 T130 40 T170 40 Q180 40 190 35"
          stroke="url(#dragonGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          filter="url(#dragonGlow)"
          animate={{
            d: [
              "M10 40 Q30 20 50 40 T90 40 T130 40 T170 40 Q180 40 190 35",
              "M10 40 Q30 60 50 40 T90 40 T130 40 T170 40 Q180 40 190 45",
              "M10 40 Q30 20 50 40 T90 40 T130 40 T170 40 Q180 40 190 35",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary body layer */}
        <motion.path
          d="M15 40 Q35 25 55 40 T95 40 T135 40 T175 40"
          stroke="hsl(25, 90%, 55%)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
          animate={{
            d: [
              "M15 40 Q35 25 55 40 T95 40 T135 40 T175 40",
              "M15 40 Q35 55 55 40 T95 40 T135 40 T175 40",
              "M15 40 Q35 25 55 40 T95 40 T135 40 T175 40",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1,
          }}
        />

        {/* Head */}
        <motion.ellipse
          cx="190"
          cy="38"
          rx="10"
          ry="6"
          fill="hsl(0, 75%, 45%)"
          filter="url(#dragonGlow)"
        />

        {/* Wings */}
        <motion.path
          d="M60 40 Q70 15 90 25 L80 40"
          fill="hsl(0, 70%, 50%)"
          opacity="0.7"
          filter="url(#dragonGlow)"
          animate={{
            d: [
              "M60 40 Q70 15 90 25 L80 40",
              "M60 40 Q70 5 90 20 L80 40",
              "M60 40 Q70 15 90 25 L80 40",
            ],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M120 40 Q130 15 150 25 L140 40"
          fill="hsl(0, 70%, 50%)"
          opacity="0.7"
          filter="url(#dragonGlow)"
          animate={{
            d: [
              "M120 40 Q130 15 150 25 L140 40",
              "M120 40 Q130 5 150 20 L140 40",
              "M120 40 Q130 15 150 25 L140 40",
            ],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.15,
          }}
        />

        {/* Tail */}
        <motion.path
          d="M10 40 Q0 30 5 20"
          stroke="hsl(0, 75%, 45%)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: [
              "M10 40 Q0 30 5 20",
              "M10 40 Q0 50 5 60",
              "M10 40 Q0 30 5 20",
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Ember particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.circle
            key={i}
            r="2"
            fill="hsl(30, 100%, 60%)"
            filter="url(#emberGlow)"
            animate={{
              cx: [50 + i * 30, 55 + i * 30, 50 + i * 30],
              cy: [45, 35, 45],
              opacity: [0.8, 0.3, 0.8],
              scale: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5 + i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.svg>

      {/* Trailing ember particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            x: springX,
            y: springY,
            translateX: -100 - i * 40,
            translateY: Math.sin(i) * 20,
            background: `radial-gradient(circle, hsl(${20 + i * 10}, 100%, 60%) 0%, transparent 70%)`,
            opacity: 0.4 - i * 0.1,
            filter: "blur(2px)",
          }}
        />
      ))}
    </div>
  );
}

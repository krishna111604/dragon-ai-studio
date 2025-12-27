import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Quote, Film, Sparkles } from "lucide-react";

const inspirations = [
  { type: "quote", content: "Cinema is a matter of what's in the frame and what's out.", author: "Martin Scorsese", icon: Quote },
  { type: "tip", content: "Use the rule of thirds for dynamic composition. Place key elements along the grid intersections.", icon: Lightbulb },
  { type: "quote", content: "A film is never really good unless the camera is an eye in the head of a poet.", author: "Orson Welles", icon: Quote },
  { type: "tip", content: "Natural light during golden hour creates warm, cinematic tones that are hard to replicate artificially.", icon: Lightbulb },
  { type: "quote", content: "The only way to do great work is to love what you do.", author: "Steve Jobs", icon: Quote },
  { type: "tip", content: "Let your actors breathe. Sometimes the most powerful moments come from silence.", icon: Lightbulb },
  { type: "quote", content: "Every frame is a painting.", author: "Akira Kurosawa", icon: Quote },
  { type: "tip", content: "Color grading can completely transform the emotional tone of your scene. Experiment boldly.", icon: Lightbulb },
  { type: "quote", content: "If it can be written, or thought, it can be filmed.", author: "Stanley Kubrick", icon: Quote },
  { type: "tip", content: "Sound design is half the experience. Never underestimate the power of audio.", icon: Lightbulb },
];

export function InspirationFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % inspirations.length);
        setIsAnimating(false);
      }, 300);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const current = inspirations[currentIndex];
  const Icon = current.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Daily Inspiration
      </h2>
      <div className="card-cinematic rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-glow opacity-50" />
        
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isAnimating ? 0 : 1, y: isAnimating ? -20 : 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              {current.type === "quote" ? (
                <>
                  <p className="text-lg italic text-foreground mb-2">"{current.content}"</p>
                  <p className="text-sm text-primary">— {current.author}</p>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-primary mb-2">Pro Tip</p>
                  <p className="text-foreground">{current.content}</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Progress dots */}
        <div className="flex gap-1 mt-4 justify-center">
          {inspirations.map((_, i) => (
            <button
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
              }`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

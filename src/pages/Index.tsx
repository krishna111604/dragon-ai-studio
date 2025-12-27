import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Film, ArrowRight, Sparkles, Clapperboard, Brain, Music, BookOpen, TrendingUp } from "lucide-react";
import { AuthRedirect } from "@/components/ProtectedRoute";

const features = [
  { icon: Sparkles, title: "Script Analyzer", desc: "Deep story structure and emotional arc analysis" },
  { icon: Clapperboard, title: "Director's Lens", desc: "Camera angles, lighting, and shot composition" },
  { icon: Brain, title: "Dream Weaver", desc: "Creative brainstorming and plot twists" },
  { icon: Music, title: "Emotional Arc", desc: "Music and sound design suggestions" },
  { icon: BookOpen, title: "Film Historian", desc: "References and style inspirations" },
  { icon: TrendingUp, title: "The Oracle", desc: "Predictive audience analytics" },
];

export default function Index() {
  return (
    <AuthRedirect>
      <div className="min-h-screen bg-background film-grain">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl text-gradient-gold tracking-wider">DRAGON AI</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
              Sign In
            </Button>
          </Link>
        </header>

        {/* Hero */}
        <main className="relative z-10 container mx-auto px-4 pt-20 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-display mb-6 tracking-tight">
              <span className="text-gradient-gold">DRAGON AI</span>
              <br />
              <span className="text-foreground">Filmmaking Companion</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyze scripts, craft cinematic scenes, and predict audience impact with AI-powered insights for filmmakers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button className="btn-hero">
                  Get Started <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-6">Part of the Knight's Vision Ecosystem</p>
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="insight-card hover-lift"
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </div>
    </AuthRedirect>
  );
}

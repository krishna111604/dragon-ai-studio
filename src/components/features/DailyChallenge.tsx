import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Target, 
  CheckCircle2, 
  Lightbulb, 
  Trophy,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap
} from "lucide-react";

interface Challenge {
  id: string;
  challenge_date: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  tips: string[];
}

interface Completion {
  id: string;
  challenge_id: string;
  notes: string;
  completed_at: string;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const categoryIcons: Record<string, React.ReactNode> = {
  cinematography: <Target className="w-4 h-4" />,
  storytelling: <Lightbulb className="w-4 h-4" />,
  "production design": <Zap className="w-4 h-4" />,
  "sound design": <Flame className="w-4 h-4" />,
};

export function DailyChallenge() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    try {
      const { data: challengeData, error: challengeError } = await supabase
        .from("daily_challenges")
        .select("*")
        .order("challenge_date", { ascending: true })
        .limit(7);

      if (challengeError) throw challengeError;
      setChallenges(challengeData || []);

      if (user) {
        const { data: completionData } = await supabase
          .from("challenge_completions")
          .select("*")
          .eq("user_id", user.id);
        setCompletions(completionData || []);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async () => {
    if (!user || !currentChallenge) return;
    setCompleting(true);

    try {
      const { error } = await supabase.from("challenge_completions").insert({
        user_id: user.id,
        challenge_id: currentChallenge.id,
        notes: notes,
      });

      if (error) throw error;

      setCompletions([...completions, {
        id: crypto.randomUUID(),
        challenge_id: currentChallenge.id,
        notes,
        completed_at: new Date().toISOString(),
      }]);
      setNotes("");
      
      toast({
        title: "🎬 Challenge Completed!",
        description: "Great work, filmmaker! Keep pushing your creative boundaries.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const currentChallenge = challenges[currentIndex];
  const isCompleted = currentChallenge && 
    completions.some(c => c.challenge_id === currentChallenge.id);
  const completedCount = completions.length;

  if (loading) {
    return (
      <Card className="card-cinematic">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentChallenge) {
    return (
      <Card className="card-cinematic">
        <CardContent className="p-6 text-center text-muted-foreground">
          No challenges available yet. Check back soon!
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="card-cinematic overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-glow opacity-30" />
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-gradient-gold">Daily Challenge</span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  {new Date(currentChallenge.challenge_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{completedCount} completed</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChallenge.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Challenge Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={difficultyColors[currentChallenge.difficulty]}>
                      {currentChallenge.difficulty}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {categoryIcons[currentChallenge.category] || <Target className="w-3 h-3" />}
                      {currentChallenge.category}
                    </Badge>
                    {isCompleted && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold">{currentChallenge.title}</h3>
                  <p className="text-muted-foreground">{currentChallenge.description}</p>
                </div>
              </div>

              {/* Tips Section */}
              {currentChallenge.tips && currentChallenge.tips.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    {showTips ? "Hide Tips" : "Show Tips"}
                  </button>
                  
                  <AnimatePresence>
                    {showTips && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-muted/50 rounded-lg p-4 space-y-2"
                      >
                        {currentChallenge.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">{tip}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Completion Section */}
              {user && !isCompleted && (
                <div className="space-y-3 pt-2">
                  <Textarea
                    placeholder="Share your experience, what you learned, or any notes about completing this challenge..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] bg-muted/50"
                  />
                  <Button
                    onClick={completeChallenge}
                    disabled={completing}
                    className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
                  >
                    {completing ? "Completing..." : "Mark as Complete"}
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {challenges.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentIndex 
                          ? "bg-primary w-4" 
                          : completions.some(c => c.challenge_id === challenges[i]?.id)
                            ? "bg-green-500"
                            : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.min(challenges.length - 1, currentIndex + 1))}
                  disabled={currentIndex === challenges.length - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

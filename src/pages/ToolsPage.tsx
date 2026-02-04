import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute, LoadingScreen } from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyChallenge } from "@/components/features/DailyChallenge";
import { ShotListGenerator } from "@/components/features/ShotListGenerator";
import { DirectorStyleAnalyzer } from "@/components/features/DirectorStyleAnalyzer";
import { MoodBoardCreator } from "@/components/features/MoodBoardCreator";
import { CallSheetGenerator } from "@/components/features/CallSheetGenerator";
import { BudgetEstimator } from "@/components/features/BudgetEstimator";
import { ProgressJournal } from "@/components/features/ProgressJournal";
import {
  Target,
  Camera,
  Clapperboard,
  Palette,
  ClipboardList,
  Calculator,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function ToolsPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("challenges");

  if (loading) return <LoadingScreen />;

  const tools = [
    { id: "challenges", label: "Daily Challenges", icon: Target },
    { id: "shotlist", label: "Shot List", icon: Camera },
    { id: "director", label: "Director Style", icon: Clapperboard },
    { id: "moodboard", label: "Mood Board", icon: Palette },
    { id: "callsheet", label: "Call Sheet", icon: ClipboardList },
    { id: "budget", label: "Budget", icon: Calculator },
    { id: "journal", label: "Journal", icon: BookOpen },
  ];

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-background p-4 md:p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-display text-gradient-gold">
                    Filmmaker's Toolkit
                  </h1>
                  <p className="text-muted-foreground">
                    Professional tools to level up your filmmaking
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tools Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent mb-6">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <TabsTrigger
                      key={tool.id}
                      value={tool.id}
                      className="data-[state=active]:bg-gradient-gold data-[state=active]:text-primary-foreground flex items-center gap-2 px-4 py-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tool.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="challenges" className="mt-0">
                  <DailyChallenge />
                </TabsContent>

                <TabsContent value="shotlist" className="mt-0">
                  <ShotListGenerator />
                </TabsContent>

                <TabsContent value="director" className="mt-0">
                  <DirectorStyleAnalyzer />
                </TabsContent>

                <TabsContent value="moodboard" className="mt-0">
                  <MoodBoardCreator />
                </TabsContent>

                <TabsContent value="callsheet" className="mt-0">
                  <CallSheetGenerator />
                </TabsContent>

                <TabsContent value="budget" className="mt-0">
                  <BudgetEstimator />
                </TabsContent>

                <TabsContent value="journal" className="mt-0">
                  <ProgressJournal />
                </TabsContent>
              </motion.div>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

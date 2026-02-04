import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calculator,
  Sparkles,
  Loader2,
  Save,
  Plus,
  Trash2,
  Download,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LineItem {
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface BudgetEstimatorProps {
  projectId?: string;
  scriptContent?: string;
}

const categories = [
  "Pre-Production",
  "Cast",
  "Crew",
  "Equipment",
  "Locations",
  "Set Design",
  "Costumes & Makeup",
  "Transportation",
  "Catering",
  "Post-Production",
  "Music & Sound",
  "Insurance",
  "Marketing",
  "Contingency",
  "Other",
];

export function BudgetEstimator({ projectId, scriptContent }: BudgetEstimatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const addLineItem = () => {
    if (category && description && unitCost > 0) {
      const newItem: LineItem = {
        category,
        description,
        quantity,
        unitCost,
        total: quantity * unitCost,
      };
      setLineItems([...lineItems, newItem]);
      setDescription("");
      setQuantity(1);
      setUnitCost(0);
    }
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const totalBudget = lineItems.reduce((sum, item) => sum + item.total, 0);

  const generateBudgetEstimate = async () => {
    if (!scriptContent?.trim()) {
      toast({
        title: "Script Required",
        description: "Please add script content to your project for AI budget estimation.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const prompt = `As a professional film production manager, analyze this script excerpt and provide a rough budget estimate.

SCRIPT:
${scriptContent.slice(0, 2000)}

Provide a detailed budget breakdown with line items. Consider:
- Cast (lead actors, supporting, extras)
- Crew (director, DP, sound, etc.)
- Equipment (cameras, lighting, grip)
- Locations (permits, rental)
- Set design and props
- Costumes and makeup
- Transportation
- Catering
- Post-production (editing, VFX, color)
- Music and sound design
- Insurance and contingency

Return ONLY a JSON array with this structure:
[
  {"category": "Cast", "description": "Lead Actor (2 weeks)", "quantity": 1, "unitCost": 5000, "total": 5000},
  {"category": "Crew", "description": "Director of Photography (2 weeks)", "quantity": 1, "unitCost": 3500, "total": 3500}
]

Assume this is an indie production with moderate budget. Be realistic.`;

      const { data, error } = await supabase.functions.invoke("dragon-ai", {
        body: { feature: "budget_estimate", userPrompt: prompt },
      });

      if (error) throw error;

      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0]);
        setLineItems(items);
        toast({
          title: "💰 Budget Generated!",
          description: `Estimated ${items.length} line items.`,
        });
      }
    } catch (error: any) {
      console.error("Budget generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate budget estimate.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveBudget = async () => {
    if (!user || !projectId || lineItems.length === 0) {
      toast({
        title: "Cannot Save",
        description: "Please add line items first.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("project_budgets").insert({
        project_id: projectId,
        user_id: user.id,
        total_estimate: totalBudget,
        line_items: lineItems as unknown as any,
        notes: notes,
      });

      if (error) throw error;

      toast({
        title: "Budget Saved!",
        description: "Your budget estimate has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportBudget = () => {
    const grouped = lineItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, LineItem[]>);

    let content = "PRODUCTION BUDGET ESTIMATE\n";
    content += "=".repeat(50) + "\n\n";

    Object.entries(grouped).forEach(([cat, items]) => {
      const catTotal = items.reduce((sum, i) => sum + i.total, 0);
      content += `${cat.toUpperCase()} - $${catTotal.toLocaleString()}\n`;
      content += "-".repeat(40) + "\n";
      items.forEach((item) => {
        content += `  ${item.description}: ${item.quantity} x $${item.unitCost.toLocaleString()} = $${item.total.toLocaleString()}\n`;
      });
      content += "\n";
    });

    content += "=".repeat(50) + "\n";
    content += `TOTAL BUDGET: $${totalBudget.toLocaleString()}\n`;
    content += "\nNotes:\n" + notes;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "production-budget.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoryTotals = lineItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.total;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="card-cinematic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-gradient-gold">Budget Estimator</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Production cost planning
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {/* AI Generation */}
            {scriptContent && (
              <Button
                onClick={generateBudgetEstimate}
                disabled={generating}
                variant="outline"
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Script...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Generate Budget from Script
                  </>
                )}
              </Button>
            )}

            {/* Total Display */}
            <div className="bg-gradient-gold/10 rounded-lg p-4 border border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                </div>
                <span className="text-2xl font-bold text-gradient-gold">
                  ${totalBudget.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Category Summary */}
            {Object.keys(categoryTotals).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryTotals).map(([cat, total]) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat}: ${total.toLocaleString()}
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Line Item */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border/50">
              <p className="text-sm font-medium">Add Line Item</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit Cost ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="bg-muted/50"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addLineItem} className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Line Items List */}
            <AnimatePresence>
              {lineItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {lineItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <span className="font-medium">{item.description}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.quantity} × ${item.unitCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${item.total.toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Budget notes, assumptions, contingencies..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-muted/50 min-h-[60px]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={exportBudget}
                variant="outline"
                className="flex-1"
                disabled={lineItems.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {projectId && (
                <Button
                  onClick={saveBudget}
                  disabled={saving || lineItems.length === 0}
                  className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

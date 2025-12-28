import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Edit2, Check, X, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Character {
  id: string;
  name: string;
  description: string;
  appearance_details: string | null;
  reference_image_url: string | null;
  created_at: string;
}

interface CharacterManagerProps {
  projectId: string;
  onCharacterSelect?: (character: Character) => void;
}

export function CharacterManager({ projectId, onCharacterSelect }: CharacterManagerProps) {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    description: "",
    appearance_details: ""
  });
  
  const { toast } = useToast();

  const fetchCharacters = async () => {
    if (!projectId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("project_characters")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    
    if (!error && data) {
      setCharacters(data as Character[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchCharacters();
    }
  }, [open, projectId]);

  const addCharacter = async () => {
    if (!user || !projectId || !newCharacter.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("project_characters").insert({
      project_id: projectId,
      user_id: user.id,
      name: newCharacter.name.trim(),
      description: newCharacter.description.trim(),
      appearance_details: newCharacter.appearance_details.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add character", variant: "destructive" });
    } else {
      toast({ title: "Added", description: `${newCharacter.name} added to project` });
      setNewCharacter({ name: "", description: "", appearance_details: "" });
      setShowAddForm(false);
      fetchCharacters();
    }
  };

  const updateCharacter = async (character: Character) => {
    const { error } = await supabase
      .from("project_characters")
      .update({
        name: character.name,
        description: character.description,
        appearance_details: character.appearance_details,
      })
      .eq("id", character.id);

    if (!error) {
      toast({ title: "Updated", description: "Character updated" });
      setEditingId(null);
      fetchCharacters();
    }
  };

  const deleteCharacter = async (id: string) => {
    const { error } = await supabase
      .from("project_characters")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Deleted", description: "Character removed" });
      fetchCharacters();
    }
  };

  const getCharacterPrompt = (character: Character): string => {
    let prompt = `Character: ${character.name}. ${character.description}`;
    if (character.appearance_details) {
      prompt += ` Appearance: ${character.appearance_details}`;
    }
    return prompt;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Characters
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Character Profiles
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-4">
          Define characters to maintain consistent appearances across AI-generated images.
        </p>

        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)} 
            size="sm" 
            variant={showAddForm ? "outline" : "default"}
            className={!showAddForm ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            {showAddForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showAddForm ? "Cancel" : "Add Character"}
          </Button>
        </div>

        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border rounded-lg p-4 mb-4 space-y-3"
          >
            <Input
              placeholder="Character name (e.g., Detective Sarah)"
              value={newCharacter.name}
              onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
              className="bg-muted/50"
            />
            <Textarea
              placeholder="Character description (role, personality, background)"
              value={newCharacter.description}
              onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
              className="bg-muted/50 min-h-[60px]"
            />
            <Textarea
              placeholder="Appearance details (height, hair, clothing, distinctive features)"
              value={newCharacter.appearance_details}
              onChange={(e) => setNewCharacter({ ...newCharacter, appearance_details: e.target.value })}
              className="bg-muted/50 min-h-[60px]"
            />
            <Button onClick={addCharacter} size="sm" className="w-full">
              <Check className="w-4 h-4 mr-1" /> Save Character
            </Button>
          </motion.div>
        )}

        <div className="flex-1 overflow-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : characters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No characters defined yet</p>
              <p className="text-sm">Add characters to maintain consistency in your scenes</p>
            </div>
          ) : (
            <AnimatePresence>
              {characters.map((character) => (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border border-border rounded-lg p-4"
                >
                  {editingId === character.id ? (
                    <div className="space-y-2">
                      <Input
                        value={character.name}
                        onChange={(e) => {
                          const updated = characters.map(c => 
                            c.id === character.id ? { ...c, name: e.target.value } : c
                          );
                          setCharacters(updated);
                        }}
                        className="bg-muted/50"
                      />
                      <Textarea
                        value={character.description}
                        onChange={(e) => {
                          const updated = characters.map(c => 
                            c.id === character.id ? { ...c, description: e.target.value } : c
                          );
                          setCharacters(updated);
                        }}
                        className="bg-muted/50 min-h-[50px]"
                      />
                      <Textarea
                        value={character.appearance_details || ""}
                        onChange={(e) => {
                          const updated = characters.map(c => 
                            c.id === character.id ? { ...c, appearance_details: e.target.value } : c
                          );
                          setCharacters(updated);
                        }}
                        placeholder="Appearance details"
                        className="bg-muted/50 min-h-[50px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateCharacter(character)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingId(null);
                          fetchCharacters();
                        }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            {character.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{character.description}</p>
                          {character.appearance_details && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {character.appearance_details}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {onCharacterSelect && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onCharacterSelect(character);
                                setOpen(false);
                              }}
                            >
                              Use
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(character.id)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteCharacter(character.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useCharacterPrompt(characters: Character[]): (characterId?: string) => string {
  return (characterId?: string) => {
    if (!characterId) return "";
    const character = characters.find(c => c.id === characterId);
    if (!character) return "";
    
    let prompt = `Include character: ${character.name}. ${character.description}`;
    if (character.appearance_details) {
      prompt += ` Physical appearance: ${character.appearance_details}`;
    }
    return prompt;
  };
}
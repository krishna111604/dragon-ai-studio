import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Check, X, Clock, UserPlus, FolderOpen, Edit, Eye } from "lucide-react";

interface PendingRequest {
  id: string;
  project_id: string;
  requester_id: string;
  status: string;
  created_at: string;
  project_name?: string;
  requester_email?: string;
}

interface CollaboratedProject {
  id: string;
  project_id: string;
  role: string;
  project_name?: string;
  project_code?: string;
}

export default function CollaborationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectCode, setProjectCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<PendingRequest[]>([]);
  const [collaboratedProjects, setCollaboratedProjects] = useState<CollaboratedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchCollaborationData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('collaboration-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collaboration_requests' },
        () => {
          fetchCollaborationData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_collaborators' },
        () => {
          fetchCollaborationData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchCollaborationData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch pending requests I've made
      const { data: myRequests } = await supabase
        .from('collaboration_requests')
        .select('*')
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      // Fetch incoming requests for my projects
      const { data: incoming } = await supabase
        .from('collaboration_requests')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'pending');

      // Fetch projects I'm collaborating on
      const { data: collabs } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('user_id', user.id);

      // Enrich with project names
      if (myRequests) {
        const enrichedRequests = await Promise.all(
          myRequests.map(async (req) => {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', req.project_id)
              .maybeSingle();
            return { ...req, project_name: project?.name || 'Unknown Project' };
          })
        );
        setPendingRequests(enrichedRequests);
      }

      if (incoming) {
        const enrichedIncoming = await Promise.all(
          incoming.map(async (req) => {
            const { data: project } = await supabase
              .from('projects')
              .select('name')
              .eq('id', req.project_id)
              .maybeSingle();
            // Get requester email from profiles
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', req.requester_id)
              .maybeSingle();
            return { 
              ...req, 
              project_name: project?.name || 'Unknown Project',
              requester_email: profile?.display_name || 'Unknown User'
            };
          })
        );
        setIncomingRequests(enrichedIncoming);
      }

      if (collabs) {
        const enrichedCollabs = await Promise.all(
          collabs.map(async (collab) => {
            const { data: project } = await supabase
              .from('projects')
              .select('name, project_code')
              .eq('id', collab.project_id)
              .maybeSingle();
            const projectData = project as { name?: string; project_code?: string } | null;
            return { 
              ...collab, 
              project_name: projectData?.name || 'Unknown Project',
              project_code: projectData?.project_code
            };
          })
        );
        setCollaboratedProjects(enrichedCollabs);
      }
    } catch (error) {
      console.error('Error fetching collaboration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinProject = async () => {
    if (!projectCode.trim() || !user) return;
    setIsJoining(true);

    try {
      // Find project by code
      const { data: projectResult, error: projectError } = await (supabase
        .from('projects')
        .select('id, user_id, name') as any)
        .eq('project_code', projectCode.trim())
        .maybeSingle();

      const project = projectResult as { id: string; user_id: string; name: string } | null;

      if (projectError || !project) {
        toast({
          title: "Project not found",
          description: "No project exists with that code. Please check and try again.",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      if (project.user_id === user.id) {
        toast({
          title: "That's your project!",
          description: "You can't join your own project as a collaborator.",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      // Check if already a collaborator
      const { data: existingCollab } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingCollab) {
        toast({
          title: "Already a collaborator",
          description: "You're already collaborating on this project.",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('collaboration_requests')
        .select('id, status')
        .eq('project_id', project.id)
        .eq('requester_id', user.id)
        .maybeSingle();

      if (existingRequest) {
        toast({
          title: existingRequest.status === 'pending' ? "Request pending" : "Request already sent",
          description: existingRequest.status === 'pending' 
            ? "You already have a pending request for this project." 
            : "Your previous request was declined.",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      // Create join request
      const { error: requestError } = await supabase
        .from('collaboration_requests')
        .insert({
          project_id: project.id,
          requester_id: user.id,
          owner_id: project.user_id,
          status: 'pending'
        });

      if (requestError) throw requestError;

      toast({
        title: "Request sent!",
        description: `Your request to join "${project.name}" has been sent to the owner.`,
      });
      setProjectCode("");
      fetchCollaborationData();
    } catch (error) {
      console.error('Error joining project:', error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRequestResponse = async (requestId: string, accept: boolean) => {
    try {
      const request = incomingRequests.find(r => r.id === requestId);
      if (!request) return;

      if (accept) {
        // Add user as collaborator with selected role (default to editor)
        const role = selectedRoles[requestId] || 'editor';
        await supabase
          .from('project_collaborators')
          .insert({
            project_id: request.project_id,
            user_id: request.requester_id,
            role: role
          });
      }

      // Update request status
      await supabase
        .from('collaboration_requests')
        .update({ status: accept ? 'accepted' : 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      toast({
        title: accept ? "Request accepted" : "Request declined",
        description: accept 
          ? `The user has been added as ${selectedRoles[requestId] === 'viewer' ? 'a viewer' : 'an editor'}.`
          : "The request has been declined.",
      });

      fetchCollaborationData();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display text-gradient-gold">Collaboration</h1>
              <p className="text-muted-foreground">Join teams and collaborate on projects</p>
            </div>
          </div>

          {/* Join Project Section */}
          <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Join a Project
              </CardTitle>
              <CardDescription>
                Enter a 5-digit project code to request access to a team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter project code (e.g., 12345)"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  maxLength={5}
                  className="max-w-xs font-mono text-lg tracking-widest"
                />
                <Button 
                  onClick={handleJoinProject}
                  disabled={projectCode.length !== 5 || isJoining}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isJoining ? "Sending..." : "Request to Join"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Incoming Requests Section */}
          {incomingRequests.length > 0 && (
            <Card className="mb-8 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Pending Requests
                  <Badge variant="secondary">{incomingRequests.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Users requesting to join your projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div>
                      <p className="font-medium">{request.requester_email}</p>
                      <p className="text-sm text-muted-foreground">
                        Wants to join: <span className="text-foreground">{request.project_name}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedRoles[request.id] || 'editor'}
                        onValueChange={(value) => setSelectedRoles(prev => ({ ...prev, [request.id]: value }))}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <Edit className="w-3 h-3" /> Editor
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="w-3 h-3" /> Viewer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestResponse(request.id, false)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequestResponse(request.id, true)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* My Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Your Pending Requests
                </CardTitle>
                <CardDescription>
                  Waiting for project owners to respond
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div>
                      <p className="font-medium">{request.project_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Collaborated Projects */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                Projects You're Collaborating On
              </CardTitle>
              <CardDescription>
                Projects where you're a team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : collaboratedProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>You're not collaborating on any projects yet.</p>
                  <p className="text-sm">Enter a project code above to request access.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {collaboratedProjects.map((collab) => (
                    <div 
                      key={collab.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/project/${collab.project_id}`)}
                    >
                      <div>
                        <p className="font-medium">{collab.project_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: <span className="font-mono">{collab.project_code}</span>
                        </p>
                      </div>
                      <Badge variant={collab.role === 'editor' ? 'default' : 'secondary'}>
                        {collab.role === 'editor' ? <Edit className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                        {collab.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

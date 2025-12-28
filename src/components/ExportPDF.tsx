import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface ExportPDFProps {
  projectId: string;
  projectName: string;
}

export function ExportPDF({ projectId, projectName }: ExportPDFProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async () => {
    setExporting(true);
    
    try {
      // Fetch project data
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      // Fetch scene media
      const { data: media } = await supabase
        .from("scene_media")
        .select("*")
        .eq("project_id", projectId)
        .eq("media_type", "image")
        .order("created_at", { ascending: true });

      // Fetch insights
      const { data: insights } = await supabase
        .from("project_insights")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_saved", true)
        .order("created_at", { ascending: true });

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Title
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(projectName, margin, yPos);
      yPos += 15;

      // Project info
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      if (project?.genre) {
        pdf.text(`Genre: ${project.genre}`, margin, yPos);
        yPos += 7;
      }
      if (project?.target_audience) {
        pdf.text(`Target Audience: ${project.target_audience}`, margin, yPos);
        yPos += 7;
      }
      yPos += 10;

      // Script content
      if (project?.script_content) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Script Content", margin, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const scriptLines = pdf.splitTextToSize(project.script_content, pageWidth - 2 * margin);
        scriptLines.slice(0, 20).forEach((line: string) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
        yPos += 10;
      }

      // Scene description
      if (project?.scene_description) {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Scene Description", margin, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const sceneLines = pdf.splitTextToSize(project.scene_description, pageWidth - 2 * margin);
        sceneLines.slice(0, 10).forEach((line: string) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
        yPos += 10;
      }

      // Storyboard Images
      if (media && media.length > 0) {
        pdf.addPage();
        yPos = 20;
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text("Storyboard", margin, yPos);
        yPos += 15;

        for (let i = 0; i < Math.min(media.length, 6); i++) {
          const item = media[i];
          
          if (yPos > 200) {
            pdf.addPage();
            yPos = 20;
          }

          try {
            // Add image title
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${i + 1}. ${item.title}`, margin, yPos);
            yPos += 6;
            
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            const promptLines = pdf.splitTextToSize(item.prompt, pageWidth - 2 * margin);
            promptLines.slice(0, 2).forEach((line: string) => {
              pdf.text(line, margin, yPos);
              yPos += 4;
            });
            yPos += 5;
            
            // Try to add image
            if (item.media_url && !item.media_url.startsWith("composition:")) {
              const img = new Image();
              img.crossOrigin = "anonymous";
              
              await new Promise<void>((resolve) => {
                img.onload = () => {
                  try {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 170;
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      const imgData = canvas.toDataURL('image/jpeg', 0.7);
                      
                      const imgHeight = Math.min(canvas.height * 0.5, 80);
                      if (yPos + imgHeight > 270) {
                        pdf.addPage();
                        yPos = 20;
                      }
                      pdf.addImage(imgData, 'JPEG', margin, yPos, maxWidth * 0.5, imgHeight);
                      yPos += imgHeight + 10;
                    }
                  } catch (e) {
                    console.log('Image conversion error:', e);
                  }
                  resolve();
                };
                img.onerror = () => resolve();
                img.src = item.media_url;
              });
            }
          } catch (e) {
            console.log('Error processing image:', e);
          }
          
          yPos += 5;
        }
      }

      // Insights
      if (insights && insights.length > 0) {
        pdf.addPage();
        yPos = 20;
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text("Saved Insights", margin, yPos);
        yPos += 15;

        for (const insight of insights.slice(0, 5)) {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(insight.title, margin, yPos);
          yPos += 7;

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          
          const content = typeof insight.content === 'object' 
            ? JSON.stringify(insight.content, null, 2).substring(0, 500)
            : String(insight.content).substring(0, 500);
          
          const contentLines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
          contentLines.slice(0, 8).forEach((line: string) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(line, margin, yPos);
            yPos += 4;
          });
          yPos += 10;
        }
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128);
        pdf.text(
          `Generated by Dragon's Den | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          285,
          { align: 'center' }
        );
      }

      // Save
      pdf.save(`${projectName.replace(/\s+/g, '_')}_storyboard.pdf`);
      
      toast({ title: "Exported", description: "PDF downloaded successfully" });
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast({ title: "Export Error", description: error.message, variant: "destructive" });
    }
    
    setExporting(false);
  };

  return (
    <Button onClick={exportToPDF} disabled={exporting} variant="outline" size="sm">
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      Export PDF
    </Button>
  );
}
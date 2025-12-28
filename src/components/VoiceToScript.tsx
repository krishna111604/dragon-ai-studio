import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceToScriptProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  disabled?: boolean;
}

// Extend Window interface for webkit prefixed API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function VoiceToScript({ onTranscript, onInterimTranscript, disabled }: VoiceToScriptProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim (live) transcription
      setInterimText(interimTranscript);
      onInterimTranscript?.(interimTranscript);

      if (finalTranscript) {
        setInterimText("");
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice input",
          variant: "destructive"
        });
      } else if (event.error !== 'aborted') {
        toast({
          title: "Voice Error",
          description: `Recognition error: ${event.error}`,
          variant: "destructive"
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart if still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast({ title: "Voice Off", description: "Stopped listening" });
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast({ title: "Voice On", description: "Speak now..." });
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start voice recognition",
          variant: "destructive"
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <Button variant="ghost" size="sm" disabled title="Voice input not supported in this browser">
        <MicOff className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isListening && interimText && (
        <span className="text-xs text-muted-foreground italic max-w-[200px] truncate">
          {interimText}...
        </span>
      )}
      <Button
        onClick={toggleListening}
        disabled={disabled}
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        className={isListening ? "animate-pulse" : ""}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
            <Mic className="w-4 h-4" />
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
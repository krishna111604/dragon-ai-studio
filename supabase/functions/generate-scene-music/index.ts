import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  prompt: string;
  mood?: string;
  genre?: string;
  duration?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      // Return a helpful message about needing to configure the API key
      return new Response(
        JSON.stringify({ 
          error: 'Music generation requires an ElevenLabs API key. Please add ELEVENLABS_API_KEY to your project secrets.',
          needsApiKey: true,
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, mood, genre, duration = 30 }: RequestBody = await req.json();
    
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Please provide a scene description for music generation');
    }

    console.log(`Generating music for scene: ${prompt.substring(0, 50)}...`);

    // Build an enhanced music prompt
    let musicPrompt = `Cinematic film score for: ${prompt}`;
    if (mood) {
      musicPrompt += `. Mood: ${mood}`;
    }
    if (genre) {
      musicPrompt += `. Film genre: ${genre}`;
    }
    musicPrompt += `. Professional orchestral film score quality, emotional and evocative.`;

    const response = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: musicPrompt,
        duration_seconds: Math.min(Math.max(duration, 5), 60), // Between 5 and 60 seconds
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs error: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid ElevenLabs API key. Please check your configuration.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Music generation failed: ${response.status}`);
    }

    // Get the audio as array buffer and convert to base64
    const audioBuffer = await response.arrayBuffer();
    
    // Use Deno's encoding library for base64
    const { encode: base64Encode } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
    const base64Audio = base64Encode(audioBuffer);

    console.log(`Successfully generated scene music`);

    return new Response(
      JSON.stringify({
        success: true,
        audioContent: base64Audio,
        prompt: musicPrompt,
        duration,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scene music generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

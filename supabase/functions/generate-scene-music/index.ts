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
  useAlternative?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mood, genre, duration = 30, useAlternative = false }: RequestBody = await req.json();
    
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

    // Try ElevenLabs first if not using alternative
    if (!useAlternative) {
      const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
      
      if (ELEVENLABS_API_KEY) {
        const response = await fetch('https://api.elevenlabs.io/v1/music', {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: musicPrompt,
            duration_seconds: Math.min(Math.max(duration, 5), 60),
          }),
        });

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          const { encode: base64Encode } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
          const base64Audio = base64Encode(audioBuffer);

          console.log(`Successfully generated scene music with ElevenLabs`);

          return new Response(
            JSON.stringify({
              success: true,
              audioContent: base64Audio,
              prompt: musicPrompt,
              duration,
              source: 'elevenlabs',
              timestamp: new Date().toISOString(),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // If ElevenLabs fails with 402, fall through to alternative
        if (response.status !== 402) {
          const errorText = await response.text();
          console.error(`ElevenLabs error: ${response.status} - ${errorText}`);
          
          if (response.status === 401) {
            throw new Error('Invalid ElevenLabs API key');
          }
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
        }
        
        console.log('ElevenLabs requires paid plan, using alternative...');
      }
    }

    // Alternative: Use Lovable AI to generate a detailed music description/composition
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Music generation unavailable. Please configure API keys.',
          needsApiKey: true,
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a detailed music composition description using AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional film composer and music director. Create a detailed music composition guide for a scene. Include:
- Tempo (BPM) and time signature
- Key and mode
- Primary instruments and their roles
- Melodic themes and motifs
- Harmonic progression
- Dynamic changes throughout
- Emotional arc
- Reference tracks from famous films

Format as a professional music brief that a composer could use to create the actual score.`
          },
          {
            role: 'user',
            content: `Create a detailed music composition guide for this scene:\n\n${musicPrompt}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI composition error:', errorText);
      throw new Error('Failed to generate music composition');
    }

    const aiData = await aiResponse.json();
    const compositionGuide = aiData.choices?.[0]?.message?.content || '';

    console.log('Successfully generated music composition guide');

    return new Response(
      JSON.stringify({
        success: true,
        compositionGuide,
        prompt: musicPrompt,
        duration,
        source: 'ai_composition',
        isGuide: true,
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

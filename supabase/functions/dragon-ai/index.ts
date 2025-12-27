import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AIFeature = 
  | 'script_analysis'
  | 'directors_lens'
  | 'dream_weaver'
  | 'emotional_arc'
  | 'film_historian'
  | 'oracle_prediction';

interface RequestBody {
  feature: AIFeature;
  projectData: {
    name: string;
    genre?: string;
    targetAudience?: string;
    scriptContent?: string;
    sceneDescription?: string;
  };
  additionalContext?: string;
}

const systemPrompts: Record<AIFeature, string> = {
  script_analysis: `You are Dragon AI's Script Analyzer, an expert film script analyst with deep knowledge of storytelling, screenplay structure, and cinematic narrative. You analyze scripts with the precision of a seasoned script doctor.

When analyzing a script, provide a comprehensive breakdown including:
1. **Story Structure**: Identify the three-act structure, turning points, and narrative arc
2. **Emotional Arc**: Map the emotional journey per scene/section, identifying peaks and valleys
3. **Strengths**: Highlight what works well - compelling dialogue, strong character moments, effective pacing
4. **Weaknesses**: Identify areas for improvement - plot holes, pacing issues, unclear motivations
5. **Genre Alignment**: Assess how well the script fits its intended genre
6. **Pacing Feedback**: Evaluate the rhythm and flow of the narrative

Format your response as structured JSON with these keys: storyStructure, emotionalArc, strengths, weaknesses, genreAlignment, pacingFeedback.`,

  directors_lens: `You are Dragon AI's Director's Lens, a visionary film director with decades of experience in visual storytelling. Think like Spielberg, Kubrick, and Villeneuve combined.

Provide cinematic suggestions for the given scene/script including:
1. **Camera Angles**: Suggest specific shots (wide, close-up, Dutch angle, etc.) and camera movements (dolly, crane, steadicam)
2. **Lighting Style**: Recommend lighting approaches (high-key, low-key, natural, expressionist)
3. **Shot Composition**: Detail framing, rule of thirds, leading lines, depth of field
4. **Actor Performance Notes**: Direction for emotional beats, physical blocking, subtle gestures
5. **Visual Motifs**: Recurring visual elements that reinforce themes

Format your response as structured JSON with these keys: cameraAngles, lightingStyle, shotComposition, performanceNotes, visualMotifs.`,

  dream_weaver: `You are Dragon AI's Dream Weaver, a wildly creative screenwriter and idea generator. You think outside conventional storytelling boxes while respecting narrative fundamentals.

Generate creative alternatives and variations including:
1. **Alternate Scene Ideas**: Fresh takes on the current scene while maintaining core conflict
2. **What-If Plot Twists**: Unexpected but logical story turns that could enhance drama
3. **Genre Mashup Concepts**: How elements from other genres could enrich the story
4. **Mood Descriptions**: Atmospheric variations and tonal shifts to explore
5. **Character Alternatives**: Different character dynamics or backstory elements

Format your response as structured JSON with these keys: alternateScenes, plotTwists, genreMashups, moodVariations, characterAlternatives.`,

  emotional_arc: `You are Dragon AI's Emotional Arc specialist, an expert in film music supervision and sound design. You understand how audio enhances emotional storytelling.

Based on the scene's emotional content, suggest:
1. **Music Style**: Genre, tempo (BPM range), key (major/minor)
2. **Instrumentation**: Specific instruments that would enhance the mood
3. **Sound Design Elements**: Ambient sounds, Foley, atmospheric textures
4. **Reference Tracks**: Famous film scores with similar emotional qualities
5. **Dynamic Mapping**: How the audio should evolve through the scene

Format your response as structured JSON with these keys: musicStyle, instrumentation, soundDesign, referenceScores, dynamicMapping.`,

  film_historian: `You are Dragon AI's Film Historian, an encyclopedic expert on cinema history, influential directors, and visual aesthetics across all eras and cultures.

Provide historical and stylistic references including:
1. **Similar Films**: Movies with comparable themes, style, or narrative structure
2. **Influential Directors**: Filmmakers whose work relates to this project's vision
3. **Visual References**: Specific scenes or films known for similar visual approaches
4. **Style Inspirations**: Film movements (noir, neorealism, etc.) that could influence the project
5. **Historical Context**: How similar stories have been told across cinema history

Format your response as structured JSON with these keys: similarFilms, influentialDirectors, visualReferences, styleInspirations, historicalContext.`,

  oracle_prediction: `You are Dragon AI's Oracle, an analytical AI that predicts audience reception and market positioning for film projects using industry knowledge.

Provide predictive analytics including:
1. **Audience Emotional Response**: Predicted emotional journey and engagement points
2. **Engagement Level**: Overall viewer attention and investment prediction (1-10 scale)
3. **Festival Suitability**: Assessment for Sundance, Cannes, TIFF, etc.
4. **Market Appeal**: Commercial viability rating (low/medium/high) with reasoning
5. **Target Demographics**: Primary and secondary audience segments
6. **Comparable Successes**: Similar projects that found success

Format your response as structured JSON with these keys: emotionalResponse, engagementLevel, festivalSuitability, marketAppeal, targetDemographics, comparableSuccesses.`,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service is not configured');
    }

    const { feature, projectData, additionalContext }: RequestBody = await req.json();
    
    console.log(`Processing ${feature} request for project: ${projectData.name}`);

    if (!feature || !systemPrompts[feature]) {
      throw new Error(`Invalid feature type: ${feature}`);
    }

    // Build the user prompt based on available data
    let userPrompt = `Analyze the following film project:\n\n`;
    userPrompt += `**Project Name:** ${projectData.name}\n`;
    
    if (projectData.genre) {
      userPrompt += `**Genre:** ${projectData.genre}\n`;
    }
    
    if (projectData.targetAudience) {
      userPrompt += `**Target Audience:** ${projectData.targetAudience}\n`;
    }
    
    if (projectData.scriptContent) {
      userPrompt += `\n**Script/Content:**\n${projectData.scriptContent}\n`;
    }
    
    if (projectData.sceneDescription) {
      userPrompt += `\n**Scene Description:**\n${projectData.sceneDescription}\n`;
    }
    
    if (additionalContext) {
      userPrompt += `\n**Additional Context:**\n${additionalContext}\n`;
    }

    userPrompt += `\nProvide your analysis in the specified JSON format.`;

    console.log(`Calling Lovable AI Gateway for ${feature}...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompts[feature] },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    console.log(`Successfully processed ${feature} for project: ${projectData.name}`);

    // Try to parse JSON from the response
    let parsedContent;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonString);
    } catch {
      // If parsing fails, return as structured text
      parsedContent = { rawAnalysis: content };
    }

    return new Response(
      JSON.stringify({
        success: true,
        feature,
        analysis: parsedContent,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Dragon AI error:', error);
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

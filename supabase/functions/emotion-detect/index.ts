import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMOTIONS = ["happy", "sad", "angry", "neutral", "surprised"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided. Send a base64 image in the 'image' field." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a facial emotion detection AI. Analyze the provided image and detect the dominant emotion on the face(s) visible.

You MUST respond using the suggest_emotions tool. Evaluate ALL 5 emotions and provide confidence scores that sum to 100.

The 5 emotions to evaluate: happy, sad, angry, neutral, surprised.

If no face is detected, return all emotions with 0 confidence and set dominant_emotion to "neutral" with a note.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
              {
                type: "text",
                text: "Analyze this image. Detect the facial expression and determine the emotion. Provide confidence scores for all 5 emotions (happy, sad, angry, neutral, surprised) that sum to 100.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_emotions",
              description: "Return detected emotions with confidence scores",
              parameters: {
                type: "object",
                properties: {
                  dominant_emotion: {
                    type: "string",
                    enum: EMOTIONS,
                    description: "The most prominent emotion detected",
                  },
                  emotions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        emotion: {
                          type: "string",
                          enum: EMOTIONS,
                        },
                        confidence: {
                          type: "number",
                          description: "Confidence score from 0 to 100",
                        },
                      },
                      required: ["emotion", "confidence"],
                      additionalProperties: false,
                    },
                    description: "All 5 emotions with confidence scores summing to 100",
                  },
                  face_detected: {
                    type: "boolean",
                    description: "Whether a face was detected in the image",
                  },
                },
                required: ["dominant_emotion", "emotions", "face_detected"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_emotions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No emotion data returned from AI model");
    }

    const emotionData = JSON.parse(toolCall.function.arguments);

    // Sort emotions by confidence descending
    const sortedEmotions = emotionData.emotions.sort(
      (a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence
    );

    return new Response(
      JSON.stringify({
        emotion: emotionData.dominant_emotion,
        confidence: sortedEmotions[0]?.confidence / 100 || 0,
        face_detected: emotionData.face_detected,
        all_emotions: sortedEmotions.map((e: { emotion: string; confidence: number }) => ({
          emotion: e.emotion,
          confidence: e.confidence / 100,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("emotion-detect error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

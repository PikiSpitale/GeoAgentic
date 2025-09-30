import { google } from "@ai-sdk/google";
import { CoreMessage, streamText } from "ai";
import {
  MAX_DURATION,
  SYSTEM_MESSAGE,
} from "@/features/ai-assistant/lib/constants";
import { geospatialTools } from "@/features/ai-assistant/lib/llm-tools/basic-geospatial-tools";
import { geocodingTools } from "@/features/ai-assistant/lib/llm-tools/geocoding-tools";
import { rasterAnalysisTools } from "@/features/ai-assistant/lib/llm-tools/raster-analysis-tools";
import type { Feature, Geometry } from "geojson";
import { ensureEE } from "@/lib/ee";

export const maxDuration = MAX_DURATION;

export async function POST(req: Request) {
  console.log("[chat] handler hit");
  await ensureEE();
  const { messages, drawnFeature: drawnFeatureString } = await req.json();

  let updatedMessages: CoreMessage[] = messages;
  let drawnFeature: Feature<Geometry> | null = null;
  if (drawnFeatureString) {
    try {
      drawnFeature = JSON.parse(
        drawnFeatureString as string
      ) as Feature<Geometry>;
      if (drawnFeature && drawnFeature.geometry) {
        const featureContextMessage: CoreMessage = {
          role: "user",
          content: `The user has drawn or selected the following GeoJSON feature on the map: ${JSON.stringify(
            drawnFeature
          )}. Consider this feature if the query is related to it.`,
        };

        updatedMessages = [
          ...messages.slice(0, -1),
          featureContextMessage,
          messages[messages.length - 1],
        ];
      }
    } catch (error) {
      console.error("Error parsing drawnFeature:", error);
    }
  }
  const model = google("gemini-2.0-flash");
  const result = await streamText({
    model,
    system: SYSTEM_MESSAGE,
    maxSteps: 10,
    onError: (error) => {
      console.error("AI SDK streamText error:", error);
    },
    messages: updatedMessages,
    tools: {
      ...geospatialTools,
      ...geocodingTools,
      ...rasterAnalysisTools,
    },
  });
  console.log("[chat] POST hit");

  return result.toDataStreamResponse();
}

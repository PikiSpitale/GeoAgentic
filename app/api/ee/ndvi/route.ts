/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "server-only";
import type { Feature, Geometry } from "geojson";
import { ensureEE, ee } from "@/lib/ee";

export async function POST(req: Request) {
  try {
    await ensureEE();

    const {
      feature,
      dateFrom = "2024-01-01",
      dateTo = "2024-12-31",
    } = (await req.json()) as {
      feature: Feature<Geometry>;
      dateFrom?: string;
      dateTo?: string;
    };

    if (!feature?.geometry) {
      return new Response(
        JSON.stringify({ ok: false, error: "Falta feature GeoJSON" }),
        { status: 400 }
      );
    }

    const geom = ee.Geometry(feature.geometry as any);

    // Sentinel-1 GRD (Radar, no óptico)
    const sar = ee
      .ImageCollection("COPERNICUS/S1_GRD")
      .filterBounds(geom)
      .filterDate(dateFrom, dateTo)
      .filter(ee.Filter.eq("instrumentMode", "IW"))
      .filter(ee.Filter.eq("resolution_meters", 10))
      .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
      .filter(ee.Filter.eq("orbitProperties_pass", "DESCENDING"))
      .select(["VV", "VH"]); // 👈 o "VH"

    const median = sar.median().clip(geom);

    // Calcular RVI (Radar Vegetation Index)
    const rvi = median
      .expression("4 * VH / (VV + VH)", {
        VV: median.select("VV"),
        VH: median.select("VH"),
      })
      .rename("RVI")
      .clip(geom);

    // Estadísticas
    const stats: Record<string, number> = await new Promise(
      (resolve, reject) => {
        rvi
          .reduceRegion({
            reducer: ee.Reducer.mean().combine({
              reducer2: ee.Reducer.minMax(),
              sharedInputs: true,
            }),
            geometry: geom,
            scale: 10,
            maxPixels: 1e9,
          })
          .evaluate((res: any, err: any) => (err ? reject(err) : resolve(res)));
      }
    );

    // Visualización SAR (escala de 0 a 1 aprox)
    const vis = {
      min: 0,
      max: 1,
      palette: [
        "#08306b",
        "#2171b5",
        "#6baed6",
        "#bae4b3",
        "#fd8d3c",
        "#e31a1c",
        "#800026",
      ],
    };

    const mapInfo = await new Promise<any>((resolve, reject) => {
      ee.data.getMapId(
        { image: rvi, vis_params: vis },
        (result: any, err: any) => (err ? reject(err) : resolve(result))
      );
    });

    const tileUrl = mapInfo.urlFormat;

    return new Response(
      JSON.stringify({ ok: true, stats, tileUrl, map: mapInfo }),
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[sar] error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500 }
    );
  }
}

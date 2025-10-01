/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/ee/ndvi/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "server-only";
import type { Feature, Geometry } from "geojson";
import { ensureEE, ee } from "@/lib/ee";

function maskS2sr(img: any): any {
  // Probabilidad de nubes < 40%
  const cldOk = img.select("MSK_CLDPRB").lt(40);

  // Filtrado por clases SCL (quita sombra, nubes, cirrus, nieve/hielo)
  const scl = img.select("SCL");
  const sclOk = scl
    .neq(3) // cloud shadow
    .and(scl.neq(8)) // cloud medium prob
    .and(scl.neq(9)) // cloud high prob
    .and(scl.neq(10)) // thin cirrus
    .and(scl.neq(11)); // snow/ice

  return img.updateMask(cldOk.and(sclOk));
}

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

    const s2 = ee
      .ImageCollection("COPERNICUS/S2_SR_HARMONIZED") // 👈 colección correcta
      .filterBounds(geom)
      .filterDate(dateFrom, dateTo)
      .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
      .map(maskS2sr);

    const ndvi = s2.median().normalizedDifference(["B8", "B4"]).rename("NDVI");

    const stats: Record<string, number> = await new Promise(
      (resolve, reject) => {
        ndvi
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

    const vis = { min: -0.2, max: 0.9, palette: ["blue", "white", "green"] };
    const map = await new Promise<{ mapid: string; token: string }>(
      (resolve, reject) => {
        ndvi.getMap(vis, (m: any, err: any) =>
          err ? reject(err) : resolve(m)
        );
      }
    );

    const tileUrl = `https://earthengine.googleapis.com/map/${map.mapid}/{z}/{x}/{y}?token=${map.token}`;
    console.log("[ndvi] ready, tileUrl:", tileUrl);

    return new Response(JSON.stringify({ ok: true, stats, tileUrl, map }), {
      status: 200,
    });
  } catch (e: any) {
    console.error("[ndvi] error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500 }
    );
  }
}

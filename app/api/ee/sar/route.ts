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
      dateFrom = "2020-01-01",
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

    // Sentinel-1
    const s1 = ee
      .ImageCollection("COPERNICUS/S1_GRD")
      .filterBounds(geom)
      .filterDate(dateFrom, dateTo)
      .filter(ee.Filter.eq("instrumentMode", "IW"))
      .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
      .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VH"))
      .select(["VV", "VH"]);

    if ((await s1.size().getInfo()) === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "No hay imágenes SAR en AOI/fecha",
        }),
        { status: 404 }
      );
    }

    // Convertir dB a escala lineal
    const toNatural = (img: any) => ee.Image(10).pow(img.divide(10));
    const median = s1.median().clip(geom);
    const vv = toNatural(median.select("VV"));
    const vh = toNatural(median.select("VH"));

    // RVI
    const rvi = ee
      .Image(4)
      .multiply(vh)
      .divide(vv.add(vh))
      .rename("RVI")
      .clip(geom);

    // Calcular estadísticas reales para normalizar visualización
    const rviStats: any = await new Promise((resolve, reject) => {
      rvi
        .reduceRegion({
          reducer: ee.Reducer.minMax(),
          geometry: geom,
          scale: 30,
          maxPixels: 1e10,
        })
        .evaluate((res: any, err: any) => (err ? reject(err) : resolve(res)));
    });

    console.log("[RVI stats]", rviStats);

    // Definir visualización usando esos valores
    const vis = {
      min: rviStats.RVI_min ?? 0,
      max: rviStats.RVI_max ?? 1,
      palette: ["green", "yellow", "blue"],
    };

    console.log("[vis params]", vis);

    // Obtener tile URL con paleta aplicada
    const mapInfo = await new Promise<any>((resolve, reject) => {
      ee.data.getMapId(
        { image: rvi.visualize(vis), vis_params: vis },
        (result: any, err: any) => (err ? reject(err) : resolve(result))
      );
    });
    console.log("[MapInfo recibido]", mapInfo);

    return new Response(
      JSON.stringify({
        ok: true,
        stats: rviStats,
        tileUrl: mapInfo.urlFormat,
        map: mapInfo,
      }),
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

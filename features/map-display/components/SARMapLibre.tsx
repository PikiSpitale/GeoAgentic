"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function SARMapLibre() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);

  // Pedir tiles al backend SAR
  useEffect(() => {
    async function fetchTiles() {
      const res = await fetch("/api/ee/sar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-60.3516, -33.2543],
                  [-60.3516, -33.2983],
                  [-60.2924, -33.2983],
                  [-60.2924, -33.2543],
                  [-60.3516, -33.2543],
                ],
              ],
            },
          },
        }),
      });

      const data = await res.json();
      if (data.ok && data.tileUrl) {
        console.log("[tileUrl recibido]", data.tileUrl);
        setTileUrl(data.tileUrl);
      } else {
        console.error("Error al cargar tiles SAR:", data);
      }
    }

    fetchTiles();
  }, []);

  // Crear mapa y agregar tiles SAR
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", // 🌍 basemap
      center: [-60.32, -33.27],
      zoom: 12,
    });

    map.on("load", () => {
      if (!tileUrl) return;

      // Fuente SAR
      map.addSource("sar-tiles", {
        type: "raster",
        tiles: [tileUrl], // 👈 Earth Engine tileUrl con paleta
        tileSize: 256,
      });

      // Capa SAR encima del basemap
      map.addLayer({
        id: "sar-layer",
        type: "raster",
        source: "sar-tiles",
      });
    });
    map.on("sourcedata", (e) => {
      if (e.sourceId === "sar-tiles" && e.isSourceLoaded) {
        console.log("✅ SAR tiles cargados", e);
      }
    });

    map.on("error", (err) => {
      console.error("❌ MapLibre error:", err);
    });
    return () => map.remove();
  }, [tileUrl]);

  return <div ref={mapContainer} className="w-full h-full" />;
}

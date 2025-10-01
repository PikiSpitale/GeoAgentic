"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

export default function NDVIMapLibre() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);

  // pedir tiles al backend
  useEffect(() => {
    async function fetchTiles() {
      const res = await fetch("/api/ee/ndvi", {
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
      if (data.ok && data.map?.urlFormat) {
        setTileUrl(data.map.urlFormat);
      } else {
        console.error("No se pudo obtener el tileUrl", data);
      }
    }

    fetchTiles();
  }, []);

  // crear mapa una vez que tenemos urlFormat
  useEffect(() => {
    if (!mapContainer.current || !tileUrl) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "ndvi-tiles": {
            type: "raster",
            tiles: [tileUrl], // 👈 ahora sí
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "ndvi-layer",
            type: "raster",
            source: "ndvi-tiles",
          },
        ],
      },
      center: [-60.32, -33.27],
      zoom: 12,
    });

    return () => map.remove();
  }, [tileUrl]);

  return <div ref={mapContainer} className="w-full h-full" />;
}

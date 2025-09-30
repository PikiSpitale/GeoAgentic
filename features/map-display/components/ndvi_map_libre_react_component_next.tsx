"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export default function NDVIMapLibre() {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "ndvi-tiles": {
            type: "raster",
            tiles: [
              "https://earthengine.googleapis.com/map/projects/earthengine-legacy/maps/9501bac2683800aed7c08081fc6cc4de-e31f98a0382bad1f2c6be2c3bb3a6eed/{z}/{x}/{y}?token=",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "ndvi-layer",
            type: "raster",
            source: "ndvi-tiles",
            paint: {},
          },
        ],
      },
      center: [-60.32, -33.27], // tu polígono
      zoom: 12,
    });

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} className="w-full h-full" />;
}

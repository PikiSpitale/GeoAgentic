"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapDraw } from "@/features/map-display/hooks/use-map-draw";
import { useDrawStore } from "@/features/map-draw/store/draw-store";

export default function NdviDrawPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // store con el polígono dibujado
  const drawnFeature = useDrawStore((state) => state.drawnFeature);

  // hook que maneja el draw
  useMapDraw({
    mapRef,
    isMapLoaded,
    onAnalysisClearNeeded: () => {
      if (mapRef.current?.getLayer("sar-layer")) {
        mapRef.current.removeLayer("sar-layer");
        mapRef.current.removeSource("sar-tiles");
      }
    },
  });

  // inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", // 🌍 estilo base más lindo
      center: [-60.32, -33.27],
      zoom: 10,
    });

    mapRef.current = map;
    map.on("load", () => setIsMapLoaded(true));

    return () => map.remove();
  }, []);

  // cuando hay un polígono dibujado => pedir tiles SAR
  useEffect(() => {
    async function fetchSar() {
      if (!drawnFeature || !mapRef.current) return;

      const res = await fetch("/api/ee/sar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: drawnFeature }),
      });

      const data = await res.json();
      if (!data.ok || !data.tileUrl) {
        console.error("Error SAR:", data);
        return;
      }

      console.log("[tileUrl recibido]", data.tileUrl);

      const map = mapRef.current;
      if (!map) return;

      // guardar centro y zoom actuales 👇
      const center = map.getCenter();
      const zoom = map.getZoom();

      // limpiar si ya existe capa anterior
      if (map.getLayer("sar-layer")) {
        map.removeLayer("sar-layer");
        map.removeSource("sar-tiles");
      }

      // agregar nuevas tiles
      map.addSource("sar-tiles", {
        type: "raster",
        tiles: [data.tileUrl],
        tileSize: 256,
      });

      map.addLayer({
        id: "sar-layer",
        type: "raster",
        source: "sar-tiles",
      });

      // restaurar vista para que NO se mueva solo 👇
      map.setCenter(center);
      map.setZoom(zoom);

      console.log("SAR listo ✅", data.stats);
      console.log(data.tileUrl);
    }

    fetchSar();
  }, [drawnFeature]);

  return (
    <main className="flex flex-col h-screen">
      <header className="px-4 py-2 bg-gray-900 text-white">
        <h1 className="text-lg font-bold">SAR Draw Analysis</h1>
        <p>Dibuja un polígono y calculo RVI con Sentinel-1 🚀</p>
      </header>
      <div ref={mapContainer} className="flex-1" />
    </main>
  );
}

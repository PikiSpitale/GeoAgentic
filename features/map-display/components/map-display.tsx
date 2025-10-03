/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState, useEffect } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { MapMenuDock } from "@/features/map-menu-dock/components/map-menu-dock";
import { AnalysisResult } from "@/features/map-display/components/analysis-result";
import { useMapInitialization } from "../hooks/use-map-initialization";
import { useMapDraw } from "../hooks/use-map-draw";
import { useGeospatialAnalysis } from "../hooks/use-geospatial-analysis";
import { useDrawStore } from "@/features/map-draw/store/draw-store";
import { useRasterLayersStore } from "@/features/map-layers/store/raster-layers-store";
import type { LngLatBoundsLike } from "maplibre-gl";
import { Loader2 } from "lucide-react";

interface MapDisplayProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  width?: string;
}

const APP_PREFIX = "app-layer-"; // 👈 prefijo único para nuestras capas/sources

export function MapDisplay({
  initialCenter = [0, 0],
  initialZoom = 3,
  height = "100%",
  width = "100%",
}: MapDisplayProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { mapRef, isMapLoaded } = useMapInitialization({
    mapContainerRef,
    initialCenter,
    initialZoom,
  });

  const rasterLayers = useRasterLayersStore((state) => state.rasterLayers);
  const drawnFeature = useDrawStore((state) => state.drawnFeature);

  const { clearAnalysis } = useGeospatialAnalysis({
    mapRef,
    selectedFeature: null,
    isMapLoaded,
  });

  const { selectedGeometryType } = useMapDraw({
    mapRef,
    isMapLoaded,
    onAnalysisClearNeeded: clearAnalysis,
  });

  const {
    analysisResult: currentAnalysisResult,
    handleBufferClick: currentHandleBufferClick,
    handleDistanceClick: currentHandleDistanceClick,
    handleAreaClick: currentHandleAreaClick,
    handleCentroidClick: currentHandleCentroidClick,
    clearAnalysis: currentClearAnalysis,
  } = useGeospatialAnalysis({
    mapRef,
    selectedFeature: drawnFeature,
    isMapLoaded,
  });

  const handleGeocodingResult = (bounds: LngLatBoundsLike) => {
    if (mapRef.current) {
      mapRef.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 18,
      });
    }
  };

  useEffect(() => {
    if (isMapLoaded) {
      const timer = setTimeout(() => setIsInitializing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isMapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;

    // prefijo para todas las capas/sources que agregamos desde el store
    const idFromLayer = (lId: string) => `rl-${lId}`;

    // 1) remover del mapa todo lo que ya no exista en el store
    const validIds = new Set(rasterLayers.map((l) => idFromLayer(l.id)));
    map.getStyle().layers?.forEach((lyr) => {
      if (lyr.id.startsWith("rl-") && !validIds.has(lyr.id)) {
        // quitar layer y source pareados
        if (map.getLayer(lyr.id)) map.removeLayer(lyr.id);
        if (map.getSource(lyr.id)) map.removeSource(lyr.id);
      }
    });

    // 2) sincronizar cada capa del store
    rasterLayers.forEach((layer) => {
      const mapId = idFromLayer(layer.id);

      // ocultar = remover si existe
      if (!layer.visible) {
        if (map.getLayer(mapId)) map.removeLayer(mapId);
        if (map.getSource(mapId)) map.removeSource(mapId);
        return;
      }

      // si ya existe la source, no hacemos nada
      if (map.getSource(mapId)) return;

      // a) capa vector (GeoJSON)
      if (layer.feature) {
        map.addSource(mapId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [layer.feature as any],
          } as GeoJSON.FeatureCollection,
        });

        map.addLayer({
          id: mapId,
          type: "fill",
          source: mapId,
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.35,
          },
        });

        return;
      }

      // b) capa raster (tiles, p.ej. RVI)
      if (layer.tileUrl) {
        map.addSource(mapId, {
          type: "raster",
          tiles: [layer.tileUrl],
          tileSize: 256,
        });

        map.addLayer({
          id: mapId,
          type: "raster",
          source: mapId,
          paint: {
            "raster-opacity": 0.9,
          },
        });

        return;
      }
    });
  }, [rasterLayers, isMapLoaded]);

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900">
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "100%" }}
          className="rounded-lg shadow-md overflow-hidden relative"
        />
      </div>

      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-30 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Initializing Map
            </p>
          </div>
        </div>
      )}

      <AnalysisResult
        isVisible={currentAnalysisResult.isVisible}
        title={currentAnalysisResult.title}
        value={currentAnalysisResult.value}
        unit={currentAnalysisResult.unit}
        onClose={currentClearAnalysis}
      />

      <MapMenuDock
        selectedGeometryType={selectedGeometryType}
        onBufferClick={currentHandleBufferClick}
        onDistanceClick={currentHandleDistanceClick}
        onAreaClick={currentHandleAreaClick}
        onCentroidClick={currentHandleCentroidClick}
        onSearchResult={handleGeocodingResult}
      />
    </div>
  );
}

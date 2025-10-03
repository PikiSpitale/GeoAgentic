// Zustand store for managing imported raster layers
import { Feature } from "maplibre-gl";
import { create } from "zustand";

export interface RasterLayer {
  id: string;
  name: string;
  file?: File;
  feature?: Feature | GeoJSON.Feature;
  tileUrl?: string; // 👈 NUEVO: para tiles (RVI, etc)
  visible: boolean;
}

interface RasterLayersState {
  layerCounter: number;
  rasterLayers: RasterLayer[];
  addRasterLayer: (options: {
    file?: File;
    feature?: Feature | GeoJSON.Feature;
    name?: string;
  }) => void;
  addDrawnLayer: (feature: Feature, name?: string) => void;
  addRasterTileLayer: (tileUrl: string, name?: string) => void; // 👈 NUEVO
  removeRasterLayer: (id: string) => void;
  toggleVisibility: (id: string) => void;
  getRasterLayerById: (id: string) => RasterLayer | undefined;
}

export const useRasterLayersStore = create<RasterLayersState>((set, get) => ({
  rasterLayers: [],
  layerCounter: 1,

  addRasterLayer: (options) =>
    set((state) => ({
      rasterLayers: [
        ...state.rasterLayers,
        {
          id: crypto.randomUUID(),
          name: `Layer ${state.layerCounter}`,
          file: options.file,
          feature: options.feature,
          visible: true,
        },
      ],
      layerCounter: state.layerCounter + 1,
    })),

  addDrawnLayer: (feature) =>
    set((state) => ({
      rasterLayers: [
        ...state.rasterLayers,
        {
          id: crypto.randomUUID(),
          name: `Layer ${state.layerCounter}`,
          feature,
          visible: true,
        },
      ],
      layerCounter: state.layerCounter + 1,
    })),

  // 👉 para agregar el resultado del RVI (tiles de GEE)
  addRasterTileLayer: (tileUrl) =>
    set((state) => ({
      rasterLayers: [
        ...state.rasterLayers,
        {
          id: crypto.randomUUID(),
          name: `Layer ${state.layerCounter}`,
          tileUrl,
          visible: true,
        },
      ],
      layerCounter: state.layerCounter + 1,
    })),

  removeRasterLayer: (id) =>
    set((state) => ({
      rasterLayers: state.rasterLayers.filter((layer) => layer.id !== id),
    })),

  toggleVisibility: (id) =>
    set((state) => ({
      rasterLayers: state.rasterLayers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ),
    })),

  getRasterLayerById: (id) => get().rasterLayers.find((l) => l.id === id),
}));

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRasterLayersStore } from "@/features/map-layers/store/raster-layers-store";
import { Eye, EyeOff, Trash2, Layers } from "lucide-react";

export function LayerManagerDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const { rasterLayers, toggleVisibility, removeRasterLayer } =
    useRasterLayersStore();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-white dark:bg-slate-900 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" /> Layer Manager
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {rasterLayers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No layers added yet.
            </p>
          ) : (
            rasterLayers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
              >
                <span className="text-sm font-medium">{layer.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleVisibility(layer.id)}
                    title={layer.visible ? "Hide layer" : "Show layer"}
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4 text-blue-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRasterLayer(layer.id)}
                    title="Remove layer"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

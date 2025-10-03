/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Satellite } from "lucide-react";
import { toast } from "sonner";
import { useRasterLayersStore } from "@/features/map-layers/store/raster-layers-store";

interface RviAnalysisDialogProps {
  children: React.ReactNode;
}

export function RviAnalysisDialog({ children }: RviAnalysisDialogProps) {
  const { rasterLayers, addRasterTileLayer } = useRasterLayersStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const layer = rasterLayers.find((l) => l.id === selectedLayerId);
    if (!layer?.feature) {
      toast.error("Please select a valid polygon layer.");
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch("/api/ee/sar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: layer.feature }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "SAR RVI analysis failed.");
      }

      // ✅ Agregar capa raster con tileUrl
      addRasterTileLayer(data.tileUrl, `RVI - ${layer.name}`);

      toast.success("RVI layer added successfully.");
      setIsOpen(false);
    } catch (err: any) {
      toast.error("RVI analysis failed", {
        description: err.message || "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-white dark:bg-slate-900 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-green-600" /> RVI Analysis
          </DialogTitle>
          <DialogDescription>
            Select a polygon layer to run RVI and visualize as raster tiles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            value={selectedLayerId}
            onValueChange={setSelectedLayerId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a polygon layer..." />
            </SelectTrigger>
            <SelectContent>
              {rasterLayers
                .filter((l) => !!l.feature)
                .map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!selectedLayerId || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...
                </>
              ) : (
                "Run RVI"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

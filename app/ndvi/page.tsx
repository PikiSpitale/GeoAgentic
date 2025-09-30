import NDVIMapLibre from "@/features/map-display/components/ndvi_map_libre_react_component_next";

export default function NDVIPage() {
  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden">
      <header className="px-5 py-3 border-b">
        <h1 className="text-lg font-medium text-primary">NDVI Viewer</h1>
      </header>

      <div className="flex-1 relative">
        {/* el componente ocupa todo el alto del contenedor */}
        <NDVIMapLibre />
      </div>
    </main>
  );
}

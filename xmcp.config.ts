import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "nextjs",
  },
  paths: {
    tools: "C:\Users\pikis\OneDrive\Escritorio\Programacion\GeoLLM\src\tools",
    prompts: "C:\Users\pikis\OneDrive\Escritorio\Programacion\GeoLLM\src\prompts",
    resources: "C:\Users\pikis\OneDrive\Escritorio\Programacion\GeoLLM\src\resources",
  },
};

export default config;
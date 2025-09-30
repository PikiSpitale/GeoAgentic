import ee from "@google/earthengine";

export function authenticate(): Promise<void> {
  const key = JSON.parse(process.env.EE_KEY);
  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      key,
      () =>
        ee.initialize(
          null,
          null,
          () => resolve(),
          (error: string) => reject(new Error(error))
        ),
      (error: string) => reject(new Error(error))
    );
  });
}

export function runExample() {
  console.log("Running example EE code...");
  const image = new ee.Image("srtm90_v4");
  image.getMap({ min: 0, max: 1000 }, (map) => {
    console.log("map data...");
    console.log("EE map:", map);
  });
}

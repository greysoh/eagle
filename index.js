import * as eagle from "./src/mod.js";
import { download } from "https://deno.land/x/download@v1.0.1/mod.ts";

import os from "https://deno.land/x/dos@v0.11.0/mod.ts";

const platform = os.platform() == "darwin" ? "osx" : os.platform();
const mcVer = Deno.args[0] ? Deno.args[0] : "1.8.9";

const mcdl = new eagle.MinecraftDownloader(mcVer);

console.log("Fetching version data...");

await mcdl.getData();
const verManifestData = await mcdl.getManifest();

console.log("Downloading " + mcVer + " core...");
await download(verManifestData.core, {
  file: mcVer + ".jar",
  dir: "./",
});

console.log("Downloading libraries...");
for (const i in verManifestData.libraries) {
  const lib = await mcdl.getLibrary(i);

  if (!lib.downloadData) continue; 

  console.log("Downlading '%s'...", lib.downloadData.path);
  const pfData = eagle.seperatePathAndFile(lib.downloadData.path);

  await Deno.mkdir("./libraries/" + pfData.path, { recursive: true });
  await download(lib.downloadData.url, {
    file: pfData.filename,
    dir: "./libraries/" + pfData.path,
  });
}

console.log("Downloading assets...");

const assetIndex = await mcdl.getAssetIndex();
await Deno.writeTextFile("./" + mcVer + ".json", JSON.stringify(assetIndex.data));

for (const j of Object.keys(assetIndex.data.objects)) {
  console.log("Downloading '%s'...", j);
  const i = mcdl.getAsset(j);

  const pfData = eagle.seperatePathAndFile(j);

  await Deno.mkdir("./assets/" + pfData.path, { recursive: true });
  
  await download(i.url, {
    file: pfData.filename,
    dir: "./assets/" + pfData.path + "/"
  });
}
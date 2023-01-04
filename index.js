import * as eagle from "./src/mod.js";

import { download } from "https://deno.land/x/download@v1.0.1/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.3/mod.ts";

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

await Deno.mkdir("./natives_tmp/", { recursive: true });

for (const i in verManifestData.libraries) {
  const lib = mcdl.getLibrary(i);

  if (!lib.downloadData) continue; 

  console.log("Downlading '%s'...", lib.downloadData.path);
  const pfData = eagle.seperatePathAndFile(lib.downloadData.path);

  if (lib.isNative) {
    await Deno.mkdir("./natives_tmp/" + pfData.path, { recursive: true });
    await download(lib.downloadData.url, {
      file: pfData.filename.replace(".jar", ".zip"),
      dir: "./natives_tmp/" + pfData.path,
    });

    await decompress("./natives_tmp/" + pfData.path + "/" + pfData.filename.replace(".jar", ".zip"), "./natives/");

    console.log("NOTICE: Natives have been detected. You will have to extract these and put these in the natives folder.");
  } else {
    await Deno.mkdir("./libraries/" + pfData.path, { recursive: true });
    await download(lib.downloadData.url, {
      file: pfData.filename,
      dir: "./libraries/" + pfData.path,
    });
  }
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
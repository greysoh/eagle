import * as eagle from "./src/mod.js";

import { download } from "https://deno.land/x/download@v1.0.1/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.3/mod.ts";

import { exists } from "https://deno.land/std@0.170.0/fs/exists.ts";

const vers = await eagle.getAllVersions();

for (const mcVerData of vers.reverse()) {
  const baseDir = `${Deno.args[0] ? Deno.args[0] : "./eagle_dl_all"}/${mcVerData.type}/${mcVerData.id}/`;
  const logPrefix = `[${mcVerData.type}](${mcVerData.id}) `;

  console.log(logPrefix + "Fetching version data...");
  if (await exists(baseDir)) continue;

  const mcVer = mcVerData.id;

  await Deno.mkdir(baseDir, { recursive: true });
  
  const mcdl = new eagle.MinecraftDownloader(mcVer);

  await mcdl.getData();
  const verManifestData = await mcdl.getManifest();

  console.log(logPrefix + "Downloading " + mcVer + " core...");
  await download(verManifestData.core, {
    file: mcVer + ".jar",
    dir: baseDir,
  });

  console.log(logPrefix + "Downloading libraries...");
  await Deno.mkdir(baseDir + "natives_tmp/", { recursive: true });
  for (const i in verManifestData.libraries) {
    const lib = mcdl.getLibrary(i);
    if (!lib.downloadData) continue;

    console.log(logPrefix + "Downlading '%s'...", lib.downloadData.path);
    const pfData = eagle.seperatePathAndFile(lib.downloadData.path);

    if (lib.isNative) {
      await Deno.mkdir(baseDir + "natives_tmp/" + pfData.path, { recursive: true });
      await download(lib.downloadData.url, {
        file: pfData.filename.replace(".jar", ".zip"),
        dir: baseDir + "natives_tmp/" + pfData.path,
      });
  
      await decompress(baseDir + "natives_tmp/" + pfData.path + "/" + pfData.filename.replace(".jar", ".zip"), baseDir + "natives");
  
      console.log("NOTICE: Natives have been detected. Extraction successful.");
    } else {
      await Deno.mkdir(baseDir + "libraries/" + pfData.path, { recursive: true });
      await download(lib.downloadData.url, {
        file: pfData.filename,
        dir: baseDir + "libraries/" + pfData.path,
      });
    }
  }

  console.log("Downloading assets...");

  const assetIndex = await mcdl.getAssetIndex();
  await Deno.writeTextFile(
    baseDir + mcVer + ".json",
    JSON.stringify(assetIndex.data)
  );

  for (const j of Object.keys(assetIndex.data.objects)) {
    console.log(logPrefix + "Downloading '%s'...", j);
    const i = mcdl.getAsset(j);

    const pfData = eagle.seperatePathAndFile(j);

    await Deno.mkdir(baseDir + "assets/" + pfData.path, { recursive: true });

    await download(i.url, {
      file: pfData.filename,
      dir: baseDir + "assets/" + pfData.path + "/",
    });
  }
}

import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import os from "https://deno.land/x/dos@v0.11.0/mod.ts";

const platformOriginal = os.platform() == "darwin" ? "osx" : os.platform();

export function seperatePathAndFile(pathName) {
  const path = pathName.split("/");
  const filename = path.pop();

  const pathRejoined = path.join("/");

  return {
    path: pathRejoined,
    filename: filename,
  };
}

export async function getAllVersions() {
  const launcherManifest = await axiod.get(
    "https://launchermeta.mojang.com/mc/game/version_manifest.json"
  );

  return launcherManifest.data.versions;
}

export class MinecraftDownloader {
  constructor(version, platform) {
    this.platform = platform ? platform : platformOriginal;

    if (this.platform != "osx" && this.platform != "windows" && this.platform != "linux")
      throw new Error(
        "Invalid platform. Platform must either be 'windows', 'osx', or 'linux'."
      );

    this.ver = version;

    this.versionData = null;
    this.versionManifest = null;
    this.assetIndex = null;
  }

  async getData() {
    const launcherManifest = await axiod.get(
      "https://launchermeta.mojang.com/mc/game/version_manifest.json"
    );

    const verData = launcherManifest.data.versions.find((i) => i.id == this.ver);
    this.versionData = verData;

    return verData;
  }

  async getManifest() {
    if (!this.versionData)
      throw new Error("You must call 'MinecraftDownloader.getData()' first.");

    const verManifest = await axiod.get(this.versionData.url);
    this.versionManifest = verManifest.data;

    return {
      data: verManifest.data,

      core: verManifest.data.downloads.client.url,
      libraries: verManifest.data.libraries,
      assetIndexURL: verManifest.data.assetIndex.url,
    };
  }

  async getAssetIndex() {
    if (!this.versionManifest)
      throw new Error(
        "You must call 'MinecraftDownloader.getManifest()' first."
      );

    const assetIndex = await axiod.get(this.versionManifest.assetIndex.url);
    this.assetIndex = assetIndex.data;

    return {
      data: assetIndex.data,
    };
  }

  getLibrary(libraryName) {
    if (!this.versionManifest)
      throw new Error(
        "You must call 'MinecraftDownloader.getManifest()' first."
      );

    if (!libraryName) throw new Error("No library specified!");

    const library = this.versionManifest.libraries[libraryName];
    let isNative = false; // Jank. (again)

    if (library.downloads.classifiers) {
      if (library.downloads.classifiers["natives-" + this.platform] || library.downloads.classifiers["natives-" + this.platform + "-x64"]) {
        isNative = true;
      }
    }

    const downloadData = library.downloads.classifiers
      ? library.downloads.classifiers[
          library.downloads.classifiers["natives-" + this.platform]
            ? "natives-" + this.platform
            : "natives-" + this.platform + "-64"
        ]
      : library.downloads.artifact;

    return {
      data: library,
      downloadData: downloadData,

      isNative: isNative
    };
  }

  getAsset(assetName) {
    if (!this.assetIndex)
      throw new Error(
        "You must call 'MinecraftDownloader.getAssetIndex()' first."
      );

    const asset = this.assetIndex.objects[assetName];
    const hashURL = "https://resources.download.minecraft.net/" + asset.hash.substring(0, 2) + "/" + asset.hash;

    return {
      data: asset,
      url: hashURL,
    };
  }
}

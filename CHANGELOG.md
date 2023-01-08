## 0.0.1
- Changed path of asset index, and added manifest saving.
- Use this code below to migrate:
```js
import * as eagle from "./src/mod.js";

const vers = await eagle.getAllVersions();

for (const mcVerData of vers.reverse()) {
  const baseDir = `${Deno.args[0] ? Deno.args[0] : "./eagle_dl_all"}/${mcVerData.type}/${mcVerData.id}/`;
  const logPrefix = `[${mcVerData.type}](${mcVerData.id}) `;

  console.log(logPrefix + "Reshuffling data...");
  const oldVerJSON = await Deno.readTextFile(baseDir + mcVerData.id + ".json");
  await Deno.remove(baseDir + mcVerData.id + ".json");
  await Deno.writeTextFile(baseDir + "/assets/" + mcVerData.id + ".json", oldVerJSON);

  const mcVer = mcVerData.id;
  
  const mcdl = new eagle.MinecraftDownloader(mcVer);

  await mcdl.getData();
  const verManifestData = await mcdl.getManifest();

  await Deno.writeTextFile(baseDir + mcVerData.id + ".json", JSON.stringify(verManifestData.data));
}
```
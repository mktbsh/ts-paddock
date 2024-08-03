import { downloadGsiTile } from "./gsi-tile";
import { removeMokurokuFile } from "./mokuroku";
import { NippoManager } from "./nippo-manager";

async function main() {
  const type = "seamlessphoto";
  const targetZoomLevels = [18];
  const forceDL = false;
  const workerThreads = 10;
  const removeMokuroku = false;
  const removeNippo = false;
  const convertToJpg = false;
  const jpgQuality = 75;

  // process
  console.log('Map type:', type);
  const downloadPngPathList = await downloadGsiTile({
    type,
    zoomLevels: targetZoomLevels,
    forceDownload: forceDL,
    workerThreads: workerThreads
  });

  await Promise.all([
    removeMokuroku ? removeMokurokuFile(type) : Promise.resolve,
    removeNippo ? new NippoManager(type).removeFiles() : Promise.resolve
  ])

  console.log('Done:', type)

  Bun.write('download-png-path-list.txt', downloadPngPathList.join('\n'))
}

await main()

import { createCanvas, loadImage } from "@napi-rs/canvas";
import tiles from "../assets/tiles.json";
import { readFileSync, readFile } from "fs";

export default async ({
  turn,
  players,
  user
}: {
  turn: number;
  players: {
    player: string;
    hand: (TileStrings | "")[][];
  }[],
  user: number
}) => {
  const dirnameFixed = __dirname.replace(/\\/g, "/")
  const canvas = createCanvas(2160, 2160);
  const ctx = canvas.getContext("2d");

  const tableBuffer = readFileSync(require.resolve("../assets/mahjong-table.png"));
  const table = await loadImage(tableBuffer);
  const spriteSheetBuffer = readFileSync(require.resolve("../assets/mahjong-tiles.png"));
  const spriteSheet = await loadImage(spriteSheetBuffer);
  const tileWidth = 86;
  const tileHeight = 118;

  // let tableLoaded = false;
  // let spriteSheetLoaded = false;

  // table.onload = () => {
  //   console.log("canvas1pre")
  //   tableLoaded = true;
  //   if (spriteSheetLoaded) {
  //     ctx.drawImage(table, 0, 0, 2160, 2160, 0, 0, 2160, 2160)
  //     drawHand()
  //     console.log("canvas1")
  //     resolve()
  //   }
  // }
  // spriteSheet.onload = () => {
  //   console.log("canvas2pre")
  //   spriteSheetLoaded = true;
  //   if (tableLoaded) {
  //     ctx.drawImage(table, 0, 0, 2160, 2160, 0, 0, 2160, 2160)
  //     drawHand()
  //     console.log("canvas2")
  //     resolve()
  //   }
  // }
  
  // function drawHand() {
  //   for(let y = 0; y <= 4; y++) {
  //     for(let x = 0; x <= 15; x++) {
  //       const tile = players[user].hand[y][x];
  //       if(tile != "") {
  //         ctx.drawImage(spriteSheet, tiles[tile].x, tiles[tile].y, tileWidth, tileHeight, x * (tileWidth + 2) + 360, y * (tileHeight+2) + 1528, tileWidth, tileHeight)
  //       }
  //     }
  //   }
  // }
  ctx.drawImage(table, 0, 0, 2160, 2160, 0, 0, 2160, 2160);
  
  for(let y = 0; y <= 4; y++) {
    for(let x = 0; x <= 15; x++) {
      const tile = players[user].hand[y][x];
      if(tile != "") {
        console.log([tile])
        console.log(x)
        ctx.drawImage(spriteSheet, tiles[tile].x, tiles[tile].y, tileWidth, tileHeight, x * (tileWidth + 2) + 360, y * (tileHeight+2) + 1528, tileWidth, tileHeight)
      }
    }
  }
  return canvas;
}
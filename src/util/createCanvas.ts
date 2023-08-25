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

  ctx.drawImage(table, 0, 0, 2160, 2160, 0, 0, 2160, 2160);
  
  for(let y = 0; y <= 4; y++) {
    for(let x = 0; x <= 15; x++) {
      const tile = players[user].hand[y][x];
      if(tile != "") {
        ctx.drawImage(spriteSheet, tiles[tile].x, tiles[tile].y, tileWidth, tileHeight, x * (tileWidth + 2) + 360, y * (tileHeight+2) + 1528, tileWidth, tileHeight)
      }
    }
  }
  ctx.rotate(270*Math.PI/180);
  for(let y = 0; y <= 4; y++) { // hand 1
    for(let x = 0; x <= 15; x++) {
      if (players[(user % 4) + 1].hand[y][x] != "") {
        ctx.drawImage(spriteSheet, tiles.back.x, tiles.back.y, tileWidth, tileHeight, -x * ((tileWidth*2/3)+1)-457, ((y*2/3)+1) * tileHeight + 1609.5, tileWidth*2/3, tileHeight*2/3)
      }
    }
  }
  ctx.rotate(270*Math.PI/180);
  for(let y = 0; y <= 4; y++) { // hand 2
    for(let x = 0; x <= 15; x++) {
      if (players[((user + 1) % 4) + 1].hand[y][x] != "") {
        ctx.drawImage(spriteSheet, tiles.back.x, tiles.back.y, tileWidth, tileHeight, -x * ((tileWidth*2/3)+1)-674, -((y*2/3)+1) * tileHeight, tileWidth*2/3, tileHeight*2/3)
      }
    }
  }
  ctx.rotate(270*Math.PI/180);
  for(let y = 0; y <= 4; y++) { // hand 3
    for(let x = 0; x <= 15; x++) {
      if (players[((user + 2) % 4) + 1].hand[y][x] != "") {
        ctx.drawImage(spriteSheet, tiles.back.x, tiles.back.y, tileWidth, tileHeight, x * ((tileWidth*2/3)+1) + 400, -((y*2/3)+1) * tileHeight, tileWidth*2/3, tileHeight*2/3)
      }
    }
  }
  return canvas;
}
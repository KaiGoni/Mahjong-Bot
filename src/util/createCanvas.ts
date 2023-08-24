import { createCanvas, loadImage } from "@napi-rs/canvas";
import tiles from "../assets/tiles.json";

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
  const canvas = createCanvas(2160, 2160);
  const ctx = canvas.getContext("2d");
  const table = await loadImage("../assets/mahjong-table.png");
  const spriteSheet = await loadImage("../assets/mahjong-tiles.png");

  const tileWidth = 86;
  const tileHeight = 118;
  let tableLoaded = false;
  let spriteSheetLoaded = false;

  table.onload = () => {
    tableLoaded = true;
    if (spriteSheetLoaded) {
      ctx.drawImage(table, 0, 0, 2160, 2160, 0, 0, 2160, 2160)
      drawHand()
      resolve()
    }
  }
  spriteSheet.onload = () => {
    spriteSheetLoaded = true;
    if (tableLoaded) {
      ctx.drawImage(table, 0, 0, 2160, 2160, 0, 0, 2160, 2160)
      drawHand()
      resolve()
    }
  }
  
  function drawHand() {
    for(let y = 0; y <= 4; y++) {
      for(let x = 0; x <= 15; x++) {
        const tile = players[user].hand[y][x];
        if(tile != "") {
          ctx.drawImage(spriteSheet, tiles[tile].x, tiles[tile].y, tileWidth, tileHeight, x * (tileWidth + 2) + 360, y * (tileHeight+2) + 1528, tileWidth, tileHeight)
        }
      }
    }
  }
  let resolve: () => void;
  await new Promise<void>((res) => {
    resolve = res;
  })
  return canvas;
}
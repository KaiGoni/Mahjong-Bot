export const deck = {
  tiles: [
    //dots
    "dot1", "dot1", "dot1", "dot1",
    "dot2", "dot2", "dot2", "dot2",
    "dot3", "dot3", "dot3", "dot3",
    "dot4", "dot4", "dot4", "dot4",
    "dot5", "dot5", "dot5", "dot5",
    "dot6", "dot6", "dot6", "dot6",
    "dot7", "dot7", "dot7", "dot7",
    "dot8", "dot8", "dot8", "dot8",
    "dot9", "dot9", "dot9", "dot9",
    //sticks
    "stick1", "stick1", "stick1", "stick1",
    "stick2", "stick2", "stick2", "stick2",
    "stick3", "stick3", "stick3", "stick3",
    "stick4", "stick4", "stick4", "stick4",
    "stick5", "stick5", "stick5", "stick5",
    "stick6", "stick6", "stick6", "stick6",
    "stick7", "stick7", "stick7", "stick7",
    "stick8", "stick8", "stick8", "stick8",
    "stick9", "stick9", "stick9", "stick9",
    //words
    "word1", "word1", "word1", "word1",
    "word2", "word2", "word2", "word2",
    "word3", "word3", "word3", "word3",
    "word4", "word4", "word4", "word4",
    "word5", "word5", "word5", "word5",
    "word6", "word6", "word6", "word6",
    "word7", "word7", "word7", "word7",
    "word8", "word8", "word8", "word8",
    "word9", "word9", "word9", "word9",
    //winds
    "north", "north", "north", "north",
    "south", "south", "south", "south",
    "east", "east", "east", "east",
    "west", "west", "west", "west",
    //dragons
    "red", "red", "red", "red",
    "green", "green", "green", "green",
    "white", "white", "white", "white",
    //seasons
    "spring", "spring", "spring", "spring",
    "summer", "summer", "summer", "summer",
    "autumn", "autumn", "autumn", "autumn",
    "winter", "winter", "winter", "winter",
    //flowers
    "plum", "plum", "plum", "plum",
    "orchid", "orchid", "orchid", "orchid",
    "chrysanthemum", "chrysanthemum", "chrysanthemum", "chrysanthemum",
    "bamboo", "bamboo", "bamboo", "bamboo",
    //joker
    "joker", "joker", "joker", "joker", "joker", "joker", "joker", "joker",
  ],
  styles: {
    "wenzhou": {
      remove: ["spring", "summer", "autumn", "winter", "plum", "orchid", "chrysanthemum", "bamboo", "joker"],
      modifiers: {
        wildcard: "true"
      },
      handsize: 16
    }
  },
  tileEmojis: {
    "dot1": "🀙",
    "dot2": "🀚",
    "dot3": "🀛",
    "dot4": "🀜",
    "dot5": "🀝",
    "dot6": "🀞",
    "dot7": "🀟",
    "dot8": "🀠",
    "dot9": "🀡",
    "stick1": "🀐",
    "stick2": "🀑",
    "stick3": "🀒",
    "stick4": "🀓",
    "stick5": "🀔",
    "stick6": "🀕",
    "stick7": "🀖",
    "stick8": "🀗",
    "stick9": "🀘",
    "word1": "🀇",
    "word2": "🀈",
    "word3": "🀉",
    "word4": "🀊",
    "word5": "🀋",
    "word6": "🀌",
    "word7": "🀍",
    "word8": "🀎",
    "word9": "🀏",
    "north": "🀃",
    "south": "🀁",
    "east": "🀀",
    "west": "🀂",
    "red": "🀄",
    "green": "🀅",
    "white": "🀆",
    "spring": "🀦",
    "summer": "🀧",
    "autumn": "🀨",
    "winter": "🀩",
    "plum": "🀢",
    "orchid": "🀣",
    "chrysanthemum": "🀥",
    "bamboo": "🀤",
    "joker": "🀪",
    "back": "🀫",
  },
};

export function generateDeck(style: "wenzhou") {
  var wildcard = "";
  var hands: any[][] = [[],[],[],[]];
  for (const deckStyle in deck.styles) {
    //filters tiles
    if (deckStyle === style) {
      for (const remove of deck.styles[deckStyle].remove) {
        deck.tiles = deck.tiles.filter(tile => tile !== remove);
      }
    }
    //shuffles tiles
    for (let i = deck.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck.tiles[i], deck.tiles[j]] = [deck.tiles[j], deck.tiles[i]];
    }
    //adds modifiers
    if (deckStyle === style) {
      if (deck.styles[deckStyle].modifiers.wildcard === "true") {
        var wildcard = deck.tiles[deck.tiles.length - 1];
      }
    }
    //distributes tiles
    for (let i = 0; i < 4; i++) {
      hands[i][0] = deck.tiles.splice(0, 16);
      hands[i][1] = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
      hands[i][2] = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
      hands[i][3] = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
      hands[i][4] = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
    }
  }

  return {
    deck: deck.tiles,
    hands,
    wildcard
  };
}
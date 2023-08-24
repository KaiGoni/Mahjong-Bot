import mongoose, { Schema } from 'mongoose';

const reqStr = {
  type: String,
  required: true
}
const reqArr = {
  type: Array,
  required: true
}

const schema = new Schema({
  _id: reqStr,
  style: reqStr,
  modifiers: {
    wildcard: {
      type: String,
      default: "none"
    }
  },
  players: reqArr,
  deck: reqArr,
  discard: reqArr,
  turn: {
    type: Number,
    requied: true
  },
})

export = mongoose.models['game-status'] || mongoose.model('game-status', schema, 'game-status');
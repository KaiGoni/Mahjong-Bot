import mongoose, { Schema } from 'mongoose';

function required(type: any) {
  return {
    type,
    required: true
  }
}

const schema = new Schema({
  _id: required(String),
  style: required(String),
  modifiers: {
    wildcard: {
      type: String,
      default: "none"
    }
  },
  players: required(Object),
  deck: required(Array),
  discard: required(Array),
  turn: required(Number)
})

export = mongoose.models['game-status'] || mongoose.model('game-status', schema, 'game-status');
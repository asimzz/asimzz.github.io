import mongoose from "mongoose";

export interface Skill {
  name: string;
  type: string;
  icon: Date;
}

const skillSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: String },
  icon: { type: String },
});

const SkillModel = mongoose.model("Skill", skillSchema);

module.exports = mongoose.model("Skill", skillSchema);

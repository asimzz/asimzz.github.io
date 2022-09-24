export interface Skill {
  type: SkillType;
  name: string;
  icon: string;
}

export enum SkillType {
  Framework = "framework",
  ProgrammingLangauge = "programming langauge",
  Langauge = "langauge",
  Other = "other",
}

export interface SocialMedia {
  type: SocialMediaType;
  link: string;
  icon: string;
}

export enum SocialMediaType {
  Twitter = "twitter",
  LinkedIn = "linkedIn",
  Facebook = "facebook",
  Github = "github",
  Telegram = "telegram",
  Gmail = "Gmail",
}

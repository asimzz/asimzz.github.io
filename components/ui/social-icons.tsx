import {
  FaEnvelope,
  FaGithub,
  FaGoogleScholar,
  FaLinkedin,
  FaRss,
  FaXTwitter,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import { socials, type SocialLink } from "@/content/site";

const icons: Record<SocialLink["icon"], IconType> = {
  email: FaEnvelope,
  github: FaGithub,
  linkedin: FaLinkedin,
  scholar: FaGoogleScholar,
  x: FaXTwitter,
  rss: FaRss,
};

export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex items-center gap-5 ${className}`}>
      {socials.map((social) => {
        const Icon = icons[social.icon];
        const isExternal = social.href.startsWith("http");
        return (
          <li key={social.href}>
            <a
              href={social.href}
              aria-label={social.label}
              title={social.label}
              {...(isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-ink-faint hover:text-accent inline-block transition-colors"
            >
              <Icon className="size-5" aria-hidden />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

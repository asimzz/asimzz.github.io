import { FaRss, FaXTwitter } from "react-icons/fa6";
import {
  EmailIcon,
  GitHubIcon,
  LinkedInIcon,
  ScholarIcon,
  type IconProps,
} from "@/components/ui/icons";
import { socials, type SocialLink } from "@/content/site";

/**
 * The subset of props these icons are actually rendered with. Narrower than
 * react-icons' own IconType, so both its components and the local inline SVGs
 * satisfy it.
 */
type SocialIcon = (props: IconProps) => React.ReactNode;

const icons: Record<SocialLink["icon"], SocialIcon> = {
  email: EmailIcon,
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  scholar: ScholarIcon,
  x: FaXTwitter,
  rss: FaRss,
};

/**
 * Shared by every icon in the row. Exported so a caller-supplied `trailing`
 * link is styled identically to the mapped ones.
 */
export const socialIconLinkClass =
  "text-ink-faint hover:text-accent inline-block transition-colors";

export function SocialIcons({
  className = "",
  trailing,
}: {
  className?: string;
  /**
   * An extra link appended to the row, rendered in its own <li> so it shares
   * the list items' box exactly -- as a sibling of the <ul> it would blockify
   * and sit a couple of pixels above the rest.
   */
  trailing?: React.ReactNode;
}) {
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
              className={socialIconLinkClass}
            >
              <Icon className="size-5" aria-hidden />
            </a>
          </li>
        );
      })}
      {trailing && <li>{trailing}</li>}
    </ul>
  );
}

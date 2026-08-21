import { SocialIcons } from "@/components/ui/social-icons";
import { profile } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-line mt-20 border-t">
      <div className="text-ink-faint mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-10 text-sm sm:flex-row sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {profile.name}
        </p>
        <SocialIcons />
      </div>
    </footer>
  );
}

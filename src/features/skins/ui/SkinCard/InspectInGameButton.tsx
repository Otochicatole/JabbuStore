import React from "react";
import { Eye } from "lucide-react";

export const InspectInGameButton = ({
  href,
  title,
  className = "h-9 w-9",
}: {
  href: string;
  title: string;
  className?: string;
}) => {
  if (!href || /%[a-z0-9_:]+%/i.test(href)) return null;
  return (
    <a
      href={href}
      className={`${className} flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg transition-all hover:scale-105 active:scale-95 shrink-0`}
      title={title}
    >
      <Eye className="w-4 h-4" />
    </a>
  );
};

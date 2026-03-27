"use client";

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: "𝕏",
      color: "hover:bg-gray-700",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: "f",
      color: "hover:bg-blue-600",
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(title + " — " + url)}`,
      icon: "W",
      color: "hover:bg-green-600",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: "T",
      color: "hover:bg-sky-500",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">Partager :</span>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`Partager sur ${link.name}`}
          className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400 hover:text-white transition-all ${link.color}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/cn";

const AVATAR_SRC: Record<string, string> = {
  Fairy: "/avatars/fairy.png",
  Fome: "/avatars/fome.png",
};

export function UserAvatar({
  name,
  colorTag,
  size,
  className,
}: {
  name: string;
  colorTag: string;
  size: number;
  className?: string;
}) {
  const src = AVATAR_SRC[name];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-bg",
        className,
      )}
      style={{
        backgroundColor: colorTag,
        width: size,
        height: size,
        fontSize: size * 0.44,
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}

import { cn } from "../../utils/cn";

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-14 w-14 text-lg" };

export default function Avatar({ src, username, size = "md", className }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();
  return src ? (
    <img
      src={src}
      alt={username}
      className={cn("rounded-full object-cover", sizes[size], className)}
    />
  ) : (
    <span
      className={cn(
        "rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center",
        sizes[size],
        className
      )}
    >
      {initials}
    </span>
  );
}

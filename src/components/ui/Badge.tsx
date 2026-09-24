import { cn } from "../../utils/cn";

const variants = {
  default: "bg-gray-100 text-gray-700",
  open: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
  pinned: "bg-yellow-100 text-yellow-700",
  tag: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer",
};

interface BadgeProps {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Badge({ variant = "default", className, children, onClick }: BadgeProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

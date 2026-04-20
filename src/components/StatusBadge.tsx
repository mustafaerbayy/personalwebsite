import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const { getCategory } = useCategories();
  const category = getCategory(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
        className
      )}
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
        borderColor: `${category.color}40`,
      }}
    >
      <span 
        className="h-1.5 w-1.5 rounded-full" 
        style={{ backgroundColor: category.color, boxShadow: `0 0 5px ${category.color}80` }}
      />
      {category.label}
    </span>
  );
}

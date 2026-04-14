import { Star, StarOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  onRatingChange,
  readOnly = false,
}: RatingStarsProps) {
  return (
    <div className="flex space-x-1">
      {Array.from({ length: maxRating }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "cursor-pointer",
            readOnly && "cursor-default"
          )}
          onClick={() => !readOnly && onRatingChange?.(i + 1)}
        >
          {i < rating ? (
            <Star className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
          ) : (
            <StarOff className={cn(sizeClasses[size], "text-gray-300")} />
          )}
        </span>
      ))}
    </div>
  );
} 
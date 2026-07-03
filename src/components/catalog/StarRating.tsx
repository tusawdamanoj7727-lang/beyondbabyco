import RatingStars from "@/components/reviews/RatingStars";

/** @deprecated Prefer RatingStars from @/components/reviews/RatingStars */
export default function StarRating(props: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return <RatingStars {...props} detailed />;
}

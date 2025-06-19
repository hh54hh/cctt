import React from "react";

interface GymLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const GymLogo: React.FC<GymLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <img
      src="https://cdn.builder.io/api/v1/image/assets%2F07970f70dbda4c93a00aefe2e8b360cb%2F5f65f8b3a8a949ac8a67885487b4dfdf?format=webp&width=200"
      alt="شعار صالة حسام لكمال الأجسام والرشاقة"
      className={`${sizeClasses[size]} object-cover rounded-lg shadow-md ${className}`}
      onError={(e) => {
        // Fallback if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
      }}
    />
  );
};

export default GymLogo;

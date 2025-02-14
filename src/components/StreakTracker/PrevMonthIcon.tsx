import React from "react";

export const PrevMonthIcon: React.FC<{
  size?: number;
  color?: string;
  onClick?: () => void;
}> = ({ size = 24, color = "currentColor", onClick }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
};

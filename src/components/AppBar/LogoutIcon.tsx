import React from "react";

export const LogoutIcon: React.FC<Props> = ({
  size = 24,
  color = "currentColor",
  onClick,
}) => {
  return (
    <svg
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
    </svg>
  );
};

interface Props {
  size?: number;
  color?: string;
  onClick: () => void;
}

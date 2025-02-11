export const BackArrowIcon = ({
  size = 24,
  color = "currentColor",
  onClick,
}: Props) => (
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
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

interface Props {
  size?: number;
  color?: string;
  onClick: () => void;
}

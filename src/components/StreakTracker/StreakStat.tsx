import "./StreakStat.css";

export const StreakStat: React.FC<StreakStatProps> = ({
  icon,
  label,
  value,
  unit,
  compact = false,
}) => {
  return (
    <div className={compact ? "" : "streak"}>
      <span>
        <span className="icon">{icon}</span>
        {!compact && <strong>{label}</strong>}
      </span>
      <span>
        {value} {unit}
      </span>
    </div>
  );
};

interface StreakStatProps {
  icon: string;
  label: string;
  value: number | string;
  unit: string;
  compact?: boolean;
}

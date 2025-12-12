import "./StreakStat.css";

export const StreakStat: React.FC<StreakStatProps> = ({
  icon,
  label,
  value,
  unit,
  compact = false,
}) => {
  return (
    <div className={`streak ${compact ? "compact" : ""}`}>
      <div className="streak-header">
        <span className="icon">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="streak-value">{value}</div>
      <div className="streak-unit">{unit}</div>
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

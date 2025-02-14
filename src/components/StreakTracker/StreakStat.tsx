import "./StreakStat.css";

export const StreakStat: React.FC<StreakStatProps> = ({
  icon,
  label,
  value,
  unit,
}) => {
  return (
    <div className="streak">
      <span>
        <span className="icon">{icon}</span>
        <strong>{label}</strong>
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
}

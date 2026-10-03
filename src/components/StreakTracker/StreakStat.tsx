import "./StreakStat.css";

export const StreakStat = ({ icon, label, value, unit }: Props) => (
  <div className="streak">
    <div className="streak-header">
      <span className="icon">{icon}</span>
      <span>{label}</span>
    </div>
    <div className="streak-value">{value}</div>
    <div className="streak-unit">{unit}</div>
  </div>
);

interface Props {
  icon: string;
  label: string;
  value: number;
  unit: string;
}

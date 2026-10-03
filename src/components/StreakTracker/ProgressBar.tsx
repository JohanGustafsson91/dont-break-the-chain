import "./ProgressBar.css";

export const ProgressBar = ({ goodDays, badDays, thick = false }: Props) => {
  const total = goodDays + badDays;
  const toWidth = (days: number) =>
    total === 0 ? "0%" : `${(days / total) * 100}%`;

  return (
    <div className={`progress-bar ${thick ? "progress-bar_thick" : ""}`}>
      <div className="good" style={{ width: toWidth(goodDays) }} />
      <div className="bad" style={{ width: toWidth(badDays) }} />
    </div>
  );
};

interface Props {
  goodDays: number;
  badDays: number;
  thick?: boolean;
}

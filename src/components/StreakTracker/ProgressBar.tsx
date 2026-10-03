import "./ProgressBar.css";

export const ProgressBar = ({
  goodDays,
  badDays,
  total = goodDays + badDays,
  thick = false,
}: Props) => {
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
  total?: number;
  thick?: boolean;
}

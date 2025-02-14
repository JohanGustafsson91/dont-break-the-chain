import React from "react";
import "./ProgressBar.css";

interface ProgressBarProps {
  goodDays: number;
  badDays: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  goodDays,
  badDays,
}) => {
  const total = goodDays + badDays;
  const goodPercentage = (goodDays / total) * 100;
  const badPercentage = (badDays / total) * 100;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div className="good" style={{ width: `${goodPercentage}%` }}></div>
        <div className="bad" style={{ width: `${badPercentage}%` }}></div>
        <span className="progress-label">{goodPercentage.toFixed(1)}%</span>
      </div>
      <div className="legend">
        <span className="good">✅ Good: {goodDays} days</span>
        <span className="bad">❌ Bad: {badDays} days</span>
      </div>
    </div>
  );
};

import "./Legal.css";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LEGAL } from "../../shared/legal";
import { useMessages } from "../../i18n/i18n";
import { createDate, formatDay } from "../../utils/date";
import { legalMessages } from "./messages";

export const LegalPage = ({ title, children }: Props) => {
  const t = useMessages(legalMessages);
  const effective = formatDay(createDate(LEGAL.effectiveDate), { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="page LegalPage">
      <div className="LegalPage-content">
        <Link to="/" className="LegalPage-back">
          {t.back}
        </Link>
        <h1>{title}</h1>
        <p className="LegalPage-meta">{t.effective(effective)}</p>
        {children}
        <p className="LegalPage-meta">
          {t.questions} <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
      </div>
    </div>
  );
};

interface Props {
  title: string;
  children: ReactNode;
}

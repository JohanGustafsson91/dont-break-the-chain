import "./Legal.css";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LEGAL } from "../../shared/legal";

export const LegalPage = ({ title, children }: Props) => (
  <div className="page LegalPage">
    <div className="LegalPage-content">
      <Link to="/" className="LegalPage-back">
        ‹ Back to the app
      </Link>
      <h1>{title}</h1>
      <p className="LegalPage-meta">Effective {LEGAL.effectiveDate}</p>
      {children}
      <p className="LegalPage-meta">
        Questions? Email <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </div>
  </div>
);

interface Props {
  title: string;
  children: ReactNode;
}

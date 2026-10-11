import "./ViewSwitch.css";
import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

/** Switches between today's list and the overview, one tap apart. */
export const ViewSwitch = () => {
  const location = useLocation();
  const nav = useRef<HTMLElement>(null);
  const switched = (location.state as { viaSwitch?: boolean } | null)?.viaSwitch;

  // Each page has its own switch, so the link just used is gone after the switch;
  // put focus on the new page's active link instead of losing it.
  useEffect(() => {
    if (switched) nav.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
  }, [switched]);

  return (
    <nav className="ViewSwitch" aria-label="Views" ref={nav}>
      <NavLink to="/" end state={{ viaSwitch: true }} className="ViewSwitch-link">
        Today
      </NavLink>
      <NavLink to="/overview" state={{ viaSwitch: true }} className="ViewSwitch-link">
        Overview
      </NavLink>
    </nav>
  );
};

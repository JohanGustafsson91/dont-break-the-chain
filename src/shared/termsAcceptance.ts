import { LEGAL } from "./legal";

// Remembered per device and per version of the terms: a new effective date asks again.
// This is a convenience, not a record of consent. Storage can be blocked (private
// windows), in which case the user simply ticks the box again.
const KEY = "acceptedTermsVersion";

export const hasAcceptedCurrentTerms = () => {
  try {
    return localStorage.getItem(KEY) === LEGAL.effectiveDate;
  } catch {
    return false;
  }
};

export const rememberTermsAccepted = () => {
  try {
    localStorage.setItem(KEY, LEGAL.effectiveDate);
  } catch {
    // Ignore: the user ticks the box again next time.
  }
};

export const forgetTermsAccepted = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
};

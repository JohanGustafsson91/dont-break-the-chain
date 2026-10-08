// Survives the redirects that follow signing out (login → "/" → login), which would
// drop router state. Storage can be blocked, e.g. in private windows: then the notice
// is simply not shown.
const KEY = "accountDeleted";

export const markAccountDeleted = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Ignore: the notice is a courtesy.
  }
};

export const wasAccountDeleted = () => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const clearAccountDeleted = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
};

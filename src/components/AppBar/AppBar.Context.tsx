import { createContext, useContext, ReactElement } from "react";

type AppBarContextType = {
  childrenComponents: ReactElement | null;
  renderAppBarItems: (items: ReactElement | null) => void;
};

export const AppBarContext = createContext<AppBarContextType | undefined>(
  undefined,
);

export const useAppBarContext = () => {
  const context = useContext(AppBarContext);
  if (!context) {
    throw new Error("useAppBarContext must be used within an AppBarProvider");
  }
  return context;
};

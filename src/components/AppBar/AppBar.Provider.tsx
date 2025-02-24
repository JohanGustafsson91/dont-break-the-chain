import { ReactElement, ReactNode, useRef, useState } from "react";
import { AppBarContext } from "./AppBar.Context";

export const AppBarProvider = ({ children }: { children: ReactNode }) => {
  const [childrenComponents, setChildrenComponents] =
    useState<ReactElement | null>(null);

  const renderAppBarItems = useRef((items: ReactElement | null) => {
    setChildrenComponents(items);
  });

  return (
    <AppBarContext.Provider
      value={{
        childrenComponents,
        renderAppBarItems: renderAppBarItems.current,
      }}
    >
      {children}
    </AppBarContext.Provider>
  );
};

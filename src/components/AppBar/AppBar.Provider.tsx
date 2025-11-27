import { ReactElement, ReactNode, useRef, useState } from "react";
import { AppBarContext } from "./AppBar.Context";

export const AppBarProvider = ({ children }: { children: ReactNode }) => {
  const [childrenComponents, setChildrenComponents] =
    useState<ReactElement | undefined>(undefined);

  const renderAppBarItems = useRef((items: ReactElement | undefined) => {
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

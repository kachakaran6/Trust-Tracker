import React, { createContext, useContext, useState, useCallback } from "react";

interface PageHeaderContextType {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  setPageHeader: (title: string, subtitle?: string, icon?: React.ReactNode) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType>({
  title: "",
  subtitle: "",
  icon: undefined,
  setPageHeader: () => {},
});

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [icon, setIcon] = useState<React.ReactNode>(undefined);

  const setPageHeader = useCallback(
    (t: string, s = "", i?: React.ReactNode) => {
      setTitle(t);
      setSubtitle(s);
      setIcon(i);
    },
    []
  );

  return (
    <PageHeaderContext.Provider value={{ title, subtitle, icon, setPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  return useContext(PageHeaderContext);
}

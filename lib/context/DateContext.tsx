"use client";

import React, { createContext, useContext, useState } from "react";

interface DateContextValue {
  date: Date;
  setDate: (d: Date) => void;
}

const DateContext = createContext<DateContextValue>({
  date: new Date(),
  setDate: () => {},
});

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [date, setDate] = useState<Date>(new Date());
  return (
    <DateContext.Provider value={{ date, setDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  return useContext(DateContext);
}
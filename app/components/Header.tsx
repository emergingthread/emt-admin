"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type HeaderProps = {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
};

export default function Header({ eyebrow, title, actions }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState("");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const updateDate = () => setCurrentDate(new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date()));
    updateDate();
    const interval = window.setInterval(updateDate, 60_000);
    setUserName(sessionStorage.getItem("emt-user-name") || "User");
    return () => window.clearInterval(interval);
  }, []);

  const displayTitle = title === "Welcome" ? `Welcome, ${userName}` : title;
  const initials = userName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <div><p className="eyebrow">{currentDate || eyebrow}</p><h1>{displayTitle}</h1></div>
      {actions ?? <div className="avatar">{initials}</div>}
    </header>
  );
}

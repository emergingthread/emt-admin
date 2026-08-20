import type { ReactNode } from "react";

type HeaderProps = {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
};

export default function Header({ eyebrow, title, actions }: HeaderProps) {
  return (
    <header className="topbar">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
      {actions ?? <div className="avatar">AM</div>}
    </header>
  );
}

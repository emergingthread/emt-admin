"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { ChevronDown, Circle, LogOut, Settings, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import { fetchJson } from "@/lib/fetch";

type Menu = { id: number; name: string; parentId: number | null; route: string | null; icon: string; displayOrder: number; isActive: boolean };

const iconMap = LucideIcons as unknown as Record<string, LucideIcon>;

function MenuIcon({ name }: { name: string }) {
  const Icon = iconMap[name] ?? Circle;
  return <Icon aria-hidden="true" size={18} strokeWidth={1.8} />;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchJson<Menu[]>("/api/menus")
      .then((data) => setMenus(data.filter((menu) => menu.isActive)))
      .catch(() => setMenus([]))
      .finally(() => setIsLoading(false));
  }, []);

  
  const rootMenus = menus.filter((menu) => menu.parentId === null).sort((first, second) => first.displayOrder - second.displayOrder);
  const childMenus = (parentId: number) => menus.filter((menu) => menu.parentId === parentId).sort((first, second) => first.displayOrder - second.displayOrder);

  function toggleMenu(menuId: number) {
    setExpandedMenus((current) => {
      const next = new Set(current);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });
  }

  function menuLink(menu: Menu, child = false) {
    const className = `${pathname === menu.route || (menu.route && pathname.startsWith(`${menu.route}/`)) ? "active" : ""}${child ? " sidebar-menu-child" : ""}`;
    if (!menu.route) return <p className={`sidebar-menu-parent${child ? " sidebar-menu-child" : ""}`} key={menu.id}><span><MenuIcon name={menu.icon} /></span> {menu.name}</p>;
    return <Link className={className} href={menu.route} key={menu.id}><span><MenuIcon name={menu.icon} /></span> {menu.name}</Link>;
  }

  return (
    <aside className="sidebar">
      <div className="brand-mark"><span>+</span> EMT Admin</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {isLoading ? <LoadingIndicator label="Loading menu" /> : rootMenus.map((menu) => {
          const children = childMenus(menu.id);
          const isExpanded = expandedMenus.has(menu.id);

          if (children.length === 0) {
            return <div className="sidebar-menu-group" key={menu.id}>{menuLink(menu)}</div>;
          }

          return <div className="sidebar-menu-group" key={menu.id}>
            <button
              aria-controls={`sidebar-menu-${menu.id}`}
              aria-expanded={isExpanded}
              className="sidebar-menu-toggle"
              onClick={() => toggleMenu(menu.id)}
              type="button"
            >
              <span><MenuIcon name={menu.icon} /></span>
              {menu.name}
              <ChevronDown aria-hidden="true" className="sidebar-menu-chevron" size={15} strokeWidth={2} />
            </button>
            {isExpanded && <div id={`sidebar-menu-${menu.id}`}>{children.map((child) => menuLink(child, true))}</div>}
          </div>;
        })}
      </nav>
      <div className="sidebar-bottom"><a href="#settings"><span><Settings aria-hidden="true" size={18} strokeWidth={1.8} /></span> Settings</a><Link href="/"><span><LogOut aria-hidden="true" size={18} strokeWidth={1.8} /></span> Sign out</Link></div>
    </aside>
  );
}

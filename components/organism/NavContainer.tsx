"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowIcon, MiaIcon } from "@/helpers/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

type LeafLink = {
  href: string;
  title: string;
  icon: React.ElementType;
};

type GroupLink = {
  title: string;
  icon: React.ElementType;
  items: LeafLink[];
};

type NavLink = LeafLink | GroupLink;

interface ClientLayoutProps {
  tabs?: {
    title: string;
    tab: string;
    icon: React.ElementType;
    component?: React.ReactNode;
  }[];
  title: string;
  defaultTab?: string;
  links?: NavLink[]; // <- ahora soporta hojas o grupos
  children?: React.ReactNode;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isGroup(item: NavLink): item is GroupLink {
  return "items" in item;
}

export default function NavContainer({
  tabs = [],
  title,
  defaultTab = "",
  links = [],
  children,
}: ClientLayoutProps) {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [currentTab, setCurrentTab] = useState(
    defaultTab || (tabs.length > 0 ? tabs[0].tab : "")
  );

  const isExpanded = isOpen || isHover;

  const isActiveHref = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  // abre por defecto el grupo que contenga la ruta actual
  const initialGroupsOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    links.forEach((l) => {
      if (isGroup(l)) {
        open[l.title] = l.items.some((it) => isActiveHref(it.href));
      }
    });
    return open;
  }, [links, pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // no es agresivo: respeta lo que ya abriste y solo "activa" el grupo del path actual
    setOpenGroups((prev) => ({ ...prev, ...initialGroupsOpen }));
  }, [initialGroupsOpen]);

  return (
    <div className="flex h-full w-full min-w-[85vw]">
      {/* Sidebar */}
      <div
        className={cn(
          "relative h-full transition-all duration-300",
          isExpanded ? "w-52" : "w-16"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute w-full right-0 top-0 z-40 h-12 flex justify-end pr-5 items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ArrowIcon className={cn("transition-transform", isOpen && "rotate-180")} />
        </Button>

        {/* Sidebar Content */}
        <ScrollArea
          className="h-full py-6"
          onMouseOver={() => setIsHover(true)}
          onMouseOut={() => setIsHover(false)}
        >
          <div className="space-y-4">
            <div className="px-3 py-2">
              <div className="space-y-1">
                <div className="flex gap-2 h-fit items-center mb-8 mt-4">
                  <span>
                    <MiaIcon />
                  </span>
                  {isExpanded && (
                    <span>
                      <h2 className="text-xl font-semibold transition-all">{title}</h2>
                    </span>
                  )}
                </div>

                <nav className="space-y-2">
                  {/* LINKS (hojas o grupos) */}
                  {links.map((item) => {
                    // 1) LINK HOJA (como lo tenías)
                    if (!isGroup(item)) {
                      const active = isActiveHref(item.href);
                      return (
                        <Link
                          href={item.href}
                          key={item.href}
                          className={cn(
                            "flex items-center justify-start w-full gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            "hover:bg-blue-50 hover:text-blue-900",
                            active ? "bg-blue-100 text-blue-900" : "text-gray-500"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {isExpanded && (
                            <span className="whitespace-nowrap">{item.title}</span>
                          )}
                        </Link>
                      );
                    }

                    // 2) GRUPO DESPLEGABLE (categorías)
                    const groupOpen = !!openGroups[item.title];
                    const groupHasActive = item.items.some((it) => isActiveHref(it.href));

                    return (
                      <div key={item.title} className="space-y-1">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenGroups((p) => ({
                              ...p,
                              [item.title]: !p[item.title],
                            }))
                          }
                          className={cn(
                            "flex items-center justify-start w-full gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            "hover:bg-blue-50 hover:text-blue-900",
                            groupHasActive ? "bg-blue-100 text-blue-900" : "text-gray-500"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />

                          {isExpanded && (
                            <>
                              <span className="whitespace-nowrap flex-1 text-left">
                                {item.title}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  groupOpen && "rotate-180"
                                )}
                              />
                            </>
                          )}
                        </button>

                        {/* Submenu: solo cuando sidebar está expandida/hover */}
                        {isExpanded && groupOpen && (
                          <div className="ml-4 pl-2 border-l border-blue-100 space-y-1">
                            {item.items.map((sub) => {
                              const active = isActiveHref(sub.href);
                              return (
                                <Link
                                  href={sub.href}
                                  key={sub.href}
                                  className={cn(
                                    "flex items-center justify-start w-full gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                    "hover:bg-blue-50 hover:text-blue-900",
                                    active
                                      ? "bg-blue-100 text-blue-900"
                                      : "text-gray-500"
                                  )}
                                >
                                  <sub.icon className="h-4 w-4" />
                                  <span className="whitespace-nowrap">{sub.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* TABS (igual que lo tenías, pero corregido el className) */}
                  {tabs.map((item) => (
                    <button
                      onClick={() => setCurrentTab(item.tab)}
                      key={item.tab}
                      className={cn(
                        "flex items-center justify-start w-full gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                        "hover:bg-blue-50 hover:text-blue-900",
                        currentTab === item.tab
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-500"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {isExpanded && (
                        <span className="whitespace-nowrap">{item.title}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto min-h-[600px] border-l">
        {children}

        {tabs.length !== 0 && (
          <Suspense
            fallback={
              <>
                <h1>Cargando tu contenido...</h1>
              </>
            }
          >
            {tabs
              .filter((item) => item.tab === currentTab)
              .map((item) => (
                <div className="h-[600px] overflow-y-auto" key={item.tab}>
                  {item.component}
                </div>
              ))}
          </Suspense>
        )}
      </div>
    </div>
  );
}

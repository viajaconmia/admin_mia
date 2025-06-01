"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowIcon, MiaIcon } from "@/helpers/icons";

interface ClientLayoutProps {
  tabs: {
    title: string;
    tab: string;
    icon: React.ElementType;
    component: React.ReactNode;
  }[];
}

export default function ClientLayout({ tabs = [] }: ClientLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [currentTab, setCurrentTab] = useState("");

  return (
    <div className="flex h-full w-[85vw]">
      {/* Sidebar */}
      <div
        className={`relative h-full bg-white transition-all duration-300 ${
          isOpen || isHover ? "w-52" : "w-16"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute w-full right-0 top-0 z-40 h-12 flex justify-end pr-5 items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ArrowIcon
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
        {/* Sidebar Content */}
        <ScrollArea
          className="h-full py-6"
          onMouseOver={() => {
            setIsHover(true);
          }}
          onMouseOut={() => {
            setIsHover(false);
          }}
        >
          <div className="space-y-4">
            <div className="px-3 py-2">
              <div className="space-y-1">
                <div className="flex gap-2 h-fit items-center mb-8 mt-4">
                  <span>
                    <MiaIcon />
                  </span>
                  {(isOpen || isHover) && (
                    <span>
                      <h2 className="text-xl font-semibold transition-all">
                        Cliente
                      </h2>
                    </span>
                  )}
                </div>
                <nav className="space-y-2">
                  {tabs.map((item) => (
                    <button
                      onClick={() => {
                        setCurrentTab(item.tab);
                      }}
                      key={item.tab}
                      className={`flex items-center justify-start w-full gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-50 hover:text-blue-900",
                        ${
                          currentTab === item.tab
                            ? "bg-blue-100 text-blue-900"
                            : "text-gray-500"
                        }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {(isOpen || isHover) && (
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
      <div className="flex-1 overflow-y-auto h-[600px] border-l">
        <Suspense
          fallback={
            <>
              <h1>Cargando tu contenido...</h1>
            </>
          }
        >
          {tabs
            .filter((item) => item.tab === currentTab) // Usar === para comparación estricta
            .map((item) => (
              <div key={item.tab}>{item.component}</div>
            ))}
        </Suspense>
      </div>
    </div>
  );
}

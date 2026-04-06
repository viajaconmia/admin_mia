// components/CarpetasTabs.tsx
import React from "react";
import Button from "@/components/atom/Button";

export type VistaCarpeta =
  | "spei"
  | "pago_tdc"
  | "pago_link"
  | "pendiente_credito"
  | "ap_credito"
  | "pagada"
  | "notificados"
  | "canceladas"
  | "all";

export interface TabItem {
  key: VistaCarpeta;
  label: string;
  count: number;
}

interface CarpetasTabsProps {
  activeTab: VistaCarpeta;
  onTabChange: (tab: VistaCarpeta) => void;
  tabs: TabItem[];
}

const tabTheme: Record<
  VistaCarpeta,
  {
    ring: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    badge: string;
    badgeActive: string;
  }
> = {
  all: {
    ring: "focus:ring-blue-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-blue-500",
    badge: "bg-slate-50 text-slate-600 border-slate-200",
    badgeActive: "bg-blue-50 text-blue-700 border-blue-200",
  },
  spei: {
    ring: "focus:ring-cyan-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-800 border-cyan-200",
    badgeActive: "bg-cyan-100 text-cyan-900 border-cyan-300",
  },
  pago_tdc: {
    ring: "focus:ring-indigo-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
    badgeActive: "bg-indigo-100 text-indigo-900 border-indigo-300",
  },
  pago_link: {
    ring: "focus:ring-amber-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    badgeActive: "bg-amber-100 text-amber-950 border-amber-300",
  },
  pendiente_credito: {
    ring: "focus:ring-violet-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-800 border-violet-200",
    badgeActive: "bg-violet-100 text-violet-900 border-violet-300",
  },
  ap_credito: {
    ring: "focus:ring-emerald-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    badgeActive: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  pagada: {
    ring: "focus:ring-green-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-800 border-green-200",
    badgeActive: "bg-green-100 text-green-900 border-green-300",
  },
  notificados: {
    ring: "focus:ring-sky-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    badgeActive: "bg-sky-100 text-sky-900 border-sky-300",
  },
  canceladas: {
    ring: "focus:ring-rose-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    badgeActive: "bg-rose-100 text-rose-900 border-rose-300",
  },
};

const tabBase =
  "relative select-none group !rounded-xl border px-3 py-2 " +
  "transition-all duration-200 " +
  "hover:-translate-y-[1px] active:translate-y-0 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2";

function getTabClass(key: VistaCarpeta, active: boolean) {
  const t = tabTheme[key];
  const activeCls = active
    ? `bg-gradient-to-b from-white to-slate-50 border-slate-300 shadow-sm`
    : `${t.bg} ${t.border} hover:border-slate-300 hover:bg-slate-50`;
  return `${tabBase} ${t.ring} ${activeCls}`;
}

function getActiveUnderline(key: VistaCarpeta) {
  const dot = tabTheme[key].dot;
  return (
    <span className="absolute -bottom-[2px] left-2 right-2 h-[3px] rounded-full bg-slate-900/0">
      <span
        className={`block h-full rounded-full ${dot} opacity-80 blur-[0.2px]`}
      />
    </span>
  );
}

export const CarpetasTabs: React.FC<CarpetasTabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
}) => {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const theme = tabTheme[tab.key];

        return (
          <Button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            variant="ghost"
            size="md"
            className={getTabClass(tab.key, isActive)}
          >
            <span
              className={`mr-2 h-2.5 w-2.5 rounded-full ${theme.dot} shadow-sm`}
            />
            <span
              className={`font-semibold ${isActive ? "text-slate-900" : theme.text}`}
            >
              {tab.label}
            </span>
            <span
              className={
                "ml-2 text-[11px] px-2 py-0.5 rounded-full border font-semibold " +
                (isActive ? theme.badgeActive : theme.badge)
              }
            >
              {tab.count}
            </span>
            {isActive && getActiveUnderline(tab.key)}
          </Button>
        );
      })}
    </div>
  );
};
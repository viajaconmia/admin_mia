import Button from "../atom/Button";

interface TabsListProps {
  tabs: { tab: string; icon: React.ElementType }[];
  onChange: (tab: string) => void;
  activeTab: string;
}
const medidas = [
  "@xs:flex-row @xs:text-sm",
  "@sm:flex-row @sm:text-sm",
  "@md:flex-row @md:text-sm",
  "@lg:flex-row @lg:text-sm",
  "@xl:flex-row @xl:text-sm",
  "@2xl:flex-row @2xl:text-sm",
  "@3xl:flex-row @3xl:text-sm",
];

export const TabsList = ({ onChange, tabs, activeTab }: TabsListProps) => {
  return (
    <div className="border-b border-gray-200 rounded-t-md @container">
      <nav className={`-mb-px flex`}>
        {tabs.map(({ tab, icon }) => (
          <div key={tab} className=" w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(tab)}
              icon={icon}
              className={`${
                activeTab !== tab && "text-gray-500"
              } py-4 w-full  ${
                tabs.length < 3
                  ? "text-xs flex-col gap-[2px] px-0"
                  : medidas[tabs.length - 1]
              }`}
              type="button"
            >
              {tab.slice(0, 1).toUpperCase() + tab.slice(1)}
            </Button>
          </div>
        ))}
      </nav>
    </div>
  );
};

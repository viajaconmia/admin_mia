export const ToolTip = ({
  children,
  content,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  content: string;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <div className={`relative group ${className}`} onClick={onClick}>
      <div className="absolute z-10 bottom-full mb-2 hidden w-max max-w-xs rounded bg-gray-800 p-2 text-white text-sm group-hover:block">
        {content}
      </div>
      {children}
    </div>
  );
};

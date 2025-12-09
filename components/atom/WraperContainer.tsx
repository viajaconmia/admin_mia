export const WraperContainer = ({ children }) => {
  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-[95%]  rounded-md ">{children}</div>
    </div>
  );
};

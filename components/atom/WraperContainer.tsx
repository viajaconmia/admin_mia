export const WraperContainer = ({ children }) => {
  return (
    <div className="w-full h-full flex justify-center pt-8">
      <div className="w-[90%]  rounded-md ">{children}</div>
    </div>
  );
};

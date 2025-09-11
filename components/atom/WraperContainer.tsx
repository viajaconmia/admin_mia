export const WraperContainer = ({ children }) => {
  return (
    <div className="w-full h-full flex justify-center pt-8">
      <div className="bg-gray-50 w-[90%] max-h-[90%] rounded-md p-4 ">
        {children}
      </div>
    </div>
  );
};

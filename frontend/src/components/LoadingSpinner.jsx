const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-8 h-8 border-[3px] border-border border-top-primary rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;

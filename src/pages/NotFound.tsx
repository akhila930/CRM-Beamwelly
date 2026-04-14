
import { Button } from "@/components/ui/button";
import { useFadeIn } from "@/lib/animations";

const NotFound = () => {
  const fadeStyle = useFadeIn();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4"
      style={fadeStyle}
    >
      <div className="text-center space-y-6 max-w-md">
        <img 
          src="/lovable-uploads/a4e99198-de20-47c1-bb2c-d61dc76aacf4.png" 
          alt="EquityWala" 
          className="h-12 mx-auto mb-6"
        />
        <h1 className="text-8xl font-bold text-brand-red">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
        <p className="text-gray-600 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild size="lg" className="mt-8">
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

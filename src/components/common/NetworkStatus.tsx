import { useEffect, useState, memo, lazy, Suspense } from 'react';
import { Wifi } from 'lucide-react';

// Lazy load the offline UI components to reduce initial bundle size
const WifiOff = lazy(() => import('lucide-react').then(mod => ({ default: mod.WifiOff })));

interface NetworkStatusProps {
  children: React.ReactNode;
  offlineFallback?: React.ReactNode;
}

// Use memo to prevent unnecessary re-renders
export const NetworkStatus = memo(({ children, offlineFallback }: NetworkStatusProps) => {
  // We only need showOffline state since it's what controls the UI
  const [showOffline, setShowOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const handleOnline = () => {
      // Add a small delay before showing online content to prevent flashing
      setTimeout(() => setShowOffline(false), 300);
    };
    
    const handleOffline = () => {
      setShowOffline(true);
    };

    // Initialize state
    if (!navigator.onLine) {
      setShowOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showOffline) {
    if (offlineFallback) {
      return <>{offlineFallback}</>;
    }

    // Default offline UI with CodeRoaster design system
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cream p-4">Loading...</div>}>
        <div className="min-h-screen flex items-center justify-center bg-cream p-4">
          <div className="max-w-md w-full bg-cream border-4 border-charcoal rounded-lg shadow-[0px_8px_0px_0px_#27292b] text-center">
            {/* Header */}
            <div className="bg-charcoal p-6 border-b-4 border-charcoal">
              <div className="bg-coral/20 p-4 rounded-lg border-3 border-charcoal inline-block mb-4">
                <WifiOff className="w-12 h-12 text-coral" />
              </div>
              <h2 className="text-2xl font-bold text-cream">
                No Internet Connection
              </h2>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-charcoal/80 mb-6 font-medium leading-relaxed">
                It seems you're offline. Please check your internet connection and try again.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-amber hover:bg-amber/80 text-charcoal font-bold py-3 px-6 rounded-lg border-3 border-charcoal transition-all duration-200 shadow-[2px_2px_0px_0px_#27292b] hover:shadow-[1px_1px_0px_0px_#27292b] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                <Wifi className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Suspense>
    );
  }

  return <>{children}</>;
});

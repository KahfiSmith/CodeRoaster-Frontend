import { Route, BrowserRouter as Router, Routes, Outlet } from "react-router-dom";
import { Suspense, lazy, memo } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NetworkStatus, ThemeToggleFloating } from "@/components/common";
import { ThemeProvider } from "@/providers";

// Lazy load components (avoid prefetching source paths in production)
const CodeReviewer = lazy(() => import("@/pages"));

const History = lazy(() => import("@/pages/history"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component - memoized to prevent unnecessary re-renders
const PageLoader = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
));

// Memoize AppLayout to prevent unnecessary re-renders
const AppLayout = memo(() => (
  <>
    <ThemeToggleFloating />
    <Outlet />
  </>
));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkStatus>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AppLayout />}>
                  {/* Index */}
                  <Route path="/" element={<CodeReviewer />} />
                  <Route path="/history" element={<History />} />
                </Route>

                {/* Error Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </NetworkStatus>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

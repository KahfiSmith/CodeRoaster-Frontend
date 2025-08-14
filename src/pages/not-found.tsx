import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-cream">
      <h1 className="text-4xl font-bold mb-4 text-charcoal">404 - Page Not Found</h1>
      <p className="mb-8 text-charcoal">The page you are looking for does not exist.</p>
      <Link to="/" 
        className="px-4 py-2 bg-amber text-charcoal rounded-full hover:bg-retro-coral transition-colors font-medium border-2 border-charcoal"
      >
        Return to Home
      </Link>
    </div>
  );
}

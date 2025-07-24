import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-[100px] font-bold text-slate-600">404</h1>
      <p className="text-slate-600 mb-6">
        Oops! The page you're looking for doesn't exist.
      </p>
      <button
        onClick={handleGoBack}
        className="px-4 py-2 bg-[#7939ef] text-white rounded font-medium transition-all"
      >
        Go Back
      </button>
    </div>
  );
}

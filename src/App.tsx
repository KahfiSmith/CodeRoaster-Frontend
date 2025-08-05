import CodeReviewer from "@/pages";
import NotFound from "@/pages/not-found";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import History from "./pages/history";

function App() {
  return (
    <Router>
      <Routes>
        {/* Index */}
        <Route path="/" element={<CodeReviewer />} />
        <Route path="/history" element={<History />} />

        {/* Error Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

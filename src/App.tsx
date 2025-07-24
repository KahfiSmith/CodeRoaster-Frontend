import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NotFound from "@/pages/not-found";
import { Bookmarks } from "@/pages/bookmarks";
import CodeReviewer from "@/pages";

function App() {
  return (
    <Router>
      <Routes>
        {/* Index */}
        <Route path="/" element={<CodeReviewer />} />
        <Route path="/bookmarks" element={<Bookmarks />} />

        {/* Error Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

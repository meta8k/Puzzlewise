import { HashRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./theme";
import { LandingPage } from "./LandingPage";
import { HomePage } from "./HomePage";
import { CampPage } from "./CampPage";
import { LevelPage } from "./LevelPage";

export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/mountain" element={<HomePage />} />
          <Route path="/camp/:campId" element={<CampPage />} />
          <Route path="/camp/:campId/level/:levelId" element={<LevelPage />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

import { Routes, Route } from "react-router-dom";
import HomePage from "./home_page";
import MapPage from "./map_page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapPage />} />
    </Routes>
  );
}

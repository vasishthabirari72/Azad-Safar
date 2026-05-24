import './App.css'
import Navbar from './navabar.jsx'
import Footer from './footer.jsx'
import { Navigate, Route, Routes } from 'react-router-dom'
import PlaceDetails from './placeDetails.jsx'
import Home from "./home.jsx";
import Explore from "./explore.jsx";
import Search from "./search.jsx";
import TravelPlanner from "./travelPlanner.jsx"
import Contact from "./contact.jsx"
import Auth from "./auth.jsx"
import Guides from "./guides.jsx"
import GuideProfile from "./guideProfile.jsx"
import GuideDashboard from "./guideDashboard.jsx"
import Admin from "./Admin.jsx"
import AiTripPlanner from "./Aitriplanner.jsx"

// FIX: was "Navabar" (typo) — component export is named "Navbar"

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/place/:id" element={<PlaceDetails />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/search" element={<Search />} />
        <Route path="/travel-partner" element={<TravelPlanner />} />
        <Route path="/travel-planner" element={<Navigate to="/travel-partner" replace />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guide/:id" element={<GuideProfile />} />
        <Route path="/guide-dashboard" element={<GuideDashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/trip-planner" element={<AiTripPlanner />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;

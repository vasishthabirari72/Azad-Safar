import './App.css'
import Navabar from './navabar.jsx'
import Footer from './footer.jsx'
import { Navigate, Route, Routes } from 'react-router-dom'
import PlaceDetails from './placeDetails.jsx'
import Home from "./home.jsx";
import Explore from "./explore.jsx";
import Search from "./search.jsx";
import TravelPlanner from "./travelPlanner.jsx";
import Contact from "./contact.jsx";



function App() {
  return (
    <>
      <Navabar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/place/:id" element={<PlaceDetails />} />
         <Route path="/explore" element={<Explore />} />
         <Route path="/search" element={<Search />}/>
         <Route path="/travel-partner" element={<TravelPlanner />} />
         <Route path="/travel-planner" element={<Navigate to="/travel-partner" replace />} />
         <Route path="/contact" element={<Contact />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;

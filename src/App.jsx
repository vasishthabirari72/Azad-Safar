import './App.css'
import Navabar from './navabar.jsx'
import Footer from './footer.jsx'
import { Route, Routes } from 'react-router-dom'
import PlaceDetails from './placeDetails.jsx'
import Home from "./home.jsx";
import Explore from "./explore.jsx";
import Search from "./search.jsx";
import TravelPlanner from "./travelPlanner.jsx";



function App() {
  return (
    <>
      <Navabar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/place/:id" element={<PlaceDetails />} />
         <Route path="/explore" element={<Explore />} />
         <Route path="/search" element={<Search />}/>
         <Route path="/travel-planner" element={<TravelPlanner />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;

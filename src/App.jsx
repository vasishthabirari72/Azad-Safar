import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navabar from './navabar.jsx'
import HeroSection from './hero-section.jsx'
import Body from './body.jsx' 
import Footer from './footer.jsx'
import { Route, Routes } from 'react-router-dom'
import PlaceDetails from './placeDetails.jsx'
import Home from "./home.jsx";


function App() {
  return (
    <>
      <Navabar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/place/:id" element={<PlaceDetails />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;

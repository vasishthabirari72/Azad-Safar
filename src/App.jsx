import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navabar from './navabar.jsx'
import HeroSection from './hero-section.jsx'
import Body from './body.jsx' 
import Footer from './footer.jsx' 

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navabar /> 
      <HeroSection />
      <Body />
      <Footer />
     
    </>
  )
}

export default App;

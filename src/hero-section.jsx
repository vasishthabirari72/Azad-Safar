function HeroSection(){
    return(
    <section className="Hero">
            <h1>Azad Safar</h1>
            <h3>Be Azad with Azad Safar</h3>
        
     <div className="search-wrapper">
        <input
          className="search-input"
          type="text"
          placeholder="Enter place you want to travel..."
        />
        <button className="search-btn">🔍</button>
      </div>
    </section>
    )
}
export default HeroSection;
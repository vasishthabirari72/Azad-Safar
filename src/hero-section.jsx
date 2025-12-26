function HeroSection() {
  return (
    <section className="Hero">
      <h1>Azaad Safar</h1>
      <h3>Be Azaad with Azad Safar</h3>

      <div className="search-wrapper">
        <input
          className="search-input"
          type="text"
          placeholder="Search cities, states, or destinations…"
        />
        <button className="search-btn">🔍</button>
      </div>
    </section>
  );
}

export default HeroSection;

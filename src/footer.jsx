function Footer(){
    return(
    <footer className="foot">
            <h1  className="foot-head">Azaad Safar</h1>
            <div className="quickies">
                <a href="#">Home</a>
                <a href="#">Explore By Category</a>
                <a href="#">Travel patner</a>
                <a href="#">Tourist-Guide MarketPlace</a>
                <a href="#">State to travel</a>
            </div>
            <div className="Contact">
                <p> Mobile Number 📞: xxxxxxxxxx</p>
                <p>Email-Id ✉️ :azaadsafar@gmail.com</p>
                <p>Head-Quarters 📍:Mumbai</p>
            </div>
            <h2>Discover places. Meet travelers. Travel freely.</h2>
                <div className="footer-bottom">
        © {new Date().getFullYear()} Azaad Safar. All rights reserved.
            </div>           
    </footer>
    )
}
export default Footer;
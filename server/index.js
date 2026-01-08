const express=require('express');
const cors=require('cors');
port=8000;
const placesRoutes=require('./routes/places.js')
const app=express();
app.use(cors());
app.use(express.json());
app.get('/',(req,res)=>{
res.send('THE SERVER IS READY MYEEH BOIIII')
})
app.use("/api/places",placesRoutes)
app.listen(port,()=>{
    console.log(`the server is running on the ${port}`)
})
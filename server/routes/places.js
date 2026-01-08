const express = require("express");
const router = express.Router();
const fs=require('fs');
const path=require('path');



const dataPath=path.join(__dirname,"../data/places.json");
const rawData= fs.readFileSync(dataPath,"utf-8");
const places=JSON.parse(rawData).places;
router.get('/',(req,res)=>{
    res.json(places);
});
router.get('/:id',(req,res)=>{
    const id=Number(req.params.id);
    const place=places.find(p=>p.id===id);
    
if(!place){
    return res.status(404).json({message:"place not found"});
};

res.json(place);
})
module.exports=router;
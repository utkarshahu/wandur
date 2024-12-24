const { response } = require("express");
const Listing = require("../models/listing.js");
const maptilerClient = require("@maptiler/client");
const { listingSchema } = require("../schema.js");
let mapToken = process.env.MAP_TOKEN;
maptilerClient.config.apiKey = mapToken;



module.exports.index = async (req, res) => {
    const { category } = req.query;

    const allowedCategories = [
        "Trending", "Rooms", "Iconic cities", "Mountains",
        "Castles", "Amazing Pools", "Camping", "Farms", "Arctic", "Domes"
    ];

    try {
        // Validate category
        if (category && !allowedCategories.includes(category)) {
            req.flash("error", "Invalid category selected.");
            return res.redirect("/listings");
        }

        // Build query
        let query = {};
        if (category) {
            query.category = { $regex: new RegExp(category, 'i') }; // Case-insensitive match
        }

        console.log("Constructed Query:", query);

        // Fetch filtered listings
        const allListings = await Listing.find(query);

        console.log("Fetched Listings:", allListings);

        // Render the listings page with results
        res.render("listings/index.ejs", { allListings });
    } catch (error) {
        console.error("Error fetching listings:", error);
        req.flash("error", "Unable to fetch listings at the moment.");
        res.redirect("/listings");
    }
};


module.exports.renderNewForm = (req,res)=>{

    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res)=>{
    let { id } = req.params;
    const listing= await Listing.findById(id).populate({path: "reviews",populate:{path:"author"}}).populate("owner");
    if(!listing){
      req.flash("error","Listing you requested for does not exist!");
      res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing = async (req, res, next) => {
    try {
        const { category } = req.body.listing;
        
        // Ensure category is valid
        const allowedCategories = ['Trending', 'Rooms', 'Iconic cities', 'Mountains','Castles', 'Amazing pools', 'Camping', 'Farms', 'Arctic'];
        if (!allowedCategories.includes(category)) {
            req.flash("error", "Invalid category selected.");
            return res.redirect("/listings/new");
        }
  
        const query = req.body.listing.location;
  
        if (!query) {
            req.flash("error", "Location is required.");
            return res.redirect("/listings/new");
        }
  
        const result = await maptilerClient.geocoding.forward(query);
  
        if (!result || !result.features || result.features.length === 0) {
            req.flash("error", "Unable to find the location. Please refine your input.");
            return res.redirect("/listings/new");
        }
  
        if (!req.file) {
            req.flash("error", "Image upload is required.");
            return res.redirect("/listings/new");
        }
  
        const { path: url, filename } = req.file;
  
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url, filename };
        newListing.geometry = result.features[1].geometry;
  
        const savedListing = await newListing.save();
        console.log(savedListing);
  
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (error) {
        console.error("Error creating listing:", error);
        req.flash("error", "Something went wrong while creating the listing.");
        res.redirect("/listings/new");
    }
  };
  



module.exports.renderEditForm = async(req,res)=>{
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
      req.flash("error","Listing you requested for does not exist!");
      res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing = async (req,res)=>{
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing});
    
    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename};
        await listing.save();

    }
    
    req.flash("success"," Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req,res)=>{
    let { id } = req.params;
    const deleteListing = await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};
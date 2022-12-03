const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Database connection (if doesn't exists creates one)
mongoose.connect("mongodb+srv://gabojorge21:4792797@cluster0.90xwvdd.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

//Mongoose model recieves the SINGULAR form of the collection
//that automatically turns into PLURAL in the DB
const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Welcome to your ToDo list!"
});

const item2 = new Item({
  name: "Click the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

//const day = date.getDate(); day for "Today"
Item.find({}, function(error, foundItems){
  //if there are no items
  if (foundItems.length === 0){
    //insert into DB the items
    Item.insertMany(defaultItems, function(error){
      if (error){
        console.log(error);
      }else{
        console.log("Inserted!")
      }
    });
    //after inserting, redicets to home route, but
    //the next time it is not going to enter the if
    res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});

  }

});

});

app.get("/:customListName", function (req, res){
  //saves the route you enter into the browser after
  //the forward slash
  const customListName = _.capitalize(req.params.customListName);

  //find if already exists one list with the same name
  List.findOne({name: customListName}, function(error, foundList){
    if(!error){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      }else {

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });

 
});

app.post("/", function(req, res){

  //newItem & list is the name in the form in list.ejs
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(error, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(error){
      if (error){
        console.log(error)
      } else {
        console.log("Deleted!")
        res.redirect("/");
      }
    });
  }else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, function(error, foudList){
      if(!error){
        res.redirect("/" + listName);
      }
    });
  }


});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});

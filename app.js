const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const lodash = require('lodash')
require('dotenv').config()
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const port = process.env.PORT || 5000;

mongoose.connect(process.env.URL);

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to the To-Do List",
});
const item2 = new Item({
    name: "Hit the + button to add a new item.",
});
const item3 = new Item({
    name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/",function(req,res){
    Item.find({})
    .then(
        (foundItems) => {
            if (foundItems.length === 0){
                Item.insertMany(defaultItems);
                res.redirect("/");
            }
            else{
                res.render("list",{listTitle: "Today", newItems: foundItems});
            }
        })
    .catch(
        (err) => {
            console.log(err);
        });
})

app.post("/",function(req,res){
    var item = req.body.newItem;
    var listName = req.body.list;
    
    console.log(req.body);

    const newItem = new Item({
        name: item
    });

    if (listName === "Today")
    {
        newItem.save();
        res.redirect("/");
    }
    else
    {
        List.findOne({name: listName})
        .then(
            (foundList) => {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/" + listName);
            })
        .catch(
            (err) => {
                console.log(err);
            });
    }

    
})

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today")
    {
        Item.findByIdAndRemove(checkedItemId).then((doc) => {console.log(doc);}).catch((err) => {console.log(err);});
        res.redirect("/");
    }
    else
    {
        update().catch(err => console.log(err));
 
        async function update(){
            await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
            res.redirect("/" + listName);
        }
    }
    
})

app.get("/:customListName", function(req,res){
    const customListName = lodash.capitalize(req.params.customListName);

    List.findOne({name: customListName})
    .then(
        (foundList) => {
            if (!foundList)
            {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else
            {
                // Show an existing list
                res.render("list", {listTitle: foundList.name, newItems: foundList.items});
            }
        })
        .catch(
            (err) => {
                console.log(err);
            });
})

app.listen(port, "0.0.0.0", function(){
    console.log("Server is running.");
})
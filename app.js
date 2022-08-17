require("dotenv").config()
const express= require("express");
const bodyParser=require("body-parser")
const mongoose=require("mongoose");
const nodemailer=require("nodemailer");
const SMTPConnection = require("nodemailer/lib/smtp-connection");
const app=express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"gautamrocks84@gmail.com",
        pass:process.env.PASSWORD
    },
    port: 465,
    host:"smtp.gmail.com"
})

mongoose.connect("mongodb://0.0.0.0:27017/userdb").then(()=>{
  console.log("Successfully connected to database");
}).catch((e)=>{
  console.log(e);
})

const userSchema= new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: {
      type: String,
      minLength: 8
    }
  });
  


const User= mongoose.model("User",userSchema);


const productSchema= new mongoose.Schema({
    name: String,
    url: String,
    price: Number,
    quantity: Number
})

const collectionSchema= new mongoose.Schema({
    name: String,
    url: String,
    products: [productSchema]
  });
  
const Item= mongoose.model("Item",collectionSchema);

let foundLogin=1;
let message="";

let foundLoginSignup=1;
let messageSignup="";

let foundLoginForgot=1;
let messageForgot="";

let foundLoginChange=1;
let messageChange="";

let foundLoginCollection=1;
let messageCollection="";

let foundLoginProduct=1;
let messageProduct="";

app.get("/",(req,res)=>{
    res.render("Login",{found: foundLogin,alertMessage: message});
    foundLogin=1;
    message="";
})

app.get("/Logout",(req,res)=>{
    res.render("success",{successMessage: "You are successfully Logout."});
})

app.post("/Logout",(req,res)=>{
    res.redirect("/");
})

app.post("/",(req,res)=>{
    const Email= req.body.email;
    const Password= req.body.password;
    User.findOne({email: Email}).then((foundUser)=>{
      if(!foundUser){
        foundLogin=0;
        message="Email is not registered";
        res.redirect("/");
      }
      else{
        if(Password === foundUser.password){
            res.redirect(`/${foundUser.username}/collection`)       
         }
        else{
          foundLogin=0;
          message="Password is incorrect";
          res.redirect("/");
        }
      }
    }).catch((e)=>{
      console.log(e);
    })
  })

app.get("/forgot",(req,res)=>{
    res.render("Forgot",{found: foundLoginForgot,alertMessage: messageForgot});
    foundLoginForgot=1;
    messageForgot="";
})

app.post("/forgot",(req,res)=>{
    const Email= req.body.email;
    User.findOne({email: Email}).then((foundUser)=>{
      if(!foundUser){
        foundLoginForgot=0;
        messageForgot="Email is not registered";
        res.redirect("/forgot");
      }
      else{
        const mailOptions={
            from:"gautamrocks84@gmail.com",
            to:Email,
            subject:"Recover Password",
            text:`Password of your Inventory Account: ${foundUser.password}`
        }
        transporter.sendMail(mailOptions).then(()=>{
            res.render("success",{successMessage: "Password has been send to you Email."})
        }).catch((e)=>{
            console.log(e);
        })
      }
    }).catch((e)=>{
      console.log(e);
    })
  })

app.post("/change",(req,res)=>{
    const Email= req.body.email;
    const oldPassword= req.body.oldPassword;
    const newPassword= req.body.newPassword;
    User.findOne({email: Email}).then((foundUser)=>{
      if(!foundUser){
        foundLoginChange=0;
        messageChange="Email is not registered";
        res.redirect("/change");
      }
      else{
        if(oldPassword === foundUser.password){
            if(oldPassword === newPassword){
                foundLoginChange=0;
                messageChange="Old Password and New Password must be different";
                res.redirect("/change");
            }
            else{
                if(newPassword.length > 7){
                    User.findOneAndUpdate({email: Email},{$set: {password: newPassword}}).then(()=>{
                        res.render("success",{successMessage: "Password has been changed."})
                    }).catch((e)=>{
                        console.log(e);
                    })
                }
                else{
                    foundLoginChange=0;
                    messageChange="New Password must be 8 character long";
                    res.redirect("/change");
                }
            }
            
        }
        else{
            foundLoginChange=0;
            messageChange="Old Password is incorrect";
            res.redirect("/change");
        }
      }
    }).catch((e)=>{
      console.log(e);
    })
  })

app.get("/change",(req,res)=>{
    res.render("changePassword",{found: foundLoginChange,alertMessage: messageChange});
    foundLoginChange=1;
    messageChange="";
})

app.get("/:username/collection",(req,res)=>{
    const username= req.params.username;
       User.findOne({username: username}).then((found)=>{
            if(found){
                Item.find().then((foundItem)=>{
                    res.render("collection",{userName: username, Items: foundItem});
                }).catch((e)=>{
                    console.log(e)
                })
            }
        }).catch((e)=>{
            console.log(e)
        })

})

app.get("/signup",(req,res)=>{
    res.render("Signup",{found: foundLoginSignup,alertMessage: messageSignup});
    foundLoginSignup=1;
    messageSignup="";
})

app.post("/success",(req,res)=>{
    res.redirect("/");
})

app.post("/signup",(req,res)=>{
    User.findOne({username: req.body.Uname}).then((foundUser)=>{
      if(!foundUser){
        User.findOne({email: req.body.email}).then((foundemail)=>{
        if(!foundemail){
            const user= new User({
                username: req.body.Uname,
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            })
            user.save().then(()=>{
                res.render("success",{successMessage: "You have successfully registered."})
            }).catch((e)=>{
                foundLoginSignup=0;
                messageSignup="Password must be 8 character long";
                res.redirect("/signup"); 
            })
        }
        else{
            foundLoginSignup=0;
            messageSignup="Email has been already registered";
            res.redirect("/signup"); 
        }
     
      });
    }
    else{
        foundLoginSignup=0;
        messageSignup="Username is not available";
        res.redirect("/signup");
    }
    })
})

  
app.get("/:username/update-profile",(req,res)=>{
    User.findOne({username: req.params.username}).then((found)=>{
        res.render("updateProfile",{userName: found.username, name: found.name , Email: found.email})
    })
})

app.get("/:username/profile",(req,res)=>{
    User.findOne({username: req.params.username}).then((found)=>{
        res.render("Profile",{userName: found.username, name: found.name , Email: found.email})
    })
})

app.post("/:username/update-profile",(req,res)=>{
    User.findOne({email: req.body.email}).then((found)=>{
        if(!found){
            User.findOneAndUpdate({username: req.params.username},{$set: {name: req.body.name,email: req.body.email}}).then(()=>{
                res.redirect(`/${req.params.username}/collection`);
            }).catch((e)=>{
                console.log(e);
            })
        }
        else{
            if(found.email === req.body.email){
             User.findOneAndUpdate({username: req.params.username},{$set: {name: req.body.name}}).then(()=>{
                res.redirect(`/${req.params.username}/collection`);
            }).catch((e)=>{
                console.log(e);
            })
         }
        }
    })
})

app.get("/:username/create-collection",(req,res)=>{
    const username= req.params.username
    res.render("createCollection",{userName: username,found:foundLoginCollection,alertMessage:messageCollection});
    foundLoginCollection=1;
    messageCollection="";
})

app.post("/:username/create-collection",(req,res)=>{
   Item.findOne({name: req.body.cname}).then((found)=>{
     if(!found){
        const item= new Item({
            name: req.body.cname,
            url: req.body.url,
            products: []
        })
        item.save();
        res.redirect(`/${req.params.username}/collection`);
     }
     else{
        foundLoginCollection=0;
        messageCollection="Collection of this name is already exist";
        res.redirect(`/${req.params.username}/create-collection`);
     }
   }).catch((e)=>{
    console.log(e);
   })
})

app.get("/:username/create-product",(req,res)=>{
    const username= req.params.username
    res.render("createProduct",{userName: username,found:foundLoginProduct,alertMessage:messageProduct});
    foundLoginProduct=1;
    messageProduct="";
})

app.post("/:username/create-product",(req,res)=>{
    Item.findOne({name: req.body.cname}).then((found)=>{
        if(!found){
            foundLoginProduct=0;
            messageProduct="Collection does not exist";
            res.redirect(`/${req.params.username}/create-product`);
        }
        else{
            let count=0;
            found.products.forEach(Element =>{
                if(Element.name === req.body.pname){
                    count=1;
                }
            })
            if(count === 0){
                const product= {
                    name: req.body.pname,
                    url: req.body.url,
                    price: req.body.price,
                    quantity: req.body.quantity
                }
                found.products.push(product);
                found.save();
                res.redirect(`/${req.params.username}/collection`);
            }
            else{
                foundLoginProduct=0;
                messageProduct="Product of this name is already exist";
                res.redirect(`/${req.params.username}/create-product`);
            }
        }
      }).catch((e)=>{
       console.log(e);
      })
})

app.get("/:username/:collection/delete",(req,res)=>{
    Item.findOneAndRemove({name: req.params.collection}).then(()=>{
        res.redirect(`/${req.params.username}/collection`);
    }).catch((e)=>{
        console.log(e);
    });
})

app.get("/:username/:collection/product",(req,res)=>{
    Item.findOne({name: req.params.collection}).then((found)=>{
        const username= req.params.username;
        res.render("Products",{userName: username, Items: found.products,collection: req.params.collection});
    }).catch((e)=>{
        console.log(e);
    })
})

app.get("/:username/:collection/:product/delete",(req,res)=>{
    Item.findOneAndUpdate({name: req.params.collection},{$pull: {products: {name: req.params.product}}}).then(()=>{
        res.redirect(`/${req.params.username}/${req.params.collection}/product`);
    }).catch((e)=>{
        console.log(e);
    });
})

app.get("/:username/:collection/update-collection",(req,res)=>{
    Item.findOne({name: req.params.collection}).then((found)=>{
        res.render("updateCollections",{userName: req.params.username,collectionName: found.name,collectionUrl: found.url});
    }).catch((e)=>{
        console.log(e);
    })
})

app.post("/:username/:collection/update-collection",(req,res)=>{
    Item.findOneAndUpdate({name: req.params.collection},{$set: {url: req.body.url}}).then((found)=>{
        res.redirect(`/${req.params.username}/collection`);
    }).catch((e)=>{
        console.log(e);
    })
})

app.get("/:username/:collection/:product/update",(req,res)=>{
    Item.findOne({name: req.params.collection}).then((found)=>{
        found.products.forEach(element=>{
            if(element.name===req.params.product){
             res.render("updateProduct",{userName: req.params.username,productName: element.name,Url: element.url,price:element.price, quantity: element.quantity, collection: req.params.collection});
            }
        })
    }).catch((e)=>{
        console.log(e);
    })
})

app.post("/:username/:collection/:product/update",(req,res)=>{
    Item.findOneAndUpdate({name: req.params.collection},{$pull: {products: {name: req.params.product}}}).then((found)=>{
        const product= {
            name: req.body.pname,
            url: req.body.url,
            price: req.body.price,
            quantity: req.body.quantity
        }
        found.products.push(product);
        found.save().then(()=>{
            res.redirect(`/${req.params.username}/collection`);
        });
    }).catch((e)=>{
        console.log(e);
    });
})

app.listen(process.env.PORT || 3000,()=>{
    console.log("Server has started");
})


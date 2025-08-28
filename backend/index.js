const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
require("dotenv").config();


app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGODB_URI);

// Root API
app.get("/", (req, res) => {
  res.send("Express App is Running")
})

// Image Storage Engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({ storage: storage })

// Static images path
app.use('/images', express.static('upload/images'))

// Upload API
app.post("/upload", upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: 0,
      message: "No file uploaded"
    });
  }
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
  });
});

// Product Schema
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true }
})

// Delete product
app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({ success: true, name: req.body.name })
})

// Add product
app.post('/addproduct', async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product = products[products.length - 1];
    id = last_product.id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  await product.save();
  res.json({ success: true, name: req.body.name })
})

// Get all products
app.get('/allproducts', async (req, res) => {
  let products = await Product.find({});
  console.log("All Products Fetched");
  res.send(products);
})

// User Schema
const Users = mongoose.model('Users', {
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: { type: Object },
  date: { type: Date, default: Date.now }
})

// Signup
app.post('/signup', async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, errors: "existing user found with same emailID" })
  }

  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[String(i)] = 0;   // ✅ always string keys
  }

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  })

  await user.save();

  const data = { user: { id: user.id } }
  const token = jwt.sign(data, 'secret_ecom');
  res.json({ success: true, token })
})

// Login
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = { user: { id: user.id } }
      const token = jwt.sign(data, 'secret_ecom')
      res.json({ success: true, token });
    } else {
      res.json({ success: false, errors: "Wrong Password" });
    }
  } else {
    res.json({ success: false, errors: "Wrong Email Id" })
  }
})

// New collection
app.get('/newcollection', async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("NewCollection Fetched");
  res.send(newcollection);
});

// Middleware for auth
const fetchUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).send({ errors: "Invalid token" });
  }
};

// Popular women
app.get('/popularinwomen', async (req, res) => {
  let products = await Product.find({ category: "women" });
  let popular_in_women = products.slice(0, 4);
  console.log("Popular in women fetched");
  res.send(popular_in_women);
});

// Add to Cart
app.post('/addtocart', fetchUser, async (req, res) => {
  try {
    const itemId = String(req.body.itemId);  // ✅ force string
    console.log("Adding:", itemId);

    let userData = await Users.findOne({ _id: req.user.id });
    if (!userData) return res.status(404).json({ success: false, message: "User not found" });

    userData.cartData[itemId] += 1;
    await userData.save();

    return res.json({ success: true, cartData: userData.cartData });
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
})

// Remove from Cart
app.post('/removefromcart', fetchUser, async (req, res) => {
  try {
    const itemId = String(req.body.itemId);  // ✅ force string
    console.log("Removing:", itemId);

    let userData = await Users.findOne({ _id: req.user.id });
    if (!userData) return res.status(404).json({ success: false, message: "User not found" });

    if (userData.cartData[itemId] > 0) {
      userData.cartData[itemId] -= 1;
    }

    await userData.save();
    return res.json({ success: true, cartData: userData.cartData });
  } catch (error) {
    console.error("Remove from Cart Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get Cart
app.post('/getcart', fetchUser, async (req, res) => {
  try {
    let userData = await Users.findOne({ _id: req.user.id });
    if (!userData) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, cartData: userData.cartData });
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(port, (error) => {
  if (!error) {
    console.log("Server running on port " + port)
  } else {
    console.log("Error : " + error)
  }
})

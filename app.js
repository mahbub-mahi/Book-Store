const path = require("path");
const express = require("express");
const app = express();

const mongoose = require("mongoose");
const dotEnv = require("dotenv").config({ path: __dirname + "/config/.env" });
const expressLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");
const router = require("./routes/index");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
// Passport Config
require("./config/pasport")(passport);

//EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

//connect mongDB
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  console.log("mongoDB Connected")
);

// Express body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Static folder
app.use(express.static(path.join(__dirname, "public")));

//routes
app.use("/", router);

//connection
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`server is running on ${port}`));

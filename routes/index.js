const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Book = require("../models/Book");
const passport = require("passport");

const { ensureAuthenticated, forwardAuthenticated } = require("../config/auth");

router.get("/", forwardAuthenticated, (req, res) => {
  res.render("home");
});
router.get("/login", forwardAuthenticated, (req, res) => {
  res.render("login");
});
router.get("/registration", forwardAuthenticated, (req, res) => {
  res.render("registration");
});

router.get("/main", ensureAuthenticated, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user.id }).lean();
    res.render("book/main", {
      name: req.user.name,
      books: books,
    });
  } catch (err) {
    console.log(err);
  }
});
router.post("/registration", (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];
  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("registration", {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        errors.push({ msg: "Email already exists" });
        res.render("registration", {
          errors,
          name,
          email,
          password,
          password2,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                req.flash(
                  "success_msg",
                  "You are now registered and can log in"
                );
                res.redirect("login");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/main",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("login");
});
module.exports = router;

router.get("/addBook", ensureAuthenticated, (req, res) => {
  res.render("book/addBook");
});
router.post("/main", ensureAuthenticated, async (req, res) => {
  try {
    req.body.user = req.user.id;
    await Book.create(req.body);
    res.redirect("/main");
  } catch (err) {
    console.log(err);
  }
});
router.get("/editBook/:id", ensureAuthenticated, (req, res) => {
  const id = req.params.id;
  Book.findById(id).then((result) => {
    res.render("book/editBook", {
      blog: result,
      title: result.title,
      author: result.author,
    });
  });
});
router.post("/main/editBook", ensureAuthenticated, async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.user.id);

    req.body.user = req.user.id;
    await Book.update(req.body);
    res.redirect("/main");
  } catch (err) {
    console.log(err);
  }
});

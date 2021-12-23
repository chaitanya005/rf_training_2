var express = require('express');
var router = express.Router();
const db = require('../config/dbConfig')
const passport = require('passport');
const bcrypt = require('bcrypt');


const intializePassport = require('../config/passport-config');

intializePassport(passport);


function addUser(db, newUser) {
  console.log(newUser)
  return db
    .insert(newUser)
    .into("users")
    .then(rows => {
      return rows[0];
    });
}


router.get('/', function(req, res, next) {
  res.render('login')
});

router.get('/login', function(req, res) {
  res.render('login')
})

router.get('/home', function(req, res, next) {
  res.render('home');
});

router.get('/issues/new', function(req, res, next) {
  res.render('newIssue');
});

router.route('/login')
  .get(async function(req, res) {
    res.render('login')
  })
  .post(passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
    }));

router.get('/logout', function(req, res) {
  req.logOut();
  res.redirect('/login')
});

router.get('/signup', function(req, res) {
  res.render('signup')
})

router.post('/signup', async(req, res)=> {
  try {
    console.log(req.body)
    const { email, password, full_name, user_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await addUser(db, { email, password: hashedPassword, name: full_name, username: user_name });
    res.redirect('/login');
  }
  catch (err) {
    console.log(err);
    res.redirect('/signup');
  }
})

module.exports = router;

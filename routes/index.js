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

function addIssue(db, newIssue) {
  console.log(newIssue)
  return db
    .insert(newIssue)
    .into("issues")
    .then(rows => {
      return rows[0];
    });
}

function addComment(db, newComment) {
  console.log(newComment)
  return db
    .insert(newComment)
    .into("comments")
    .then(rows => {
      return rows[0];
    });
}

function addLabel(db, newLabel) {
  console.log(newLabel)
  return db
    .insert(newLabel)
    .into("labels")
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

router.get('/home', async(req, res) => {
  // const issues = await db('issues').select('id', 'title', 'label_id', 'posted_by', 'issue_status').orderBy('id', 'desc')
  const issues = await db('issues')
  .leftJoin('labels', 'issues.label_id', 'labels.id')
  .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.color_code as bgColor')
  // console.log(issues)
  res.render('home', {issues});
});

router.get('/issues/new', async(req, res) => {
  const labels = await db('labels').select('id', 'name', 'description', 'color_code')
  res.render('newIssue', {labels});
});

router.get('/issues/:id', async (req, res) => {
  const issue = await db('issues')
  .leftJoin('comments', 'issues.id', 'comments.issue_id')
  .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'comments.comment AS comments', 'comments.posted_by AS user_posted_by')
  .where({'issues.id': req.params.id})

  // const issue = await db('issues').select('id', 'title', 'comment', 'posted_by', 'issue_status')
  
  console.log(issue)


  res.render('issue', {issue})
})

router.get('/labels', async(req, res) => {
  const labels = await db('labels').select('id', 'name', 'description', 'color_code')
  // console.log(labels)
  res.render('labels', {labels})
})

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


router.post('/create-issue', async(req, res) => {
  try {
    console.log(req.body)
    const { title, editor, label } = req.body;
    const issue = await addIssue(db, { title, comment: editor, posted_by: req.user.username, issue_status: 'open', label_id: label })
    
    // addIssue(db, { title, posted_by: 'First user', issue_status: 'open', label_id: label })
    // .then(res => {
    //   addComment(db, { comment: editor, posted_by: 'First user', issue_id: res});
    // })
    // await addComment(db, { comment: editor, posted_by: req.user.username, issue_id: issue_id});
    res.redirect('/home');
  }
  catch (err) {
    console.log(err);
  }
})

router.post('/create-comment', async(req, res) => {
  try {
    console.log(req.body)
    const { issue_id, editor } = req.body;
    const issue = await addComment(db, { comment: editor, posted_by: req.user.username, issue_id: issue_id, label_id: 0});
    res.redirect('/home')
  }
  catch (err) {
    console.log(err);
  }
})



router.post('/create-label', async(req, res) => {
  console.log(req.body)
  try {
    console.log(req.body)
    const { label_name, description, color_code } = req.body;
    const issue = await addLabel(db, { name: label_name, description, color_code});
    res.redirect('/labels')
  }
  catch (err) {
    console.log(err);
  }
})

module.exports = router;

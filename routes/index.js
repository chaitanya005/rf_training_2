var express = require('express');
var router = express.Router();
const db = require('../config/dbConfig')
const passport = require('passport');
const bcrypt = require('bcrypt');


const intializePassport = require('../config/passport-config');

intializePassport(passport);


function addUser(db, newUser) {
  return db
    .insert(newUser)
    .into("users")
    .then(rows => {
      return rows[0];
    });
}

function addIssue(db, newIssue) {
  return db
    .insert(newIssue)
    .into("issues")
    .then(rows => {
      return rows[0];
    });
}

function addComment(db, newComment) {
  return db
    .insert(newComment)
    .into("comments")
    .then(rows => {
      return rows[0];
    });
}

function addLabel(db, newLabel) {
  return db
    .insert(newLabel)
    .into("labels")
    .then(rows => {
      return rows[0];
    });
}

function updateLabel(db, updateLabel) {
  return db
    .update('label_id', updateLabel.label_id)
    .where('id', updateLabel.issue_id)
    .into("issues")
    .then(rows => {
      return rows[0];
    }); 
}

function updateAssignee(db, updateAssignee) {
  return db
    .update('assignee_id', updateAssignee.assignee_id)
    .where('id', updateAssignee.issue_id)
    .into("issues")
    .then(rows => {
      return rows[0];
    }); 
}

router.get('/', function(req, res, next) {
  if (req.isAuthenticated()) {
    res.render('home')
  } else {
    res.redirect('/login')
  }
});

router.get('/home', async(req, res) => {
  if (req.isAuthenticated()) {
    const issues = await db('issues')
    .leftJoin('labels', 'issues.label_id', 'labels.id')
    .leftJoin('users', 'issues.assignee_id', 'users.id')
    .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.bg_color as bgColor', 'users.username as assignee', 'labels.font_color as fontColor')
    const users = await db('users').select('id', 'username')
    const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
    res.render('home', {issues, labels, users});
  } else {
    res.redirect('/login')
  }
});

router.get('/issues/new', async(req, res) => {
  if (req.isAuthenticated()) {
    const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
    const users = await db('users').select('id', 'username')
    res.render('newIssue', {labels, users});
  } else {
    res.redirect('/login')
  }
});

router.get('/issues/:id', async (req, res) => {
  if (req.isAuthenticated()){
    const issue = await db('issues')
    .leftJoin('comments', 'issues.id', 'comments.issue_id')
    .leftJoin('labels', 'issues.label_id', 'labels.id')
    .leftJoin('users', 'issues.assignee_id', 'users.id')
    .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'comments.comment AS comments', 'comments.posted_by AS user_posted_by', 'labels.name as label_name', 'labels.bg_color as label_bgColor', 'labels.font_color as label_fontColor', 'users.username as assignee')
    .where({'issues.id': req.params.id})
    const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
    const users = await db('users').select('id', 'username')
    res.render('issue', {issue, labels, users})
  } else {
    res.redirect('/login')
  }
})

router.get('/labels', async(req, res) => {
  if (req.isAuthenticated()) {
    const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
    res.render('labels', {labels})
  } else {
    res.redirect('/login')
  }
})

router.route('/login')
  .get(async function(req, res) {
    if (!req.isAuthenticated()) {
      res.render('login')
    } else {
      res.redirect('/home')
    }
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
  if (!req.isAuthenticated()) {
    res.render('signup')
  } else {
    res.redirect('/home')
  }
})

router.post('/signup', async(req, res)=> {
  try {
    const { email, password, full_name, user_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await addUser(db, { email, password: hashedPassword, name: full_name, username: user_name });
    res.redirect('/login');
  }
  catch (err) {
    res.redirect('/signup');
  }
})


router.post('/create-issue', async(req, res) => {
  try {
    
    const { title, editor, label, assignee } = req.body;
    const issue = await addIssue(db, { title, comment: editor, posted_by: req.user.username, issue_status: 'open', label_id: label, assignee_id: assignee })
    
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
    const { issue_id, editor } = req.body;
    const issue = await addComment(db, { comment: editor, posted_by: req.user.username, issue_id: issue_id, label_id: 0});
    res.redirect(`/issues/${issue_id}`)
  }
  catch (err) {
    console.log(err);
  }
})

router.post('/update-label', async(req, res) => {
  try {
    const { label, issue_id } = req.body;
    await updateLabel(db, {label_id: label, issue_id: issue_id})
    res.redirect(`/issues/${issue_id}`)
  }
  catch (err) {
    console.log(err);
  }
})

router.post('/update-assignee', async(req, res) => {
  try {
    const { assignee, issue_id } = req.body;
    await updateAssignee(db, {assignee_id: assignee, issue_id: issue_id})
    res.redirect(`/issues/${issue_id}`)
  }
  catch (err) {
    console.log(err);
  }
})


router.post('/create-label', async(req, res) => {
  try {
    const { label_name, description, color_code } = req.body;
    let r = color_code.substring(1, 3);
    let g = color_code.substring(3, 5);
    let b = color_code.substring(5, 7);
    let nThreshold = 105;
    let bgDelta = (parseInt(r, 16) * 0.299) + (parseInt(g, 16)* 0.587) + (parseInt(b, 16) * 0.114);
    let font_color =  (255 - bgDelta < nThreshold) ? "#000000" : "#ffffff";
    const issue = await addLabel(db, { name: label_name, description, bg_color: color_code, font_color: font_color});
    res.redirect('/labels')
  }
  catch (err) {
    console.log(err);
  }
})


router.get('/home/search', async(req, res) => {
  try {
    let filterdIssues;
    if (req.query.label_id) {
      const { label_id } = req.query;
      filterdIssues = await db('issues')
      .leftJoin('labels', 'issues.label_id', 'labels.id')
      .leftJoin('users', 'issues.assignee_id', 'users.id')
      .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.bg_color as bgColor', 'users.username as assignee')
      .where({'issues.label_id': label_id})
      
    } else {
      filterdIssues = await db('issues')
      .leftJoin('labels', 'issues.label_id', 'labels.id')
      .leftJoin('users', 'issues.assignee_id', 'users.id')
      .select('issues.id', 'issues.title', 'issues.comment', 'issues.posted_by', 'issues.issue_status', 'labels.name as label', 'labels.bg_Color as bgColor', 'users.username as assignee')
      .where({'issues.assignee_id': req.query.assignee_id})
    }

    const labels = await db('labels').select('id', 'name', 'description', 'bg_color', 'font_color')
    const users = await db('users').select('id', 'username')
    res.render('home', {filterdIssues, labels, users})
  }
  catch (err) {
    console.log(err);
  }
  
})

module.exports = router;

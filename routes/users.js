const Router = require('express').Router;
const User = require('../models/user');
const {ensureLoggedIn, ensureCorrectUser} = require('../middleware/auth');
const ExpressError = require("../expressError");
const router = new Router();


// GET / => get list of users
// => { users : [{username, first_name, last_name, phone}, ...] }
// Must send token from login with req.body: "_token" : " ... "
router.get('/', ensureLoggedIn, async function (req, res, next) {
    try {
        const users = await User.all();
        return res.json({users});
    } catch (error) {
        return next(error);
    }
})

// GET /:username -- get detail of user
// => { user : {username, first_name, last_name, phone, join_at, last_logic_at}}
router.get('/:username', ensureCorrectUser, async function (req, res, next) {
    try {
        const username = req.params.username;
        const user = await User.get(username);
        return res.json({ username });
    } catch (error) {
        return next(error);
    }
})


// GET /:username/to - get messages to user => {messages: [{id, body, sent_at, read_at, from_user: { username, first_name, last_name, phone }}, ... ]}
router.get('/:username/to', ensureCorrectUser, async function (req, res, next) {
    try {
        const username = req.params.username;
        const msgs = await User.messagesTo(username);
        return res.json({msgs});
    } catch (error) {
        return next(error);
    }
})

// GET /:username/from - get messages from user => {messages : [{id, body, sent_at, read_at, to_user: {username, first_name, last_name, phone}}, ...]}
router.get('/:username/from', ensureCorrectUser, async function (req, res, next) {
    try {
        const username = req.params.username;
        const msgs = await User.messagesFrom(username);
        return res.json({msgs});
    } catch (error) {
        return next(error);
    }
})

module.exports = router;

const Router = require('express').Router;
const router = new Router();
const {ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const Message = require('../models/message');
const ExpressError = require("../expressError");


// GET /:id - get detail of message
// {message: {id, body, sent_at, read_at, 
// from_user: 
//  {username, first_name, last_name, phone}, 
// to_user: 
//  {username, first_name, last_name, phone}
// }}
// ***Make sure the currently-logged-in users is either the to or from user
router.get('/:id', ensureLoggedIn, async function (req, res, next) {
    try {
        const id = req.params.id;
        const msg = await Message.get(id);
        const username = req.user.username;

        if (msg.to_user.username !== username || msg.from_user.username !== username) {
            throw new ExpressError('You are not authorized to view that message!', 401);
        }

        return res.json({message : msg});
    } catch (error) {
        return next(error);
    }
})


// POST / - post a new message
// {to_username, body} => {message: {id, from_username, to_username, body, sent_at}}
router.post('/', ensureLoggedIn, async function (req, res, next) {
    try {
        const from_username = req.user.username;
        const {to_username, body} = req.body;
        const msg = Message.create(from_username, to_username, body);

        return res.json({message : msg});
    } catch (error) {
        return next(error);
    }
})



// POST /:id/read - mark message as read:
// => {message: {id, read_at}}
// Make sure that only the intended recipient can mark as read
router.post('/:id/read', ensureLoggedIn, async function (req, res, next) {
    try {
        const username = req.user.username;
        const msgId = req.params.id;
        const msg = await Message.get(msgId);

        if (msg.to_username !== username) {
            throw new ExpressError('You are not authorized to read that message!', 401);
        }

        const message = await Message.markRead(msgId);

        return res.json({message : message });
    } catch (error) {

    }
})


module.exports = router;
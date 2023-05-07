
const jwt = require('jsonwebtoken');
const Router = require('express').Router;
const router = new Router();

const User = require('../models/user');
const { SECRET_KEY } = require('../config');
const ExpressError = require("../expressError");

// POST /login -- login: {username, password} => {token}
// Update their last-lagin!
router.post('/login', async function (req, res, next) {
    try {
        const {username, password} = req.body;
        if (!username || !password) {
            throw new ExpressError("Username and password required!", 400);
        }

        if (await User.authenticate(username, password)) {
            const token = jwt.sign({username}, SECRET_KEY);
            User.updateLoginTimestamp(username);
            return res.json({ token });
        }
    } catch (err) {
        return next(err);
    }
})

// POST /register -- register user: registers, logs in, and returns token
// {username, password, first_name, last_name, phone} => {token}
// Update their last-login!
router.post('/register', async function (req, res, next) {
    try {
        let { username } = await User.register(req.body);
        const token = jwt.sign({username}, SECRET_KEY);
        await User.updateLoginTimestamp(username);
        return res.json({token});
    } catch (err) {
        return next(err);
    }
})

module.exports = router;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const passport = require('passport');
const passportJWT = require('passport-jwt');
const jwt = require('jsonwebtoken');
const userService = require('./user-service');

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const HTTP_PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Configure JWT Strategy
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (jwt_payload, done) => {
      try {
        return done(null, jwt_payload); // jwt_payload will have _id and userName
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Route: Register
app.post('/api/user/register', async (req, res) => {
  try {
    await userService.registerUser(req.body);
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

// Route: Login
app.post('/api/user/login', async (req, res) => {
  try {
    const user = await userService.checkUser(req.body.userName, req.body.password);
    const payload = {
      _id: user._id,
      userName: user.userName,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(401).json({ message: err });
  }
});

// Route: Get Favourites
app.get('/api/user/favourites', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const favourites = await userService.getFavourites(req.user.userName);
    res.json(favourites);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Route: Add to Favourites
app.put('/api/user/favourites/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const result = await userService.addFavourite(req.user.userName, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Route: Remove from Favourites
app.delete('/api/user/favourites/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const result = await userService.removeFavourite(req.user.userName, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Route: Get History
app.get('/api/user/history', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const history = await userService.getHistory(req.user.userName);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Route: Add to History
app.put('/api/user/history/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const result = await userService.addHistory(req.user.userName, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Route: Remove from History
app.delete('/api/user/history/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const result = await userService.removeHistory(req.user.userName, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

// Start Server
userService.connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`API listening on: http://localhost:${HTTP_PORT}`);
    });
  })
  .catch(err => {
    console.log(err);
  });

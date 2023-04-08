const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
require('dotenv').config();

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');

const postgresDB = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});


postgresDB
  .raw('SELECT 1')
  .then(() => {
    console.log('Successfully connected to Postgres database');
  })
  .catch((error) => {
    console.error('Failed to connect to Postgres database:', error);
  });

const app = express();
app.use(express.json()); //middleware to parse the body response to json
app.use(cors());

//checks email and password at the signin url, compares it to the database
app.post('/signin', (req, res) => {
  signin.handleSignin(req, res, postgresDB, bcrypt);
});

//saves the new information to the database
app.post('/register', (req, res) => {
  register.handleRegister(req, res, postgresDB, bcrypt);
});

//shows the profile of the user, based on the id
app.get('/profile/:id', (req, res) => {
  profile.handleProfileGet(req, res, postgresDB);
});

//updates the name and email of the user, based on the id
app.put('/updateProfile/:id', (req, res) => {
  profile.handleProfileUpdate(req, res, postgresDB, bcrypt);
});

//deletes the user from the database
app.delete('/deleteProfile/:id', (req, res) => {
  profile.handleProfileDelete(req, res, postgresDB);
});

//when an image url is used, it sums it to the user entries counter, using the user id to know who it is
app.put('/image', (req, res) => {
  image.handleImage(req, res, postgresDB);
});

//calls the clarifai API to detect the faces on an image
app.post('/imageurl', (req, res) => {
  image.handleApiCall(req, res);
});

app.listen(3001, () => {
  console.log('Server has started on port 3001');
});

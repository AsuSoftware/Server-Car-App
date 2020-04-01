'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');
const jwt = require('jsonwebtoken');

const database = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'asuantonio',
    password : 'parolanoua',
    database : 'carsapp'
  }
});

database.select('*').from('users').then(data => {
  // console.log(data);
}) // Ritorna una promise

const app = express();

const PORT = process.env.PORT || 5000

app.use(cors());

//
app.use(bodyParser.json({limit: '50mb', extended: true}))

//
app.get('/', (req, res) => {  // Funzione middleware
  res.send('Welcome to the Car App server. Now I listen your action...');
})


// // Login
app.post('/singin', (req, res) => {
  //
  console.log(req.body);
  database.select('email', 'hash').from('users')
  .where('email', '=', req.body.email)
  .then(data => {
    const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
    if(isValid) {
      return database.select('*').from('users')
             .where('email', '=', req.body.email)
             .then(users => {
               const user = users[0]
               console.log(user);
               // console.log(user);
               jwt.sign({email: user.email, id: user.id}, 'secretkey', (err, token) => {
                 user.profile_img = Buffer.from(user.profile_img, 'hex').toString('base64');
                 res.json({
                   token,   // Imi da tokenu(pentru userul respectiv)
                   userId: user.id,
                   profilePhoto: user.profile_img,
                   name: user.first_name + user.last_name
                 });
               });

         })
      .catch(err => res.status(400).json('Unable to get user'))
    } else {
      res.status(400).json('wrong credentials')
    }
  })
  .catch(err => res.status(400).json('Wrong credentials'))

})







app.post('/registration', (req, res) => {
const { email, profile_img, first_name, last_name, password } = req.body;
//

let buff = Buffer.from(profile_img, 'base64');
let text = buff.toString('hex');

// console.log('"' + profile_img + '" converted from Base64 to ASCII is "' + text + '"');
//
// console.log(req.body);
const hash = bcrypt.hashSync(password);

     database('users')
     .returning('*')
     .insert({
       email: email,
       first_name: first_name,
       hash: hash,
       last_name: last_name,
       profile_img: text
     }).then(user =>  {

       // console.log(u);
       res.sendStatus(200).json('It is good');
     })
     .catch(err => res.status(400).json('Unable to register'))
})
 //     database.transaction(trx => {
 //         trx.insert({
 //         hash: hash,
 //         email: email
 //      })
 //        .into('users')
 //        .returning('email')
 //        .then(loginEmail => {
 //
 //      return trx('users')
 //            .returning('*')
 //            .insert({
 //             profile_img: profile_img,
 //             first_name: first_name,
 //             last_name: last_name,
 //             email: loginEmail[0]
 //
 //     })
 //     .then(user => {
 //         res.json(user[0]);
 //      })
 //   })
 //     .then(trx.commit)
 //     .catch(trx.rollback)
 // })






// app.post('/profile:id', (req, res) => {
//
//   jwt.verify(req.token, 'secretkey', (err, authData) => {
//     if(err) {
//       res.sendStatus(403);
//     } else {
//       res.json({
//         message: 'Post created',
//         authData
//       })
//     }
//   })
//
//



app.get('/profile/:id', verifyToken, (req, res) => {
  console.log('ceva');
  console.log(req.token);
  jwt.verify(req.token, 'secretkey', (err, authData) => {
    if(err) {
      res.sendStatus(403);
      console.log(err);
    } else {
      const id = req.params.id;
      console.log(id);
      database.select('*').from('users').where({
           id: id
        }).then(user => {
          if(user.length) {
            console.log(user);
            res.json(user[0])
          }
      })
      .catch(err => res.status(400).json('Error getting user'))
      }
      // res.json({
      //   // message: 'Post created',
      //   // authData
      // });

  });
});

// FORMAT OF TOKEN
// Authorization: Bearer <access_token>

// // Verify Token
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;
    // Next middleware
    next();
  } else {
    // Forbidden
    res.sendStatus(403);
  }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listen on PORT: ${PORT}`)
});

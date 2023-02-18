const saltRounds = 10;
let oldEmail = '';

const handleProfileGet = (req, res, postgresDB) => {
    const { id } = req.params;

    postgresDB.select('*').from('users').where({id})
      .then(user => {
        if (user.length) {
          oldEmail = user[0].email;
          res.json(user[0])
        } else {
          res.status(400).json('Not found')
        }
      })
      .catch(err => res.status(400).json('Error getting user'))
  }

const handleProfileUpdate = (req, res, postgresDB, bcrypt) => {
  const { id } = req.params;
  const { name, email, password } =req.body;
  const updateObject = {};

  // Check if name is provided in the input data and add it to the update object for the users table
  if (name !== undefined) {
    updateObject.name = name;
  }

  // Check if email is provided in the input data and add it to the update object for both the users and login table
  if (email !== undefined) {
    updateObject.email = email;

    // Use a transaction to ensure that the email is updated atomically in both the users and login table
    return postgresDB.transaction((trx) => {
      // Update the email in the users table
      return trx('users')
        .where('id', id)
        .update({ email: email })
        .then(() => {
          // Update the email in the login table
          return trx('login')
            .where('email', oldEmail)
            .update({ email: email });
        });
    })
    .then(() => {
      // If email update successful, update the user object and return it as a JSON response
      return postgresDB('users')
        .where('id', id)
        .returning('*')
        .then((user) => {
          res.json(user[0])
        })
      })
      .catch(() => {
        res.status(400).json('Error updating user')
      });
  }

  // Check if password is provided in the input data and add it to the update object for the login table
  if (password !== undefined) {
    updateObject.hash = bcrypt.hashSync(password, saltRounds);

    // If password is provided, update the hash in the login table
    return postgresDB('login')
      .where('email', oldEmail)
      .update({ hash: updateObject.hash })
      .catch(() => {
        res.status(400).json('Error updating user')
      });
  }

  // If no email or password update needed, update the user object and return it as a JSON response
  return postgresDB('users')
    .where('id', id)
    .update(updateObject)
    .returning('*')
    .then(user => {
      res.json(user[0])
    })
    .catch(() => {
      res.status(400).json('Error updating user')
    });
};

const handleProfileDelete = (req, res, postgresDB) => {
  const { email } = req.body;
  
  postgresDB.transaction((trx) => {
    return trx('login')
      .where('email', email)
      .del()
      .then(() => {
        return trx('users')
          .where('email', email)
          .del();
      });
  })
  .then(() => {
    res.status(200).json('User Deleted Successfully');
  })
  .catch((err) => {
    res.status(400).json('Error Deleting User')
    console.log(err);
  })
}

module.exports = {
    handleProfileGet,
    handleProfileUpdate,
    handleProfileDelete
}
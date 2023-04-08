const saltRounds = 10;

const handleRegister = (req, res, postgresDB, bcrypt) => {
    const { name, email, password} = req.body;

    if(!email || !name || !password){
        return res.status(400).json('Incorrect form submission');
    }

    //create a hash with the password given
    bcrypt.hash(password, saltRounds, function(err, hash) {
        //use transaction to insert hash into login table with email(primary key in this table)
        //then insert name, date and email(foreing key to relate to login table) into users 
        postgresDB.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0].email,
                        name: name,
                        joined: new Date()
                    })
                    .then(user => {
                        res.json(user[0]); //response with the user information
                    })
                .then(trx.commit)//if everything above goes well, save all into tables
                .catch(trx.rollback)//if there is an error, keep the database as before the changes
            })
            .catch(err => res.status(400).json('Unable to register'))
        })
    });
}

module.exports = {
    handleRegister
};
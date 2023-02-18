const handleSignin = (req, res, postgresDB, bcrypt) => {
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(400).json('Incorrect form submission');
    }

    postgresDB.select('email', 'hash').from('login')
        .where('email', '=', email)
            .then(data => {
                bcrypt.compare(password, data[0].hash, function(err, result) {
                    if(result){
                        return postgresDB.select('*').from('users')
                            .where('email', '=', email)
                            .then(user => {
                                res.json(user[0])
                            })
                            .catch(err => res.json('Unable to get user'))
                    } else
                        res.status(400).json('Wrong user or password')
                });
            })
            .catch(err => res.status(400).json('Wrong user or password'))
}

module.exports = {
    handleSignin
};
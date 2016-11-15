const bcrypt		= require('bcrypt')

let db 	= require(__dirname+'/../modules/db.js')
let app = require(__dirname+'/../modules/express.js')

app.get('/signin', (req, res) => {
	res.render('signin', {message: req.query.message})
})

app.get('/logout', (req, res) => {
	req.session.destroy( error => {
		if (error) throw error
		res.redirect('/signin')
	})
})

app.post('/signin', (req, res) => {
	let signin = req.body.signin
	if (signin.username.length === 0 || signin.password.length === 0) {
		res.render('signin', {error: 'Please fill out all fields.'})
		return
	}

	// Search db for matching user
	db.User.findOne({
		where: {
			username: signin.username
		}
	}).then( user => {
		if (user === null) {
			// Failed sign in -> error message
			res.render('signin', {error: 'Invalid username or password!'})
			return
		}
		bcrypt.compare(signin.password, user.password, (err, result) => {
			if (err) {
				res.render('signin', {error: 'Invalid username or password!'})
				return
			}
			if (result){
				// Set session and render index
				req.session.user = {id:user.id, username:user.username, email:user.email}
				res.redirect('/')
			} else {
				res.render('signin', {error: 'Invalid username or password!'})
				return
			}		
		})
	}).catch( (error) => {
		// Failed sign in -> error message
		res.render('signin', {error: 'Invalid username or password!' })
	})
})

app.post('/signup', (req, res) => {
	let user = req.body.signup
	// Check if all fields are filled in
	if (user.username.length === 0 || user.password.length === 0 || user.password_check === 0 || user.email.length === 0) {
		res.render('signin', {error: 'Please fill out all fields.'})
		return
	}

	// Check if passwords match
	if (user.password !== user.password_check) {
		res.render('signin', {error: 'Passwords do not match. Please enter the same password twice.'})
		return
	}

	// encrypt password
	bcrypt.hash(user.password, 8, (err, hash) => {
		if (err) {
			res.render('signin', {error: 'Database error: failed to store password.'})
			return
		}
		// Store new user in db
		db.User.create( {
			username: 	user.username,
			password: 	hash,
			email: 		user.email
		}).then( user => {
			// Set session and render index
			req.session.user = {id:user.id, username:user.username, email:user.email}
			res.redirect('/')
		}).catch( error => {
			// Error; Likely username or email already taken
			res.render('signin', {error: 'Username or email already taken.'})
		})
	})
})
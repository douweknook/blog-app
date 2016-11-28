// Require modules
const bcrypt	= require('bcrypt')
const express	= require('express')
const router 	= express.Router()
const db 		= require(__dirname+'/../modules/db.js')

// Route for signing in
router.route('/signin')
	.get( (req, res) => {
		// Render sign in page; also page for sign up
		res.render('signin', {message: req.query.message})
	})

	.post( (req, res) => {
		let signin = req.body.signin
		// Check if all fields are filled in
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
			// Check if a user was found
			if (user === null) {
				res.render('signin', {error: 'Invalid username or password!'})
				return
			}
			// Compare password hashes
			bcrypt.compare(signin.password, user.password, (err, result) => {
				// Check if anything went wrong
				if (err) {
					res.render('signin', {error: 'Invalid username or password!'})
					return
				}
				// If comparison is true, passwords match
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

// Route to log out
router.get('/logout', (req, res) => {
	// Destroy user session
	req.session.destroy( error => {
		if (error) throw error
		// Redirect to sign in page
		res.redirect('/signin')
	})
})

// Route for signing up (only post; get is /signin)
router.post('/signup', (req, res) => {
	let user = req.body.signup
	// Check if all fields are filled in
	if (user.username.length === 0 || user.password.length === 0 || user.password_check.length === 0 || user.email.length === 0) {
		res.render('signin', {error: 'Please fill out all fields.'})
		return
	}

	// Check username for any weird characters
	let regex = /^\w+$/
	if (!regex.test(user.username)) {
		res.render('signin', {error: 'Username may only contain alphabetical and numerical characters and underscores.'})
		return
	}

	//Check if password is minimun of 8 characters
	if (user.password.length < 8 || user.password_check.length < 8) {
		res.render('signin', {error: 'Password need to be at least 8 characters.'})
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
			res.render('signin', {error: 'Something went wrong. Please try again.'})
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

module.exports = router
// Require modules
const dotenv	= require('dotenv').load()
const bcrypt 	= require('bcrypt')
const sequelize = require('sequelize')

const db 		= require(__dirname + '/modules/db')
const app 		= require(__dirname + '/modules/express')
const helper 	= require(__dirname + '/modules/helpers')

// Mount routes
app.use('/', require( __dirname + '/routes/user'))
app.use('/', require( __dirname + '/routes/registration'))
app.use('/', require( __dirname + '/routes/post'))

// Route for the homepage
app.get('/', (req, res) => {
	// Check if user is signed in
	if ( req.session.user ) {
		// Get all posts from the database
		db.Post.findAll({
			include: [db.User],
			order: [['createdAt', 'DESC']]	// Latest on top
		}).then( posts => {
			// Loop over posts to alter date notation
			helper.alterAllDates(posts)
			// Render timeline
			res.render('index', {posts: posts, user: req.session.user})
		})
	} else {
		res.redirect('/signin')
	}
})

// Listen op localhost:8000
app.listen(8000, () => {
	console.log('Server listening...')
})
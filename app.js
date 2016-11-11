// Require modules
const sequelize		= require('sequelize')
const express		= require('express')
const dotenv		= require('dotenv').load()
const bodyParser 	= require('body-parser')
const session 		= require('express-session')

// Initialize app
const app = express()

// Set static views
app.use(express.static(__dirname+'/views'))

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true
}))

// Set view engine to pug
app.set('view engine', 'pug')
app.set('views', __dirname+'/views')

// Initialize db
const db = new sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
	server: 	'localhost',
	dialect: 	'postgres'
})

// Define db models
const User = db.define('user', {
	username: 	{type: sequelize.STRING, unique: true},
	password: 	sequelize.STRING,
	email: 		{type: sequelize.STRING, unique: true},
	following: 	sequelize.ARRAY(sequelize.INTEGER),
	followers: 	sequelize.ARRAY(sequelize.INTEGER)
})

const Post = db.define('post', {
	title: 		sequelize.STRING,
	text: 		sequelize.TEXT
})

const Comment = db.define('comment', {
	text: 		sequelize.TEXT
})

// Define db relations
User.hasMany(Post); 	Post.belongsTo(User)
User.hasMany(Comment); 	Comment.belongsTo(User)
Post.hasMany(Comment); 	Comment.belongsTo(Post)

app.get('/', (req, res) => {
	if (req.session.user === undefined) {
		res.render('signin')

	} else {
		// Alter later to give posts of people followed
		Post.findAll({
			where: {
				userId: req.session.user.id
			}
		}).then( posts => {
			res.render('index', {posts: posts})
		})
	}	
})

app.get('/newpost', (req, res) => {
	if (req.session.user === undefined) {
		res.render('signin')
	} else {
		res.render('newpost')
	}
})

app.get('/posts', (req, res) => {
	if (req.session.user === undefined) {
		res.render('signin')
	} else {
		Post.findAll({
			where: {
				userId: req.session.user.id
			}
		}).then( posts => {
			res.render('posts', {posts: posts})
		})
	}
})

app.get('/profile', (req, res) => {
	if (req.session.user === undefined) {
		res.render('signin')
	} else {
		res.render('profile', {user: req.session.user})
	}
})

app.post('/signin', bodyParser.urlencoded({extended: true}), (req, res) => {
	let signin = req.body.signin
	// Search db for matching user
	User.findOne({
		where: {
			username: signin.username
		}
	}).then( user => {
		// Check if password is correct
		if (user !== null && signin.password === user.password) {
			// Set session and render index
			req.session.user = user
			res.redirect('/')		
		} else {
			// Failed sign in -> error message
			res.render('signin', {error: 'Invalid username or password!'})
		}
	}).catch( (error) => {
		// Failed sign in -> error message
		res.render('signin', {error: 'Invalid username or password!' })
	})
})

app.post('/signup', bodyParser.urlencoded({extended: true}), (req, res) => {
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

	// Store new user in db
	User.create( {
		username: 	user.username,
		password: 	user.password, // ENCRYPT HERE?!
		email: 		user.email
	}).then( user => {
		// Set session and render index
		req.session.user = user
		res.redirect('/')
	}).catch( error => {
		// Error; Likely username or email already taken
		res.render('signin', {error: 'Username or email already taken.'})
	})
})

app.post('/newpost', bodyParser.urlencoded({extended: true}), (req, res) => {
	let post = req.body.post
	Post.create({
		title: 	post.title,
		text: 	post.text,
		userId: req.session.user.id
	}).then( post => {
		res.redirect('/')
	}).catch( error => {
		res.render('newpost', {error: 'Something went wrong. Please try again.'})
	})
})

app.post('/changepassword', bodyParser.urlencoded({extended: true}), (req, res) => {
	if (req.body.password !== req.body.password_check) {
		res.render('profile', {error: 'Passwords do not match. Please enter the same password twice.'})
		return
	}

	
})

// Sync db and start server
db.sync(  ).then( () => {
	
	app.listen(8000, () => {
		console.log('Server listening...')
	})
})
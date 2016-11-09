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

// Create routes
app.get('/signin', (req, res) => {
	res.render('signin')
})

app.get('/', (req, res) => {
	let user = req.session.user
	console.log('user from session', req.session)
	if (user === undefined) {
		res.render('signin')
	} else {
		res.render('index')
	}	
})

app.post('/signin', bodyParser.urlencoded({extended: true}), (req, res) => {
	console.log('signin', req.body)
	let status = false
	User.findOne({
		where: {
			$or: [{username: req.body.username}, {email: req.body.username}]
		}
	}).then( user => {
		if (user !== null && req.body.password === user.password) {
			// Set session and render index
			req.session.user = user
			status = true
			res.send(status)
		} else{
			res.send(status)
		}
	}).catch( () => {
		res.send(status)
	})
})

app.post('/signup', bodyParser.urlencoded({extended: true}), (req, res) => {
	let user = req.body.signup
	// Store new user in db
	User.create( {
		username: 	user.username,
		password: 	user.password, // ENCRYPT HERE?!
		email: 		user.email
	}).then( user => {
		console.log('user into session', user)
		// Set session and render index
		req.session.user = user
		res.redirect('/')
	}).catch( (error) => {
		console.log(error)
	})
})

// Sync db and start server
db.sync( {force: true} ).then( () => {
	
	app.listen(8000, () => {
		console.log('Server listening...')
	})
})
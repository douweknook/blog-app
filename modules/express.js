// Require modules
const express			= require('express')
const dotenv			= require('dotenv').load()
const session 			= require('express-session')
const bodyParser 		= require('body-parser')
const sassMiddleware 	= require('node-sass-middleware')

// Initialize app
const app = express()

// Set view engine to pug
app.set('view engine', 'pug')
app.set('views', __dirname+'/../views')

app.use(
	sassMiddleware({
		src: __dirname + '/../views', 
		dest: __dirname + '/../views',
		debug: true,       
	})
)

// Set static views
app.use(express.static(__dirname+'/../views'))

// Set body parser for incoming form data
app.use( bodyParser.urlencoded( {extended: true} ) )

// Set settings for sessions
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true
}))

module.exports = app
// Require modules
const express		= require('express')
const dotenv		= require('dotenv').load()
const bodyParser 	= require('body-parser')
const session 		= require('express-session')
const bcrypt		= require('bcrypt')
const Entities		= require('html-entities').XmlEntities
const entities 		= new Entities()

// Initialize app
const app = express()

let db = require(__dirname+'/modules/db.js')

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

// const db = new sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
// 	server: 	'localhost',
// 	dialect: 	'postgres'
// })

// // Define db models
// const User = db.define('user', {
// 	username: 	{type: sequelize.STRING, unique: true},
// 	password: 	sequelize.STRING,
// 	email: 		{type: sequelize.STRING, unique: true},
// 	following: 	sequelize.ARRAY(sequelize.INTEGER),
// 	followers: 	sequelize.ARRAY(sequelize.INTEGER)
// })

// const Post = db.define('post', {
// 	title: 		sequelize.STRING,
// 	text: 		sequelize.TEXT
// })

// const Comment = db.define('comment', {
// 	text: 		sequelize.TEXT
// })

// // Define db relations
// User.hasMany(Post); 	Post.belongsTo(User)
// User.hasMany(Comment); 	Comment.belongsTo(User)
// Post.hasMany(Comment); 	Comment.belongsTo(Post)

// Create routes
app.get('/signin', (req, res) => {
	res.render('signin', {message: req.query.message})
})

app.get('/logout', (req, res) => {
	req.session.destroy( error => {
		if (error) throw error
		res.redirect('/signin')
	})
})

app.get('/', (req, res) => {
	if (req.session.user === undefined) {
		res.redirect('/signin')

	} else {
		// Alter later to give posts of people followed
		db.Post.findAll({
				include: [db.User],
				order: [['createdAt', 'DESC']]
			}).then( posts => {
				let results = posts.map( (x) => {
					return {
						id: 		x.id,
						title: 		entities.decode(x.title),
						text: 		entities.decode(x.text),
						createdAt: 	x.createdAt,
						userId: 	x.userId,
						user: 		x.user
					}
				})
				res.render('index', {posts: results, user: req.session.user})
			})
	}	
})

app.get('/newpost', (req, res) => {
	if (req.session.user === undefined) {
		res.redirect('/signin')
	} else {
		res.render('newpost', {user: req.session.user})
	}
})

app.get('/posts', (req, res) => {
	if (req.session.user === undefined) {
		res.redirect('/signin')
	} else {
		db.Post.findAll({
			where: {userId: req.session.user.id},
			include: [db.User],
			order: [['createdAt', 'DESC']]
		}).then( posts => {
			res.render('posts', {posts: posts, user: req.session.user})
		})
	}
})

app.get('/post', (req, res) => {
	Promise.all([
		db.Post.findOne({
			where: {id: req.query.id},
			include: [db.User]
		}),
		db.Comment.findAll({
			where: {postId: req.query.id},
			include: [db.User]
		})
	]).then(allPromises => {
		req.session.postid = req.query.id
		res.render('post', {post:allPromises[0], comments:allPromises[1], user: req.session.user})
	})
})

app.get('/profile', (req, res) => {
	if (req.session.user === undefined) {
		res.redirect('/signin')
	} else {
		res.render('profile', {user: req.session.user, message: req.query.message})
	}
})

// app.get('/users', (req, res) => {
// 	// if (req.session.user === undefined) {
// 	// 	res.redirect('/signin')
// 	// } else {
// 		let array = []
// 		User.findAll()
// 			.then( users => {
// 				users.map( user => {
					
// 					Post.count({ where: {userId: user.id} })
// 						.then( count => {
// 							array.push({
// 								username: 		user.username,
// 								email: 			user.email,
// 								total_posts: 	count
// 							})
// 						})
// 						.then( () => {
// 							console.log(array)
// 						})
// 					})

// 				})
// 	// }
// })

app.post('/changepassword', bodyParser.urlencoded({extended: true}), (req, res) => {
	if (req.body.password.length === 0 || req.body.password_check.length === 0) {
		res.redirect('/profile/?message=' + encodeURIComponent('Please fill in both password fields.'))
		return
	}

	if (req.body.password !== req.body.password_check) {
		res.redirect('/profile/?message=' + encodeURIComponent('Passwords do not match. Please enter the same password twice.'))
		return
	}

	db.User.update({
		password: req.body.password
	}, {
		where: { id: req.session.user.id }
	}).then( () => {
		res.redirect('/profile/?message=' + encodeURIComponent('Password changed'))
	})
})

app.post('/deleteaccount', (req, res) => {
	db.User.destroy({
		where: { id: req.session.user.id }
	}).then( () => {
		req.session.destroy( error => {
        	if(error) throw error;
        })
		res.redirect('/signin/?message=' + encodeURIComponent('Account deleted'))
	})
})

app.post('/signin', bodyParser.urlencoded({extended: true}), (req, res) => {
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
			}
			// Set session and render index
			req.session.user = {id:user.id, username:user.username, email:user.email}
			res.redirect('/')		
		})
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

app.post('/newpost', bodyParser.urlencoded({extended: true}), (req, res) => {
	let post = req.body.post
	if (post.title.length === 0 || post.text.length === 0) {
		res.render('newpost', {user: req.session.user, error: 'Please enter both a title and a body'})
	}

	db.Post.create({
		title: 	entities.encode(post.title),
		text: 	entities.encode(post.text),
		userId: req.session.user.id
	}).then( post => {
		res.redirect('/')
	}).catch( error => {
		res.render('newpost', {user: req.session.user, error: 'Something went wrong. Please try again.'})
	})
})

app.post('/addcomment', bodyParser.urlencoded({extended: true}), (req, res) => {
	if (req.body.comment.length === 0) {
		res.redirect('/post/?id='+req.session.postid)
	}
	db.Comment.create({
		text: 	entities.encode(req.body.comment),
		postId: req.session.postid,
		userId: req.session.user.id
	}).then( () => {
		res.redirect('/post/?id='+req.session.postid)
	})
})

// Sync db and start server
// db.sync(  ).then( () => {
app.listen(8000, () => {
	console.log('Server listening...')
})
// })
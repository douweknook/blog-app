// Require modules
const dotenv	= require('dotenv').load()
const bcrypt 	= require('bcrypt')
const _ 		= require('underscore')


let db 	= require(__dirname+'/modules/db.js')
let app = require(__dirname+'/modules/express.js')
require(__dirname+'/routes/registration.js')
require(__dirname+'/routes/user.js')
require(__dirname+'/routes/post.js')


app.get('/', (req, res) => {
	if ( signedIn(req.session.user, res) ) {
		db.Post.findAll({
			include: [db.User],
			order: [['createdAt', 'DESC']]
		}).then( posts => {
			res.render('index', {posts: posts, user: req.session.user})
		})
	}	
})


app.get('/users', (req, res) => {
	if ( signedIn(req.session.user, res) ) {
		Promise.all([
			db.User.findAll({
				attributes: ['id', 'username', 'email']
			}),
			db.User.count({
				attributes: ['username'],
				include: [db.Post],
				group: ['username']
			})
		]).then( result => {
			console.log(result[2])
			if (result[0].length === result[1].length) {
				let users = []
				for (var i = 0; i < result[0].length; i++) {
					users.push({
						id: 		result[0][i].id,
						username: 	result[0][i].username,
						email: 		result[0][i].email,
						postCount: 	result[1][i].count
					})
				}
				users = _.sortBy(users, 'postCount').reverse()
				res.render('users', {users: users})
			}
		})
	}
})


function signedIn(user, res) {
	if (user) {
		return true
	} else {
		res.redirect('/signin')
	}
}
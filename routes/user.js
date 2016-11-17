// Require modules
const bcrypt	= require('bcrypt')
const _ 		= require('underscore')
const express 	= require('express')
const router	= express.Router()
const db 		= require(__dirname + '/../modules/db')
const helper 	= require(__dirname + '/../modules/helpers')

// Route for user's profile page
router.get('/profile', (req, res) => {
	// Check if user is signed in
	if ( signedIn(req.session.user, res)) {
		res.render('profile', {user: req.session.user, message: req.query.message})
	}
})

// Route to change user's password
router.post('/changepassword', (req, res) => {
	// Check if both password fields are filled in
	if (req.body.password.length === 0 || req.body.password_check.length === 0) {
		res.redirect('/profile/?message=' + encodeURIComponent('Please fill in both password fields.'))
		return
	}
	// Check if both entered passwords are the same
	if (req.body.password !== req.body.password_check) {
		res.redirect('/profile/?message=' + encodeURIComponent('Passwords do not match. Please enter the same password twice.'))
		return
	}
	// Hash the password
	bcrypt.hash(req.body.password, 8, (err, hash) => {
		// Store hashed password in database
		db.User.update({
			password: hash
		}, {
			where: { id: req.session.user.id }
		}).then( () => {
			// Redirect to profile page
			res.redirect('/profile/?message=' + encodeURIComponent('Password changed'))
		})
	})
})

// Route to delete user's account + posts + comments
router.post('/deleteaccount', (req, res) => {
	// Find all posts by this user
	db.Post.findAll({
		where: {userId: req.session.user.id}
	}).then( posts => {
		// Get only the ids of these posts
		let postIds = posts.map( x => {
			return x.id
		})
		// Delete all comments to these posts
		db.Comment.destroy({
			where: {postId: postIds}
		})
	}).then( () => {
		Promise.all([
			// Delete all comments by this user
			db.Comment.destroy({
				where: {userId: req.session.user.id}
			}),
			// Delete all posts by this user
			db.Post.destroy({
				where: {userId: req.session.user.id}
			}),
			// Delete this user
			db.User.destroy({
				where: {id: req.session.user.id}
			})			
		]).then( () => {
			// Destroy the users session
			req.session.destroy( error => {
	        	if(error) throw error;
	        })
	        // Rediret to signin form
			res.redirect('/signin/?message=' + encodeURIComponent('Account deleted'))
		})
	}).catch( (err) => {
		// if anything went wrong, return to the post page
		res.redirect('/post/?id='+req.session.postid)
	})
})

// Route for all users page
router.get('/users', (req, res) => {
	// Check if user is signed in
	if ( signedIn(req.session.user, res) ) {
		Promise.all([
			// Get all users from database
			db.User.findAll({
				attributes: ['id', 'username', 'email'],
				// Include latest post
				include: {
					model: db.Post,
					limit: 1,
					order: [['createdAt', 'DESC']]
				}
			}),
			// Count posts for each user
			db.User.count({
				attributes: ['username'],
				include: [db.Post],
				group: ['username']
			})
		]).then( result => {
			// Make sure both results are equal in length (should always be true of everything went correct)
			if (result[0].length === result[1].length) {
				// Merge results into one object
				let users = []
				for (var i = 0; i < result[0].length; i++) {
					users.push({
						id: 			result[0][i].id,
						username: 		result[0][i].username,
						email: 			result[0][i].email,
						postCount: 		result[1][i].count,
						lastPostId: 	result[0][i].posts[0].id,
						lastPostTitle: 	result[0][i].posts[0].title,
						lastPostDate: 	helper.dateFormat(result[0][i].posts[0].createdAt)
					})
				}
				// Sort users by their amount of posts
				users = _.sortBy(users, 'postCount').reverse()
				res.render('users', {users: users, user: req.session.user})
			}
		})
	}
})

// Route to get profile of a specific user (also open when not signed in)
router.get('/users/profile', (req, res) => {
	Promise.all([
		// Find the in url specified user
		db.User.findOne({
			where: {id: req.query.id}
		}),
		// Find all posts
		db.Post.findAll({
			where: {userId: req.query.id}
		})
	]).then( results => {
		// Renedr profile
		res.render('userprofile', { profileUser: results[0], posts: results[1], user: req.session.user })
	})
})

// Function to check if user is signed in
function signedIn(user, res) {
	if (user) {
		return true
	} else {
		res.redirect('/signin')
	}
}

module.exports = router
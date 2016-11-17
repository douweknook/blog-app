// Require modules
const express 	= require('express')
const router 	= express.Router()
const db 		= require(__dirname + '/../modules/db')
const helper	= require(__dirname + '/../modules/helpers')

// Route for create new post
router.route('/newpost')
	.get( (req, res) => {
		// Check if user is logged in
		if ( signedIn(req.session.user, res)) {
			res.render('newpost', {user: req.session.user})
		}
	})

	.post( (req, res) => {
		let post = req.body.post
		// Check if required fields are filled in
		if (post.title.length === 0 || post.text.length === 0) {
			res.render('newpost', {user: req.session.user, error: 'Please enter both a title and a body'})
			return
		}
		// Store post in database
		db.Post.create({
			title: 	post.title,
			text: 	post.text,
			userId: req.session.user.id
		}).then( post => {
			// Redirect to homepage
			res.redirect('/')
		}).catch( error => {
			// Let user know if something went wrong on the backend/database
			res.render('newpost', {user: req.session.user, error: 'Something went wrong. Please try again.'})
		})
	})

// Route for all posts for specific user
router.get('/posts', (req, res) => {
	// Check if user is logged in
	if ( signedIn(req.session.user, res)) {
		// Retrieve all this users posts from database
		db.Post.findAll({
			where: {userId: req.session.user.id},
			include: [db.User],
			order: [['createdAt', 'DESC']]	// Latest on top
		}).then( posts => {
			// Alter timestamp to preferred format
			helper.alterAllDates(posts)
			res.render('posts', {posts: posts, user: req.session.user})
		})
	}
})

// Route for page of a specific post
router.get('/post', (req, res) => {
	Promise.all([
		// Find the in url specified post
		db.Post.findAll({
			where: {id: req.query.id},
			include: [db.User],
			limit: 1
		}),
		// Find all comments for this post
		db.Comment.findAll({
			where: {postId: req.query.id},
			include: [db.User],
			order: [['createdAt', 'DESC']]
		})
	]).then(allPromises => {
		// Store the post id in session to redirect to correct post later
		req.session.postid = req.query.id
		// Alter timestamp to preferred format
		helper.alterAllDates(allPromises[0])
		helper.alterAllDates(allPromises[1])
		res.render('post', {post:allPromises[0][0], comments:allPromises[1], user: req.session.user})
	})
})

// Route for added comments
router.post('/addcomment', (req, res) => {
	// Check if required fields are filled in
	if (req.body.comment.length === 0) {
		res.redirect('/post/?id='+req.session.postid)
		return
	}
	// Add comment to database
	db.Comment.create({
		text: 	req.body.comment,
		postId: req.session.postid,
		userId: req.session.user.id
	}).then( () => {
		res.redirect('/post/?id='+req.session.postid)
	})
})

// Function to check if user is signed in
function signedIn(user, res) {
	if (user) {
		return true
	} else {
		// If not signed in, redirect to sign in page
		res.redirect('/signin')
	}
}

module.exports = router
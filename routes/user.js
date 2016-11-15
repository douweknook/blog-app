const bcrypt		= require('bcrypt')

let db 	= require(__dirname+'/../modules/db.js')
let app = require(__dirname+'/../modules/express.js')

app.get('/profile', (req, res) => {
	if ( signedIn(req.session.user, res)) {
		res.render('profile', {user: req.session.user, message: req.query.message})
	}
})

app.post('/changepassword', (req, res) => {
	if (req.body.password.length === 0 || req.body.password_check.length === 0) {
		res.redirect('/profile/?message=' + encodeURIComponent('Please fill in both password fields.'))
		return
	}

	if (req.body.password !== req.body.password_check) {
		res.redirect('/profile/?message=' + encodeURIComponent('Passwords do not match. Please enter the same password twice.'))
		return
	}

	bcrypt.hash(req.body.password, 8, (err, hash) => {
		db.User.update({
			password: hash
		}, {
			where: { id: req.session.user.id }
		}).then( () => {
			res.redirect('/profile/?message=' + encodeURIComponent('Password changed'))
		})
	})
})

app.post('/deleteaccount', (req, res) => {
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

function signedIn(user, res) {
	if (user) {
		return true
	} else {
		res.redirect('/signin')
	}
}
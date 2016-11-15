let db 	= require(__dirname+'/../modules/db.js')
let app = require(__dirname+'/../modules/express.js')

app.get('/newpost', (req, res) => {
	if ( signedIn(req.session.user, res)) {
		res.render('newpost', {user: req.session.user})
	}
})

app.get('/posts', (req, res) => {
	if ( signedIn(req.session.user, res)) {
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

app.post('/newpost', (req, res) => {
	let post = req.body.post
	if (post.title.length === 0 || post.text.length === 0) {
		res.render('newpost', {user: req.session.user, error: 'Please enter both a title and a body'})
		return
	}

	db.Post.create({
		title: 	post.title,
		text: 	post.text,
		userId: req.session.user.id
	}).then( post => {
		res.redirect('/')
	}).catch( error => {
		res.render('newpost', {user: req.session.user, error: 'Something went wrong. Please try again.'})
	})
})

app.post('/addcomment', (req, res) => {
	if (req.body.comment.length === 0) {
		res.redirect('/post/?id='+req.session.postid)
		return
	}

	db.Comment.create({
		text: 	req.body.comment,
		postId: req.session.postid,
		userId: req.session.user.id
	}).then( () => {
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
function signedIn(user, res) {
	if (user) {
		return true
	} else {
		res.redirect('/signin')
	}
}
// Trigger when sign in submit button is clicked
$('#submit-signin').on('click', function() {
	// Validate input
	if ( $('#si-username').val() && $('#si-password').val() ) {
		// Create input object
		let input = {
			username: $('#si-username').val(),
			password:	$('#si-password').val(),
		}
		// Post input to server
		$.post('/signin', input, function(success) {
			console.log('success', success)
			if (success) {
				// On success, redirect to hompeage
				window.location.href = '/'
			} else {
				// On fail display error message
				Materialize.toast('Invalid username or password.', 3000, 'rounded')
				$('#si-username').val("")
				$('#si-password').val("")
				}
		}).fail( function() {
			// On fail display error message
			Materialize.toast('Sign in request failed', 3000, 'rounded')
			$('#si-username').val("")
			$('#si-password').val("")
		})
	} else {
		// If input is invalid, display error message
		Materialize.toast('Invalid username or password!', 3000, 'rounded')
	}
})

// Trigger when sign up submit button is clicked
$('#submit-signup').on('click', function() {
	// Validate input
	if ( $('#su-username').val() && $('#su-password').val() && $('#su-email').val() ) {
		if ( $('#su-password').val() === $('#su-password-check').val() ) {
			// Create input object
			let input = {
				username: $('#su-username').val(),
				password: $('#su-password').val(), //ENCRYPT?
				email: 		$('#su-email').val()
			}
			// Post input to server
			$.post('/signup', input, function(redirect) {
				window.location.href = redirect
			}).fail( function(message) {
				// On fail display error message and reset form
				Materialize.toast(message, 3000, 'rounded')
				$('#su-username').val(""),
				$('#su-password').val(""),
				$('#su-password-check').val(""),
				$('#su-email').val("")
			})
		} else {
			Materialize.toast('Please enter the exact same password twice.', 3000, 'rounded')
		}
	} else {
		// If input is invalid, display error message
		Materialize.toast('Please fill in all fields.', 3000, 'rounded')
	}
})
module.exports = {
	// Function to loop through array and change format for each entry
	alterAllDates: 	(array) => {
		array = array.map( x => {
			x.date = dateFormat(x.createdAt)
			return x
		})
	},
	dateFormat: dateFormat
}

// Function that changed date format
function dateFormat (date) {
	let year 	= date.getFullYear()
	let month 	= ('0' + (date.getMonth()+1)).slice(-2)
	let day 	= ('0' + date.getDate()).slice(-2)
	let hours 	= ('0' + date.getHours()).slice(-2)
	let minutes = ('0' + date.getMinutes()).slice(-2)
	let seconds = ('0' + date.getSeconds()).slice(-2)
	return day+'-'+month+'-'+year+' '+hours+':'+minutes+':'+seconds
}
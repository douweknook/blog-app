const sequelize		= require('sequelize')
const dotenv		= require('dotenv').load()

let db = {}

// Initialize db
db.conn = new sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
	server: 	'localhost',
	dialect: 	'postgres'
})

// Define db models
db.User = db.conn.define('user', {
	username: 	{type: sequelize.STRING, unique: true},
	password: 	sequelize.STRING,
	email: 		{type: sequelize.STRING, unique: true},
	following: 	sequelize.ARRAY(sequelize.INTEGER),
	followers: 	sequelize.ARRAY(sequelize.INTEGER)
})

db.Post = db.conn.define('post', {
	title: 		sequelize.STRING,
	text: 		sequelize.TEXT
})

db.Comment = db.conn.define('comment', {
	text: 		sequelize.TEXT
})

// Define db relations
db.User.hasMany(db.Post); 		db.Post.belongsTo(db.User)
db.User.hasMany(db.Comment); 	db.Comment.belongsTo(db.User)
db.Post.hasMany(db.Comment); 	db.Comment.belongsTo(db.Post)

db.conn.sync().then( ()=>{
	console.log('Database sync succesful')
}, (err) => {
	console.log('Database sync failed: '+err)
} )

module.exports = db

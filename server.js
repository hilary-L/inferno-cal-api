let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');
let mongodb = require('mongodb');
let faker = require('faker');

let ObjectID = mongodb.ObjectID;

const TASKS_COLLECTION = "tasks";

let app = express();

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

let db, createdDate, timeDifference;

let today = new Date();

mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, database) {
	if(err) {
		console.log(err);
		process.exit(1);
	}

	db = database;


	console.log("Database connection ready");

	db.collection(TASKS_COLLECTION).aggregate([ { $sample: { size: 1 } } ]).toArray(function(err, docs) {
		console.log(docs);

		createdDate = docs[0].createdDt;
		timeDifference = ((today - createdDate) / (1000 * 3600 * 24));
		console.log(timeDifference);
		console.log(timeDifference > 0.5);

		if(timeDifference > 0.5) {
			console.log('been longer than 12 hours');
			seedDatabase();
		}
	});

	let server = app.listen(process.env.PORT || 8080, function() {
		let port = server.address().port;
		console.log("App now running on port", port);
	});
});

function handleError(res, reason, message, code) {
	console.log("ERROR: " + reason);
	res.status(code || 500).json({"error": message});
}

function seedDatabase() {

	// create some fake data and seed the database on startup

	// drop the database before creating more entries

	db.collection(TASKS_COLLECTION).drop();

	let tasks = [];

	for(i = 0; i < 15; i++) {

		let task = {
			description: "Play tennis with " + faker.name.firstName(),
			date: faker.date.between("10/01/2016", "03/30/2017"),
			address: faker.address.streetAddress(),
			createdDt: new Date()
		};

		tasks.push(task);

	}

	for(i = 0; i < 15; i++) {

		let task = {
			description: "Appointment with " + faker.name.title() + " " + faker.name.lastName(),
			date: faker.date.between("10/01/2016", "03/30/2017"),
			address: faker.address.streetAddress(),
			createdDt: new Date()
		};

		tasks.push(task);

	}

	for(i = 0; i < 15; i++) {

		let task = {
			description: "Dinner with " + faker.name.firstName() + " and " + faker.name.firstName(),
			date: faker.date.between("10/01/2016", "03/30/2017"),
			address: faker.address.streetAddress(),
			createdDt: new Date(),
		};

		tasks.push(task);

	}

	for(i = 0; i < 50; i++) {
		let task = {
			description: faker.name.findName() + "'s birthday",
			date: faker.date.between("01/01/2017", "01/01/2019"),
			address: faker.address.streetAddress(),
			createdDt: new Date()
		}

		tasks.push(task);
	}

	db.collection(TASKS_COLLECTION).insertMany(tasks, function(err, doc) {
		if(err) {
			handleError(res, err.message, "Failed to create new task.");
		} else {
			console.log('seeding successful');
		}
	});
}

app.get("/tasks", function(req, res) {
	db.collection(TASKS_COLLECTION).find({}).toArray(function(err, docs) {
		if(err) {
			handleError(res, err.message, "Failed to get tasks.");
		} else {
			res.status(200).json(docs);
		}
	});
});

app.post("/tasks", function(req, res) {

	let newTask = req.body;

	if(!req.body.description) {
		handleError(res, "Invalid user input", "Must provide a task description.", 400);
	}

	db.collection(TASKS_COLLECTION).insertOne(newTask, function(err, doc) {
		if(err) {
			handleError(res, err.message, "Failed to create new task.");
		} else {
			res.status(201).json(doc.ops[0]);
		}
	});

});

app.get("/tasks/:id", function(req, res) {
	db.collection(TASKS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
		if(err) {
			handleError(res, err.message, "Failed to get task.")
		} else {
			res.status(200).json(doc);
		}
	});
});

app.put("/tasks/:id", function(req, res) {
	let updateDoc = req.body;
	delete updateDoc._id;

	db.collection(TASKS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
		if(err) {
			handleError(res, err.message, "Failed to update task.");
		} else {
			res.status(204).end();
		}
	});
});

app.delete("/tasks/:id", function(req, res) {
	db.collection(TASKS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
		if(err) {
			handleError(res, err.message, "Failed to delete task.");
		} else {
			res.status(204).end();
		}
	});
});

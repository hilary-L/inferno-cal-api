import express from "express";
import path from "path";
import bodyParser from "body-parser";
import mongodb from "mongodb";

let ObjectID = mongodb.ObjectID;

const TASKS_COLLECTION = "tasks";

let app = express();

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

let db;

mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, database) {
	if(err) {
		console.log(err);
		process.exit(1);
	}

	db = database;

	console.log("Database connection ready");

	let server = app.listen(process.env.PORT || 8080, function() {
		let port = server.address().port;
		console.log("App now running on port", port);
	});
});

function handleError(res, reason, message, code) {
	console.log("ERROR: " + reason);
	res.status(code || 500).json({"error": message});
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

app.put("/tasks/:id", funciton(req, res) {
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

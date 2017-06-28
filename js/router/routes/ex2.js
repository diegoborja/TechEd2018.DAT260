/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
var express = require("express");

module.exports = function() {
	var app = express.Router();

	//Simple Database Select - In-line Callbacks
	app.get("/", function(req, res) {
		var client = req.db;
		client.prepare(
			"select SESSION_USER from \"DUMMY\" ",
			function(err, statement) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				}
				statement.exec([],
					function(err, results) {
						if (err) {
							res.type("text/plain").status(500).send("ERROR: " + err.toString());
							return;
						} else {
							var result = JSON.stringify({
								Objects: results
							});
							res.type("application/json").status(200).send(result);
						}
					});
			});
	});

	var async = require("async");
	//Simple Database Select - Async Waterfall
	app.get("/waterfall", function(req, res) {
		var client = req.db;
		async.waterfall([

			function prepare(callback) {
				client.prepare("select SESSION_USER from \"DUMMY\" ",
					function(err, statement) {
						callback(null, err, statement);
					});
			},

			function execute(err, statement, callback) {
				statement.exec([], function(execErr, results) {
					callback(null, execErr, results);
				});
			},
			function response(err, results, callback) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				} else {
					var result = JSON.stringify({
						Objects: results
					});
					res.type("application/json").status(200).send(result);
				}
				callback();
			}
		]);
	});

	//Simple Database Call Stored Procedure
	app.get("/procedures", function(req, res) {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		//(client, Schema, Procedure, callback)
		hdbext.loadProcedure(client, null, "get_po_header_data", function(err, sp) {
			if (err) {
				res.type("text/plain").status(500).send("ERROR: " + err.toString());
				return;
			}
			//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
			sp({}, function(err, parameters, results) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
				}
				var result = JSON.stringify({
					EX_TOP_3_EMP_PO_COMBINED_CNT: results
				});
				res.type("application/json").status(200).send(result);
			});
		});
	});

	//Database Call Stored Procedure With Inputs
	app.get("/procedures2/:partnerRole?", function(req, res) {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		var partnerRole = req.params.partnerRole;
		var inputParams = "";
		if (typeof partnerRole === "undefined" || partnerRole === null) {
			inputParams = {};
		} else {
			inputParams = {
				IM_PARTNERROLE: partnerRole
			};
		}
		//(cleint, Schema, Procedure, callback)
		hdbext.loadProcedure(client, null, "get_bp_addresses_by_role", function(err, sp) {
			if (err) {
				res.type("text/plain").status(500).send("ERROR: " + err.toString());
				return;
			}
			//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
			sp(inputParams, function(err, parameters, results) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
				}
				var result = JSON.stringify({
					EX_BP_ADDRESSES: results
				});
				res.type("application/json").status(200).send(result);
			});
		});
	});

	//Call 2 Database Stored Procedures in Parallel
	app.get("/proceduresParallel/", function(req, res) {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		var inputParams = {
			IM_PARTNERROLE: "1"
		};
		var result = {};
		async.parallel([

			function(cb) {
				hdbext.loadProcedure(client, null, "get_po_header_data", function(err, sp) {
					if (err) {
						cb(err);
						return;
					}
					//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
					sp(inputParams, function(err, parameters, results) {
						result.EX_TOP_3_EMP_PO_COMBINED_CNT = results;
						cb();
					});
				});

			},
			function(cb) {
				//(client, Schema, Procedure, callback)            		
				hdbext.loadProcedure(client, null, "get_bp_addresses_by_role", function(err, sp) {
					if (err) {
						cb(err);
						return;
					}
					//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
					sp(inputParams, function(err, parameters, results) {
						result.EX_BP_ADDRESSES = results;
						cb();
					});
				});
			}
		], function(err) {
			if (err) {
				res.type("text/plain").status(500).send("ERROR: " + err);
			} else {
				res.type("application/json").status(200).send(JSON.stringify(result));
			}

		});

	});

	app.get("/whoAmI", function(req, res) {
		var userContext = req.authInfo;
		var result = JSON.stringify({
			userContext: userContext
		});
		res.type("application/json").status(200).send(result);
	});

	app.get("/hdb", function(req, res) {
		var client = req.db;
		client.prepare(
			"SELECT FROM PurchaseOrder.Item { " +
			" POHeader.PURCHASEORDERID as \"PurchaseOrderId\", " +
			" PRODUCT as \"ProductID\", " +
			" GROSSAMOUNT as \"Amount\" " +
			" } ",
			function(err, statement) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				}
				statement.exec([],
					function(err, results) {
						if (err) {
							res.type("text/plain").status(500).send("ERROR: " + err.toString());
							return;
						} else {
							var result = JSON.stringify({
								PurchaseOrders: results
							});
							res.type("application/json").status(200).send(result);
						}
					});
			});
	});

	app.get("/os", function(req, res) {
		var os = require("os");
		var output = {};

		output.tmpdir = os.tmpdir();
		output.endianness = os.endianness();
		output.hostname = os.hostname();
		output.type = os.type();
		output.platform = os.platform();
		output.arch = os.arch();
		output.release = os.release();
		output.uptime = os.uptime();
		output.loadavg = os.loadavg();
		output.totalmem = os.totalmem();
		output.freemem = os.freemem();
		output.cpus = os.cpus();
		output.networkInfraces = os.networkInterfaces();

		var result = JSON.stringify(output);
		res.type("application/json").status(200).send(result);
	});

	return app;
};
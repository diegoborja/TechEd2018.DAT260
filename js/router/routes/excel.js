/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, dot-notation: 0, new-cap: 0*/
"use strict";
var express = require("express");
var excel = require("node-xlsx");
var fs = require("fs");
var path = require("path");
//var excel2 = require("xlsx");
//var bodyParser = require("body-parser");
//var multer = require("multer");

module.exports = function() {
	var app = express.Router();

	//Hello Router
	app.get("/", function(req, res) {
		var output = "<H1>Excel Examples</H1></br>" +
			"<a href=\"" + req.baseUrl + "/download\">/download</a> - Download data in Excel XLSX format</br>";
		res.type("text/html").status(200).send(output);
	});

	//Simple Database Select - In-line Callbacks
	app.get("/download", function(req, res) {
		var client = req.db;
		var query = "SELECT TOP 10 " +
			" \"HEADER.PURCHASEORDERID\" as \"PurchaseOrderItemId\", " +
			" \"PRODUCT.PRODUCTID\" as \"ProductID\", " +
			" GROSSAMOUNT as \"Amount\" " +
			" FROM \"PO.Item\"  ";
		client.prepare(
			query,
			function(err, statement) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err.toString());
					return;
				}
				statement.exec([],
					function(err, rs) {
						if (err) {
							res.type("text/plain").status(500).send("ERROR: " + err);
						} else {
							var out = [];
							for (var i = 0; i < rs.length; i++) {
								out.push([rs[i]["PurchaseOrderItemId"], rs[i]["ProductID"], rs[i]["Amount"]]);
							}
							var result = excel.build([{
								name: "Purchase Orders",
								data: out
							}]);
							res.header("Content-Disposition", "attachment; filename=Excel.xlsx");
							res.type("application/vnd.ms-excel").status(200).send(result);
						}
					});
			});
	});

	return app;
};
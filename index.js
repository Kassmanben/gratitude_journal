require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require("./config/database");
const cors = require("cors");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const Journal = require("./models/journal");
var mandrill = require("mandrill-api/mandrill");
var mandrill_client = new mandrill.Mandrill(process.env.MANDRILL);
const moment = require("moment");

const app = express();

const journal = require("./routes/journal");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const port = process.env.PORT || 3000;

app.use(cors());

app.use("/journal", journal);

mongoose.connect(config.database);

mongoose.connection.on("connected", () => {
  console.log("Connected to database: " + config.database);
});

mongoose.connection.on("error", (err) => {
  console.log("Database error: " + err);
});

app.post("/sms", (req, res) => {
  const twiml = new MessagingResponse();

  if (
    req.body.Body.toLowerCase().startsWith("new journal:") ||
    req.body.Body.toLowerCase().startsWith("nj:")
  ) {
    var journalName = req.body.Body.replace(/new journal:/gi, "")
      .replace(/nj:/)
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(" ")
      .trim();
    Journal.getJournalByJournalname(journalName, (err, journals) => {
      if (journals.length > 0) {
        twiml.message("There is already a journal called " + journalName);
        res.writeHead(200, { "Content-Type": "text/xml" });
        res.end(twiml.toString());
      } else {
        let newJournal = new Journal({
          name: journalName,
          entries: [],
        });

        Journal.addJournal(newJournal, (err) => {
          if (err) {
            return res.json({
              success: false,
              msg: "Failed to register journal",
            });
          }
          twiml.message("New Journal: " + journalName + " created");

          res.writeHead(200, { "Content-Type": "text/xml" });
          res.end(twiml.toString());
        });
      }
    });
  } else {
    var journalName =
      req.body.Body.toLowerCase().startsWith("journal:") ||
      req.body.Body.toLowerCase().startsWith("j:")
        ? req.body.Body.replace(/journal:/gi, "")
            .replace(/j:/gi, "")
            .split(";")[0]
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(" ")
            .trim()
        : "Gratitude Journal";

    var journalEntry =
      req.body.Body.toLowerCase().startsWith("journal:") ||
      req.body.Body.toLowerCase().startsWith("j:")
        ? req.body.Body.replace(/journal:/gi, "")
            .replace("j:", "")
            .split(";")
            .slice(1)
            .join(" ")
            .trim()
        : req.body.Body;
    if (journalEntry.toLowerCase().startsWith("send all")) {
      Journal.getAllEntriesByJournalname(journalName, (err, entries) => {
        if (err) {
          return;
        }
        var text = "";
        entries.entries.forEach((entry) => {
          text +=
            moment.utc(entry.date).local().format("MM-DD-YYYY") +
            ":<br><br>" +
            entry.entry +
            "<br><br>";
        });

        var message = {
          html: "<p>" + text + "</p>",
          text: text,
          subject: "Gratitude Journal",
          from_email: "me@kassmanben.com",
          from_name: "🥰",
          to: [
            {
              email: "kassmanben@gmail.com",
              name: "Ben Kassman",
              type: "to",
            },
          ],
        };
        var async = false;
        var ip_pool = "Main Pool";
        mandrill_client.messages.send(
          {
            message: message,
            async: async,
            ip_pool: ip_pool,
          },
          function (result) {
            console.log(result);
          },
          function (e) {
            // Mandrill returns the error as an object with name and message keys
            console.log(
              "A mandrill error occurred: " + e.name + " - " + e.message
            );
            // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
          }
        );
      });
    } else {
      if (req.body.Body.replace(/[^a-zA-Z\d\s:]/, "").length < 280) {
        twiml.message("Your entry was not long enough");

        res.writeHead(200, { "Content-Type": "text/xml" });
        res.end(twiml.toString());
        return;
      } else {
        Journal.addEntryByJournalName(journalName, journalEntry, (err) => {
          if (err) {
            twiml.message("There was an error");
            res.writeHead(200, { "Content-Type": "text/xml" });
            res.end(twiml.toString());
            return;
          } else {
            twiml.message("Congrats! You saved an entry today");
            res.writeHead(200, { "Content-Type": "text/xml" });
            res.end(twiml.toString());
            return;
          }
        });
      }
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

function formatDate() {
  var d = new Date(),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

module.exports = app;

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const Journal = require("./models/journal");
var mandrill = require("mandrill-api/mandrill");
var mandrill_client = new mandrill.Mandrill(process.env.MANDRILL);
const moment = require("moment");
const schedule = require("node-schedule");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const port = process.env.PORT || 3000;

app.use(cors());

mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on("connected", () => {
  console.log("Connected to database: " + process.env.MONGO_URI);
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
    var journalName = formatBodyText(
      req.body.Body,
      /new journal:/gi,
      /nj:/gi,
      "newJournal"
    );
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
        ? formatBodyText(
            req.body.Body,
            /journal:/gi,
            /j:/gi,
            "entryJournalName"
          )
        : "Gratitude Journal";

    var journalEntry =
      req.body.Body.toLowerCase().startsWith("journal:") ||
      req.body.Body.toLowerCase().startsWith("j:")
        ? formatBodyText(req.body.Body, /journal:/gi, /j:/gi, "entry")
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
          from_email: process.env.SENDER_EMAIL,
          from_name: "🥰",
          to: [
            {
              email: process.env.RECIEVER_EMAIL,
              name: process.env.RECIEVER_NAME,
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
            console.log(
              "A mandrill error occurred: " + e.name + " - " + e.message
            );
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

function formatBodyText(text, toReplace, toReplaceAlt, flag) {
  if (flag === "entry") {
    text = text
      .replace(toReplace, "")
      .replace(toReplaceAlt, "")
      .split(";")
      .slice(1)
      .join(" ")
      .trim();
  }
  if (flag === "entryJournalName") {
    text = text
      .replace(toReplace, "")
      .replace(toReplaceAlt, "")
      .split(";")[0]
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(" ")
      .trim();
  }
  if (flag === "newJournal") {
    text = text
      .replace(toReplace, "")
      .replace(toReplaceAlt, "")
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(" ")
      .trim();
  }
  return text;
}

schedule.scheduleJob("42 * * * *", function () {
  const client = require("twilio")(accountSid, authToken);
  client.messages
    .create({
      body: "test message",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })
    .then((message) => console.log(message.sid));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;

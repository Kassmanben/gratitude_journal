const express = require("express");
const router = express.Router();
const Journal = require("../models/journal");
const sendSms = require("../twilio");

//Register
router.post("/register", (req, res, next) => {});

router.patch("/addEntries", (req, res, next) => {
  if (req.body.entry.replace(/[^a-zA-Z\d\s:]/, "").length < 280) {
    return res.status(400).json({ msg: "Your message was not long enough" });
  }
  Journal.addEntryByJournalName(req.body.name, req.body.entry, (err, name) => {
    if (err) {
      return res.status(400).json({ msg: err });
    }
    return res.json({ name: name });
  });
});

module.exports = router;

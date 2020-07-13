const mongoose = require("mongoose");
const moment = require("moment");

const JournalSchema = mongoose.Schema({
  name: String,
  entries: {
    type: [
      {
        date: String,
        entry: String,
      },
    ],
  },
});

const Journal = (module.exports = mongoose.model("Journal", JournalSchema));

module.exports.getJournalByJournalname = function (journalName, callback) {
  const query = { name: journalName };
  return Journal.find(query, callback);
};

module.exports.getAllEntriesByJournalname = function (journalName, callback) {
  const query = { name: journalName };
  return Journal.findOne(query, callback).select("entries");
};

module.exports.addJournal = function (newJournal, callback) {
  newJournal.save(callback);
};

module.exports.addEntryByJournalName = function (journalName, entry, callback) {
  console.log(journalName);
  console.log(entry);

  Journal.update(
    { name: journalName },
    {
      $push: {
        entries: {
          date: moment().format("MM-DD-YYYY"),
          entry: entry,
        },
      },
    },
    callback
  );
};

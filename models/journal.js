const mongoose = require("mongoose");

function formatDate() {
  var d = new Date(),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

const JournalSchema = mongoose.Schema({
  name: String,
  entries: {
    type: [
      {
        date: Date,
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
          date: formatDate(),
          entry: entry,
        },
      },
    },
    callback
  );
};

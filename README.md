# Gratitude Journal

This is an app that integrates with Twilio, Mandrill and MongoDb to act as a daily reminder to write in your journal! It offers the ability to send your journal entries via text, and sends texts to remind you if you havent submitted an entry for the day. The text reminders become more frequent as it gets later in the day. There is also a minimum character count of 280, to make sure the journal entries are at least a bit longer than a tweet.

Feel free to take this code and use it as you'd like. You'll need to have a Twilio account and API keys, Mandrill account and API keys, and a MongoDb Atlas cluster

## Overview
Once the app is set up with all your credentials in a .env file, you can get started. 
  If running locally, you should use `ngrok http <PORT>` and grab the forwarding address provided. 
    Then in your Twilio dashboard, put `<forwardingaddress>/sms` into the Webhook labeled "A MESSAGE COMES IN" with "HTTP POST"
  If deploying this to a website, you can just use the `<websiteaddress>/sms` for the above webhook
  
### Commands (text these to the Twilio number)
  To add a new Journal to your app, just text `new journal: <journalName>` or `nj: <journalName>` to the Twilio number. There are some rudimentary checks to make sure you don't create duplicate journal names
    Texting this to your Twilio number will add a new journal for you within MongoDb
  
  To save a new entry in your journal, just text it to the Twilio number! Note that there is a minimum character count of 280, just to keep the journal entries to slightly longer than a Tweet (at a bare minimum)
    If you want to send an entry to a specific journal, you can start your message out with `journal: <journalName> ;` or `j: <journalName> ;`. Otherwise, it will default to the Gratitude Journal
  
  To have all your journal entries emailed to you, just text the Twilio number `send all`. 
    As with a new entry, you can also send the message `journal: <journalName> ; send all` or `j: <journalName> ; send all` to get all the entries from a specific journal, otherwise it'll default to the Gratitude journal
    
    
  

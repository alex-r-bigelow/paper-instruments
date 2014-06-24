paper-instruments
=================

Think [Prototyping on Paper](https://popapp.in/) for the desktop + mouse tracking.

Currently in alpha. Setup is nightmarish with lots of server jargon at the moment:

For tracking to work, you need to do the following on a server (you may need to reconfigure serverSide.py to point to your mongodb instance)... in theory, only a relatively small number of participants will be using it for a short period of time, so an reasonably modern desktop with a static IP address should be adequate.
- install & start [mongodb](http://www.mongodb.org/)
- if it doesn't already exist, create a "local" database
- add three collections: "tracking", "transitions", and "participants"
- install [pymongo](http://api.mongodb.org/python/current/)
- install & start [tangelo](http://tangelo.kitware.com/)
- clone this repository somewhere inside ~/tangelo_html/
- send your users to http://your.machines.ip.address:8080/~yourUserName/paper-instruments/index.html (make sure port 8080 is accessible)
- edit your prototype by going to edit.html. Images should be placed the data folder. When finished, the replace config.json with the one edit.html generates.
- see a quick overlay of the tracking results by going to vis.html (coming soon: better vis)

If you don't care about mouse tracking data, it's much easier - just host index.html, and the lib, scripts, and data folders wherever you please (as it's only javascript, a Dropbox public folder or github page will work just fine).
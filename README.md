paper-instruments
=================

Think [Prototyping on Paper](https://popapp.in/) for the desktop + mouse tracking.

Currently in alpha. Setup is nightmarish with lots of server jargon at the moment:

For tracking to work, you need to do the following on a server (you may need to reconfigure serverSide.py to point to your mongodb instance)... in theory, only a relatively small number of participants will be using it for a short period of time, so an reasonably modern desktop with a static IP address should be adequate.
- install & start [mongodb](http://www.mongodb.org/)
- if it doesn't already exist, create a "local" database
- add two collections: "results" and "participants"
- install [pymongo](http://api.mongodb.org/python/current/)
- install & start [tangelo](http://tangelo.kitware.com/)
- clone this repository somewhere inside ~/tangelo_html/
- send your users to http://your.machines.ip.address:8080/~yourUserName/paper-instruments/index.html (make sure port 8080 is accessible)
- see a visualization of the tracking results by going to vis.html
- (coming soon) edit your prototype by going to edit.html. For now, place a set of images in the data folder and edit config.json to link slides / set interaction hotspots. When finished, the editor will let you set these up visually.

If you don't care about mouse tracking data, it's much easier - just host index.html, script.js, and the data folder wherever you please (as it's only javascript, a Dropbox public folder or github page will work just fine).
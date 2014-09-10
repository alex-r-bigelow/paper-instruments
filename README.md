paper-instruments
=================

Think [Prototyping on Paper](https://popapp.in/) for the desktop + mouse tracking.

Currently in alpha; it probably only works in Chrome on a Mac, there's no editor,
and I broke the mouse tracking code recently in order to
support layered prototypes. See [TODO.md](https://github.com/yasashiku/paper-instruments/blob/master/TODO.md)
for more details.

[Here's](http://yasashiku.github.io/paper-instruments/preview.html) a basic preview. Hold
space to reveal the possible interaction hot spots.

[Here](http://yasashiku.github.io/paper-instruments/state.html) is an early attempt at
extracting and characterizing the process that the prototype induces (open the drawer on the right).
Note that if you create a prototype that is reasonably complex, this graph will explode in size
([here's](http://abigelow.sci.utah.edu/state.html) an example - and this prototype is only about half done!)

Creating your own prototypes
----------------------------
Replace the images in the data folder with your own, and rewrite config.js appropriately (no documentation yet,
but it should be reasonably straightforward? Feel free to email with questions). You can use edit.html to help
with drawing the hot spots. I know this is all ugly and hacky; in the future, I'll include a legit editor.

Mouse tracking (currently broken)
---------------------------------
Setup for mouse tracking is nightmarish with lots of server jargon:

For tracking to work, you need to do the following on a server (you may need to reconfigure serverSide.py to point to your mongodb instance)... in theory, only a relatively small number of participants will be using it for a short period of time, so an reasonably modern desktop with a static IP address should be adequate.
- install & start [mongodb](http://www.mongodb.org/)
- if it doesn't already exist, create a "local" database
- add three collections: "tracking", "transitions", and "participants"
- install [pymongo](http://api.mongodb.org/python/current/)
- install & start [tangelo](http://tangelo.kitware.com/)
- clone this repository somewhere inside ~/tangelo_html/
- send your users to http://your.machines.ip.address:8080/~yourUserName/paper-instruments/index.html (make sure port 8080 is accessible)
- edit your prototype by going to edit.html. Images should be placed the data folder. When finished, the replace config.json with the one edit.html generates.
- see a quick overlay of the tracking results by going to trace.html (coming soon: legit visualization)

If you don't care about mouse tracking data, feel free to delete serverSide.py, and host the directory wherever you please (a Dropbox public folder or github page will work just fine).
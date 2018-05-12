# mixer-Support-Alert
An overlay for your !support command. A better way to shout out mixer streamers!

This will display a popup on your stream with the Mixer.com avatar, their name, and a link for the person you are giving shoutouts to. This will display when a mod or the streamer in chat uses your !support PERSON command. The command itself can be changed in the URL to be anything other than !support. 

Note this will not post anything in chat. So please use this in conjuction with a bot.

Usage: <br>
1. Open up OBS. <br>
2. Create a new browser overlay element. <br>
3. Paste in `http://crowbartools.com/projects/support-alert/support.html?username=YOURNAMEHERE&timer=8000&command=support&game=1` <br>
4. Change out your name in the url.

Settings: <br>
1. You can change the timer to adjust how long the support popup shows. 1000 = 1 second. <br>
2. You can change the command in the URL if your shoutout command isn't !support.
3. You can choose if you want to show their last played game or not: game=1 or game=0.

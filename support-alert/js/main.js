////////////////////
// Helper Functions
///////////////////
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

// Get User ID & start it up
var username = getUrlParameter('username');
$.getJSON( "https://beam.pro/api/v1/channels/"+username, function( data ) {
  userID = data.id;
  beamSocketConnect();
});

// General Settings
var showTime = getUrlParameter('timer');
timeToShow = showTime; // in Milliseconds
command = getUrlParameter('command');
console.log(command);

// CHAT
// Connect to Beam Websocket
function beamSocketConnect(){
    if ("WebSocket" in window){

       // Let us open a web socket
       var ws = new ReconnectingWebSocket("wss://chat2-dal.beam.pro:443");

       ws.onopen = function(){
          // Web Socket is connected, send data using send()
          var connector = JSON.stringify({type: "method", method: "auth", arguments: [userID], id: 1});
          ws.send(connector);
          console.log('Connection Opened...');
          $("<div class='chatmessage' id='1'>Chat connection established to "+username+".</div>").appendTo(".chat").hide().fadeIn('fast').delay(5000).fadeOut('fast', function(){ $(this).remove(); });
       
          // Error Handling & Keep Alive
          setInterval(function(){
            errorHandle(ws);
          }, 10000)
       };

       ws.onmessage = function (evt){
        chat(evt);

        // Debug - Log all chat events.
        //console.log(evt);
       };

       ws.onclose = function(){
          // websocket is closed.
          console.log("Connection is closed...");
       };

    }else{
       // The browser doesn't support WebSocket
       console.error("Woah, something broke. Abandon ship!");
    }
}
// Chat Messages
function chat(evt){
    var evtString = $.parseJSON(evt.data);
    var eventType = evtString.event;
    var eventMessage = evtString.data;

    if (eventType == "ChatMessage"){
        var username = eventMessage.user_name;
        var userroles = eventMessage.user_roles[0];
    	var usermessage = eventMessage.message.message;
    	var messageID = eventMessage.id;
    	var completeMessage = "";
        var usercommand = usermessage.data;

        $.each(usermessage, function() {
          var type = this.type;

          if (type == "text"){
          	var messageTextOrig =  this.data;
          	var messageText = messageTextOrig.replace(/(<([^>]+)>)/ig, "");
          	completeMessage += messageText;
          } else if (type == "tag"){
            var userTag = this.text;
            completeMessage += userTag;
          }

        });

        // Make sure command came from a user or owner.
        // Then take thank name and post a message.
        if(userroles == "Mod" && completeMessage.indexOf("!"+command) >= 0 || userroles == "Owner" && completeMessage.indexOf("!"+command) >= 0){
          var raidEditOne = completeMessage.replace("!"+command, "");
          var raidEditTwo = raidEditOne.replace("@","");
          var raidEditFinal = $.trim(raidEditTwo);

          if(raidEditFinal !== undefined && raidEditFinal !== null && raidEditFinal !== ""){
            $.getJSON( "https://beam.pro/api/v1/channels/"+raidEditFinal, function( data ) {
              var userID = data.id;
              var userAvatar = data.user.avatarUrl;
              var userGroup = data.user.groups[0].name;
              console.log(userAvatar);
              if(userAvatar == null || userAvatar == "null"){
                var userAvatar = "http://beam.pro/api/v1/users/62319/avatar?w=256&h=256&v=0";
              }
              
              $("<div class='raidmessage'><div class='avatar'><img src='"+userAvatar+"'></div><div class='username' role="+userGroup+">"+raidEditFinal+"</div><div class='beamurl'>beam.pro/"+raidEditFinal+"</div></div>").appendTo(".raid").hide().fadeIn('fast').delay(timeToShow).fadeOut('fast', function(){ $(this).remove(); });

            });
          }
        }

    }
}


// Error Handling & Keep Alive
function errorHandle(ws){
  var wsState = ws.readyState;
  if (wsState !== 1){
    // Connection not open.
    console.log('Ready State is '+wsState);
  } else {
    // Connection open, send keep alive.
    ws.send(2);
  }
}
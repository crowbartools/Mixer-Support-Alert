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

// Headers for ajax calls.
function setHeader(xhr) {
  xhr.setRequestHeader('Client-ID', '8682f64ae59cbcba5cd701c205b54b04a424b46ca064e563');
}

// Get User ID & start it up
var username = getUrlParameter('username');
$.ajax({
  url: "https://Mixer.com/api/v1/channels/" + username,
  type: 'GET',
  dataType: 'json',
  beforeSend: setHeader,
  success: function(data) {
      userID = data.id;
      userPartner = data.partnered;
      if (userPartner === true) {
          subIcon = data.badge.url;
      } else {
          subIcon = "";
      }

      // Get our chat endpoints and connect to one.
      $.ajax({
          url: "https://Mixer.com/api/v1/chats/" + userID,
          type: 'GET',
          dataType: 'json',
          beforeSend: setHeader,
          success: function(data) {
              var endpoints = data.endpoints
              mixerSocketConnect(endpoints);
          }
      })
  }
})

// General Settings
var timeToShow = getUrlParameter('timer'); // in Milliseconds
var command = getUrlParameter('command');
var gameCheck = getUrlParameter('game');

// CHAT
// Connect to mixer Websocket
function mixerSocketConnect(endpoints) {
  if ("WebSocket" in window) {

      // Let us open a web socket
      var randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      var ws = new ReconnectingWebSocket(randomEndpoint);
      console.log('Connected to ' + randomEndpoint);

      ws.onopen = function() {
          // Web Socket is connected, send data using send()
          var connector = JSON.stringify({
              type: "method",
              method: "auth",
              arguments: [userID],
              id: 1
          });
          ws.send(connector);
          console.log('Connection Opened...');
          let template = `
            <div class='raidmessage'>
                <div class="username">
                    Support overlay is ready!
                </div>
            </div>
            `;
            $(".raid").append(template);
            $(".raid").hide().fadeIn('fast').delay(3000).fadeOut('fast', function() {
                $(".raidmessage").remove();
            });

          // Error Handling & Keep Alive
          setInterval(function() {
              errorHandle(ws);
          }, 10000)
      };

      ws.onmessage = function(evt) {
          chat(evt);
      };

      ws.onclose = function() {
          // websocket is closed.
          console.log("Connection is closed...");
      };

  } else {
      // The browser doesn't support WebSocket
      console.error("Woah, something broke. Abandon ship!");
  }
}

// Chat Messages
function chat(evt) {
  var evtString = $.parseJSON(evt.data);
  var eventType = evtString.event;
  var eventMessage = evtString.data;

  if (eventType == "ChatMessage") {
      var username = eventMessage.user_name;
      var userroles = eventMessage.user_roles[0];
      var usermessage = eventMessage.message.message;
      var messageID = eventMessage.id;
      var completeMessage = "";
      var usercommand = usermessage.data;

      $.each(usermessage, function() {
          var type = this.type;

          if (type == "text") {
              var messageTextOrig = this.data;
              var messageText = messageTextOrig.replace(/(<([^>]+)>)/ig, "");
              completeMessage += messageText;
          } else if (type == "tag") {
              var userTag = this.text;
              completeMessage += userTag;
          }

      });

      // Make sure command came from a user or owner.
      // Then take thank name and post a message.
      if (userroles == "Mod" && completeMessage.indexOf("!" + command + " ") >= 0 || userroles == "ChannelEditor" && completeMessage.indexOf("!" + command + " ") >= 0 || userroles == "Owner" && completeMessage.indexOf("!" + command + " ") >= 0) {
          var raidEditOne = completeMessage.replace("!" + command, "");
          var raidEditTwo = raidEditOne.replace("@", "");
          var raidEditFinal = $.trim(raidEditTwo);

          if (raidEditFinal !== undefined && raidEditFinal !== null && raidEditFinal !== "") {
              $.ajax({
                  url: "https://Mixer.com/api/v1/channels/" + raidEditFinal,
                  type: 'GET',
                  dataType: 'json',
                  beforeSend: setHeader,
                  success: function(data) {
                      var userID = data.id;
                      var userAvatar = data.user.avatarUrl;
                      var userGroups = data.user.groups;
                      var userGroup = "User";
                      var userGame = "";

                      for (i in userGroups) {
                          let group = userGroups[i];
                          let groupName = group.name;

                          switch (groupName) {
                              case "Pro":
                                  userGroup = "Pro";
                                  break;
                              case "Subscriber":
                                  userGroup = "Subscriber";
                                  break;
                              case "Mod":
                              case "ChannelEditor":
                              case "Channel Editor":
                                  userGroup = "Mod";
                                  break;
                              case "Staff":
                                  userGroup = "Staff";
                                  break;
                              case "Owner":
                                  userGroup = "Owner";
                                  break;
                              default:
                                  userGroup = "User";
                          }
                      }

                      if (userAvatar == null || userAvatar == "null") {
                          var userAvatar = "http://mixer.com/api/v1/users/62319/avatar?w=256&h=256&v=0";
                      }

                      if (gameCheck == 1 && data.type !== null) {
                          var userGame = "They were last streaming " + data.type.name + '.';
                      }

                      let template = `
                        <div class='raidmessage'>
                          <div class='avatar'>
                            <img src="${userAvatar}">
                          </div>
                          <div class="username" role="${userGroup}">
                            ${raidEditFinal}
                          </div>
                            <div class="game">
                              ${userGame}
                            </div>
                            <div class='mixerurl'>
                                mixer.com/${raidEditFinal}
                            </div>
                        </div>
                      `;

                      $(".raid").html(template);

                      $(".raidmessage .username").fitText();
                      $(".raidmessage .game").fitText(3);
                      $(".raidmessage .mixerurl").fitText(3);

                      
                      $(".raid").fadeIn('fast', function(){
                        $(window).trigger('resize');
                      });

                      setTimeout(function(){
                        $(".raid").fadeOut('fast', function() {
                            $(".raidmessage").remove();
                        }); 
                      }, timeToShow);
                  }
              });
          }
      }
  }
}


// Error Handling & Keep Alive
function errorHandle(ws) {
  var wsState = ws.readyState;
  if (wsState !== 1) {
      // Connection not open.
      console.log('Ready State is ' + wsState);
  } else {
      // Connection open, send keep alive.
      ws.send(2);
  }
}

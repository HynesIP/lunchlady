// Wildebeest - Design and Development
// http://Wildebee.st
// Copyright (c) 2015 Wildebeest Design and Development, Inc. or its affiliates. All Rights Reserved. Use is subject to license terms.

/**
 * App ID for the skill
 */
var APP_ID = 'amzn1.echo-sdk-ams.app.[YOUR APP ID]';

var https = require('https');

var queryString = require('querystring');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var WhatsForLunch = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
WhatsForLunch.prototype = Object.create(AlexaSkill.prototype);
WhatsForLunch.prototype.constructor = WhatsForLunch;

WhatsForLunch.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("WhatsForLunch onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);


};

WhatsForLunch.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("WhatsForLunch onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

WhatsForLunch.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

  
};

WhatsForLunch.prototype.intentHandlers = {

    GetFirstEventIntent: function (intent, session, response) {
        handleFirstEventRequest(intent, session, response);
    },

    GetNextEventIntent: function (intent, session, response) {
        handleNextEventRequest(intent, session, response);
    },
    GetYesEventIntent: function (intent, session, response) {
        handleYesEventRequest(intent, session, response);
    },
    GetNoEventIntent: function (intent, session, response) {
        handleNoEventRequest(intent, session, response);
    },
    HelpIntent: function (intent, session, response) {
        var speechOutput = "With What's For Lunch, you'll save yourself the headache of deciding on where to eat lunch. Let Alexa decide where to go." ;
        response.ask(speechOutput);
    },
    FinishIntent: function (intent, session, response) {
        var speechOutput = "Wildebeest go get some grub.";
        response.tell(speechOutput);
    }
};

/**
 * Function to handle the onLaunch skill behavior
 */

function getWelcomeResponse(response) {
   
    var sessionAttributes = {};
    var cardTitle = "Lunch For Today";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "With What's For Lunch, you can get a great suggestion for lunch. What type of food would you like me to search for? For example, you can say American, Italian, or even just say coffee.";
    // var speechOutput = "Having trouble deciding on lunch? Do you want my help Wildebeest?";
    var speechOutput = "Having trouble deciding on lunch Wildebeest? What type of food would you like me to search for?";
    
    response.askWithCard(speechOutput, repromptText, cardTitle, speechOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleFirstEventRequest(intent, session, response) { 

    var termSlot          = intent.slots.term.value;
    console.log(termSlot);
    var content           = "";
    var sessionAttributes = session.attributes;
    var cardTitle         = "What's For Lunch";
    var repromptText      = "With What's For Lunch, you can get a great suggestion for lunch.  Just ask the Lunch Lady for a type of food? For example, you can Alexa ask Lunch Lady for Sushi.";

    // get yelp api results for restaurants
    getJsonEventsFromYelp(termSlot, function(results){

        var speechText         = "";
        var randPlace          = results.businesses[Math.floor(Math.random()*results.businesses.length)];
        var name               = randPlace.name;
        var rating             = randPlace.rating;
        var location           = randPlace.location.city;
        // sessionAttributes      = randPlace;
        // build the response from Alexa to user with the results
        speechText = "how about " + name + ", they have received a " + rating + " rating. " + "And they're located in " + location +". Would you like me to text you the address?";
        // sets session attribute with restaurant result
        session.attributes = randPlace;
    
        response.askWithCard(speechText, repromptText, cardTitle, speechText);
    }); 
}
function handleNoEventRequest(intent, session, response) {
    var speechText = "If you'd like another location, just Ask Lunch Lady for your next selection. For example, Alexa Ask Lunch Lady for Sushi.";
    var repromptText = "I didn't catch that, can you please give me your number again?";
    response.ask(speechText, repromptText);
}

function handleYesEventRequest(intent, session, response) {
    var speechText = "Ok, what's your number?";
    var repromptText = "I didn't catch that, can you please give me your number again?";
    response.ask(speechText, repromptText);
}

function handleNextEventRequest(intent, session, response) {
    var sessionAttributes = response._session.attributes;
    var cardTitle         = "Address for ".concat(sessionAttributes.name);
    
    var intentCount       = Object.keys(intent.slots).length;
    var phoneNum          = "";
    var speechText        = "";
    var repromptText      = "With What's For Lunch, you can get a great suggestion for lunch.  Just ask the Lunch Lady for a type of food? For example, you can Alexa ask Lunch Lady for Sushi.";
    // number library to use convert words to integers
    var numObj = {
      "one" : 1,
      "two" : 2,
      "three" : 3,
      "four" : 4,
      "five" : 5,
      "six" : 6,
      "seven" : 7,
      "eight" : 8,
      "nine" : 9,
      "zero" : 0
    };
    // check to see if all ten digits are valid and present
    if (intentCount === 10) {
        var digit;
        for (var i in intent.slots) {
           digit = intent.slots[i].value;  

           if (typeof numObj[digit] === 'undefined'){ 
                phoneNumberError(response, repromptText, cardTitle);
                return;
            }else{
                phoneNum += numObj[digit];
            }              
        }; 

        // uses the numObj library to replace the string value to numerical     
        var msgObj = {
            "number": phoneNum,
            "body":  sessionAttributes.name +", \n"  + sessionAttributes.location.display_address.join() +", \n" + sessionAttributes.url 
            };
        
         // sendTwilioMsg(msgObj, response, repromptText, cardTitle);
         SendSMS(msgObj, response, repromptText, cardTitle, twilioResponse);
    } else {
        phoneNumberError(response, repromptText, cardTitle);
    };
}

// Error function that gets called when the user phone number is not valid
function phoneNumberError(response, repromptText, cardTitle){
    var speechText = "I didn't catch the number, can you please repeat it?";
    response.askWithCard(speechText, repromptText, cardTitle, speechText);
}
// Yelp api call for associated restaurants.  
function getJsonEventsFromYelp(keyword, eventCallback) {
  
    var yelp = require("yelp").createClient({
        consumer_key: "YOUR KEYS AND TOKENS", 
        consumer_secret: "YOUR KEYS AND TOKENS", 
        token: "YOUR KEYS AND TOKENS", 
        token_secret: "YOUR KEYS AND TOKENS" 
    });
    console.log("KEYWORD:" +keyword);
    yelp.search({category_filter: "restaurants", sort: 0, term: keyword, radius_filter: 4000, location: "Marina del Rey"}, function(error, data) {
        var results = data;
       eventCallback(results);
    });
  
 }
 
 // Send the located restaurant's info to user via Twilio
function SendSMS(msg, response, repromptText, cardTitle, twilioResponse) {
    var accountSid = "YOUR TWILIO SID";
    var authToken = 'YOUR TWILIO AUTHTOKEN';
    var number  = '+1'.concat(msg.number);
    var msgBody = msg.body;
    // The SMS message to send
    var message = {
        To: number, 
        From: "+12139082999",
        Body: msgBody
    };
    
    var messageString = queryString.stringify(message);
    
    // Options and headers for the HTTP request   
    var options = {
        host: 'api.twilio.com',
        port: 443,
        path: '/2010-04-01/Accounts/' + accountSid + '/Messages.json',
        method: 'POST',
        headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(messageString),
                    'Authorization': 'Basic ' + new Buffer(accountSid + ':' + authToken).toString('base64')
                 }
    };
    
    // Setup the HTTP request
    var req = https.request(options, function (res) {
 
        res.setEncoding('utf-8');
              
        // Collect response data as it comes back.
        var responseString = '';
        res.on('data', function (data) {
            responseString += data;
        });
        
        // Log the responce received from Twilio.
        // Or could use JSON.parse(responseString) here to get at individual properties.
        res.on('end', function () {
            console.log('Twilio Response: ' + responseString);
            twilioResponse(response, repromptText, cardTitle, true);
        });
    });
    
    // Handler for HTTP request errors.
    req.on('error', function (e) {
        console.error('HTTP error: ' + e.message);
        twilioResponse(response, repromptText, cardTitle, false);
    });
    
    // Send the HTTP request to the Twilio API.
    // Log the message we are sending to Twilio.
    console.log('Twilio API call: ' + messageString);
    req.write(messageString);
    req.end();
}

function twilioResponse(response, repromptText, cardTitle, eventCallback) {

    if (eventCallback) { 
    // confirmation that text was sent to user via Twilio
        speechText = "I just texted you the address, enjoy the grub."
        response.tellWithCard(speechText, repromptText, cardTitle, speechText);
    } else {
        speechText = "Twilio was having issues with sending your message."
        response.tellWithCard(speechText, repromptText, cardTitle, speechText);
    }
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the WhatsForLunch Skill.
    var skill = new WhatsForLunch();
    skill.execute(event, context);
};


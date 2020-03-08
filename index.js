/*  Ryan Doering
    10159767
    SENG 513 
    Assignment 3
    March 8th 2020
    index.js -- SERVER
*/

//Cookies are not working

//Init all of the needed io, express and sockets
let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
var cookieParser = require('cookie-parser'); //Not using
app.use(cookieParser()); //Not using
 
var listOfUsers = []; //A list to hold all of the online users
var listOfMessages = []; //A list to hold all of the messages for new joiners

var newUser; //A new user variable

http.listen(3000, function() {
    console.log("Listening on *:3000");
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html'); //Send my html file to the user
});

//Once a user is connected to the server
io.on('connection', function(socket) 
{
    let id = socket.id; //Get the id to use for unique username at the start

    newUser = {
        cookie: id,
        username: id,
        nameColor: 'FFFFFF',
        key: id,
    };

    listOfUsers.push(newUser); //Add new user to the list

    sendUserList(listOfUsers); //send the list of online users to the client to display 

    socket.emit('update messages', listOfMessages); //New user will get all of the previous messages from the chat

    socket.broadcast.emit('user join', newUser.username, newUser.nameColor); //on first join

    socket.emit('your info', newUser.username); //Tell you who you are, what username was given to you, and only you 

    socket.on('chat message', function(msg) //When the user chats
    {
        msg.time = currentTime(); //get the current time for the message

        var index = compareID(id); //Compare the id with the username in order to get the index of the online user

        //check for the change of usernames and user color here
        if (msg.message.includes("/nickcolor"))
        {
            var split = msg.message.split(" "); //split the message to get the parts
            if (split[0] == "/nickcolor") //if the first part is /nickcolor 
            {
                //Check that the given color isnt the same as backgrounds
                if ((split[1] == "808080") | (split[1] == "666666") | (split[1] == undefined) | (split[1] == "grey") | (split[1] == "Grey"))
                {
                    socket.emit('color error', ''); //give an error to client if user picks a background color
                }
                else //The user picked a valid color
                {
                    listOfUsers[index].nameColor = split[1]; //update the nameColor for the user
                    sendUserList(listOfUsers); //send the list of users to client to be updated with the chosen color
                    socket.emit('name update', listOfUsers[index].username, listOfUsers[index].nameColor); //Send a name update back to the client
                }
            }
        }
        else if (msg.message.includes("/nick")) //Used to change nicknames 
        {
            var split = msg.message.split(" "); //Split the message up 
            if ((split[0] == "/nick") & (split[1] != "")) 
            {
                if (!checkUsername(split[1], listOfUsers)) //Check to see if the name was taken already first
                {
                    listOfUsers[index].username = split[1];
                    id = split[1]; //change the id for the user checker
                    sendUserList(listOfUsers); //Send user list to client
                    socket.emit('name update', listOfUsers[index].username, listOfUsers[index].nameColor); //on name change to client
                }
                else
                {
                    socket.emit('name error', split[1]); //send an error to the client that the name is already been chosen 
                }
            }
        }
        else if (msg.message.includes("/")) 
        {
            socket.emit('slash error', '');  //send a message to the client that the "/" message given is not usable 
        }
        else 
        {
            msg.color = listOfUsers[index].nameColor;
            msg.user = listOfUsers[index].username;
            msg.index = index;

            listOfMessages.push(msg); //Add the message to the list for later
            io.emit('chat message', msg); //send the chat message to the client to display
        }
    });

    //When a user disconnects from the chat 
    socket.on('disconnect', function()
    {
        var index = compareID(id);

        socket.broadcast.emit('user leave', listOfUsers[index].username, listOfUsers[index].nameColor); //on disconnect from chat

        listOfUsers.splice(index, 1); //Take off the user from the list
        sendUserList(listOfUsers); //send a new updated list of users to the client to print out
    })
});

//Helper functions

//Function to check the given username to see if it is the online users list
function checkUsername (newName, list) {
    for (var i = 0; i < list.length; i++)
    {
        if (list[i].username == newName)
        {
            return 1; //Return true
        }
    }
    return 0; //Return false
}

//Sends the updated user list to the client to display the online users
function sendUserList(list) 
{
    io.emit('update users', list); //update the users list of the client
}

//function to get the current time of message sent
function currentTime() 
{
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds(); //gets time in hours, minutes and seconds
    return time; //Give time for message
}

//Function to compare the id given to see if it matches one of the usernames
function compareID(id) 
{
    for (var i = 0; i < listOfUsers.length; i++) //Go through all users
    {
        if (id == listOfUsers[i].username)
        {
            return i; //Return index of user
        }
    }
    return -1; //Return -1 if no user
}


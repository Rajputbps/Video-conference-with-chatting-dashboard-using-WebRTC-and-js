var conn = new WebSocket('ws://localhost:8080/socket');
var loginBtn = document.querySelector("#connection");
var joinbtn = document.querySelector("#joinRoom");
var userForm = document.querySelector('#messageField');
var username = null;
var connectedUser, dataChannel;
const myVideo = document.createElement('video');

$(document).ready(function () {
    var configuration = {
        "iceServers": [{
            "url": "stun:stun2.1.google.com:19302"
        }]
    };
    const peerConnection = new RTCPeerConnection(configuration, {
        optional: [{
            RtpDataChannels: true
        }]
    });

    dataChannel = peerConnection.createDataChannel("dataChannel", { reliable: true });
    dataChannel.onerror = function (error) {
        console.log("Error:", error);
    };
    dataChannel.onclose = function () {
        console.log("Data channel is closed");
    };


    var constraints = {
        myVideo: {
            frameRate: {
                ideal: 10,
                max: 15
            },
            facingMode: "user"
        }
    };

    $("#chattingField").hide();

    //when a user clicks the login button 
    loginBtn.addEventListener("click", function (event) {
        username = document.querySelector('#name').value.trim()
        if (username.length > 0) {
            $("#userDetails").hide();
            send({
                event: "login",
                data: username
            });
        }
        connectedUser = username;
        $("#chattingField").show();
        accessMedia();
        event.preventDefault();
    });


    conn.onopen = function () {
        console.log("Connected");
    };

    //handle messages from the server 
    conn.onmessage = function (message) {
        // alert(data.name);
        console.log("Got message", message.data);
        var data = JSON.parse(message.data);
        switch (data.event) {
            case "login":
                onLogin(data.success);
                break;
            case "offer":
                onOffer(data.data, data.name);
                break;
            case "answer":
                onAnswer(data.data);
                break;
            case "candidate":
                onCandidate(data.data);
                break;
            default:
                alert("no case fund")
                break;
        }
    };



    function onLogin(message) {
        if (message === false) {
            console.log("sorry Login faild");
        }
        else {
            peerConnection.onicecandidate = function (event) {
                if (event.candidate) {
                    send({
                        event: "candidate",
                        data: event.candidate
                    });
                }
            };
            openDataChannel();
        }
    }

    conn.onerror = function (error) {
        alert(`[error] ${error.message}`);
    };


    //Join room
    joinbtn.addEventListener('click', function (event) {
        connectedUser = null;
        connectedUser = document.querySelector('#name').value.trim();
        if (connectedUser.length > 0) {
            peerConnection.createOffer(function (offer) {
                send({
                    event: "offer",
                    data: offer
                });
                peerConnection.setLocalDescription(offer);
            }, function (error) {
                console.log("Error:" + error);
            });
        }
        event.preventDefault();
    });



    //when somebody wants to call us 
    function onOffer(offer, name) {
        connectedUser = name;
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        peerConnection.createAnswer(function (answer) {
            peerConnection.setLocalDescription(answer);

            send({
                event: "answer",
                data: answer
            });

        }, function (error) {
            alert("oops...error");
        });

    }

    //when another user answers to our offer 
    function onAnswer(answer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

    }

    //when we got ice candidate from another user 
    function onCandidate(candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }



    peerConnection.onaddstream = function (event) {
        var remoteVideo = document.createElement('video');
        videoStream(event.stream, remoteVideo);
    };

    function accessMedia() {
        myVideo.muted = true;
        const constraints = {
            video: true, audio: true
        };
        navigator.mediaDevices.getUserMedia(constraints).
            then(function (stream) {
                videoStream(stream, myVideo);
            })
            .catch(function (err) {
                console.log(err);
            });
    }

    function videoStream(stream, video) {
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
            video.play();
            peerConnection.addStream(stream);
        })
        video.id = 'index-video';
        var videoDiv = document.createElement('div');
        videoDiv.className = 'col-md-6 videodiv';
        document.getElementById('video-grid').appendChild(videoDiv);
        videoDiv.append(video);
    }

    //text chat message

    function openDataChannel() {

    }

    //when a user clicks the send message button 
    userForm.addEventListener("submit", function (event) {
        console.log("send message");
        var val = document.getElementById("umessage").value;
        var li = document.createElement('li');
        li.className = 'list-group-item list-group-item-primary ml-5 mt-1 mb-1';
        li.appendChild(document.createTextNode(val));
        $("#chatting").append(li);
        dataChannel.send(val);
        event.preventDefault();

    });

    dataChannel.onmessage = function (event) {
        console.log("Message:", event.data);
        var li = document.createElement('li');
        li.className = 'list-group-item list-group-item-info mr-5 mt-1 mb-1';
        li.appendChild(document.createTextNode(event.data));
        $("#chatting").append(li);
    };

    function send(message) {
        if (connectedUser) {
            message.name = connectedUser;
        }
        conn.send(JSON.stringify(message));
    };


});


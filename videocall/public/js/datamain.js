'use strict';


// Define peer connections, streams and video elements.
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const sendText = document.getElementById('sendtext');
const recvText = document.getElementById('recvtext');

let localStream;
let remoteStream;

let peerObj;
let connectedUser = null;

// Define action buttons.
const startButton = document.getElementById('startButton');
const videoButton = document.getElementById('videoButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const textButton = document.getElementById('textButton');
const sendTextButton = document.getElementById('sendtextButton');

videoButton.disabled = true;
callButton.disabled = true;
hangupButton.disabled = true;
textButton.disabled = true;
sendTextButton.disabled = true;

startButton.addEventListener('click', startAction);
videoButton.addEventListener('click', videoAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);
textButton.addEventListener('click', textAction);;
sendTextButton.addEventListener('click', sendTextAction);


function startAction() {
  startButton.disabled = true;
  const servers = [{urls: ["stun.l.google.com:19302"]}];
  peerObj = new RTCPeerConnection(servers);
  videoButton.disabled = false;  // Enable call button.
  textButton.disabled = false;  // Enable call button.
  console.log("completed the RTCPeerConnection");
  console.log(peerObj);
  logit("completed the RTCPeerConnection object, " + peerObj.localDescription.type);
  let stateText = "iceconnectionstatechange" +
      "</br>iceConnectionState => " + peerObj.iceConnectionState +
      "</br>iceGatheringState => " + peerObj.iceGatheringState +
      "</br>localDescription => " + peerObj.localDescription.type +
      "</br>";
  logit(stateText);


  peerObj.addEventListener('icecandidate', function (event) {
    const iceCandidate = event.candidate;
    if (iceCandidate) {
      console.log(iceCandidate);
      logit(iceCandidate.candidate);
      iceCandidate.type = "candidate";
      sendMsg({"type": "candidate", "iceCan": iceCandidate});
    }
  });
  peerObj.addEventListener('addstream', function (event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
  });
  peerObj.addEventListener('track', function (event) {
    console.log("track ***********************************");
  });

  peerObj.addEventListener('iceconnectionstatechange', function (event) {
    console.log(event.target);
    let stateText = "iceconnectionstatechange" +
        "</br>iceConnectionState => " + event.target.iceConnectionState +
        "</br>iceGatheringState => " + event.target.iceGatheringState +
        "</br>localDescription => " + event.target.localDescription.type +
        "</br>";
    logit(stateText);
  });
  peerObj.addEventListener('onsignalingstatechange', function (event) {
    logit('onsignalingstatechange' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onconnectionstatechange', function (event) {
    logit('onconnectionstatechange' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onicegatheringstatechange', function (event) {
    logit('onicegatheringstatechange' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onidentityresult', function (event) {
    logit('onidentityresult' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onidpassertionerror', function (event) {
    logit('onidpassertionerror' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onidpvalidationerror', function (event) {
    logit('onidpvalidationerror' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onnegotiationneeded', function (event) {
    logit('onnegotiationneeded' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onpeeridentity', function (event) {
    logit('onpeeridentity' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onremovestream', function (event) {
    logit('onremovestream' + " " + Object.keys(event));
  });
  peerObj.addEventListener('onsignalingstatechange', function (event) {
    logit('onsignalingstatechange' + " " + Object.keys(event));
  });



  var localnode = document.getElementById('localid').value;
  var ref = firebase.database().ref('message_list/' + localnode);
  ref.set(null);
  ref.on('child_added', function(childSnapshot, prevChildKey) {
    let msg = childSnapshot.val();
    let data = JSON.parse(msg.msg);
    console.log("Got message", data.type);

    switch(data.type) {
      case "login":               //  not used
         onLogin(data.success);
         break;
      case "offer":
         onOffer( data, msg.fm );
         break;
      case "answer":
         onAnswer(data);
         break;
      case "candidate":
         console.log("in candidate case");
         console.log(data);
         onCandidate(data);  //?????????
         break;
      default:
         break;
    }
  });
}

function videoAction() {
  console.log('Requesting local stream.');
  videoButton.disabled = true;
  navigator.mediaDevices.getUserMedia({video: true,})
    .then(function (mediaStream) {
      localVideo.srcObject = mediaStream;
      localStream = mediaStream;
      callButton.disabled = false;  // Enable call button.
      peerObj.addStream(localStream);
    })
    .catch(function (e){
      console.log(e);
    });
}

function textAction() {
  alert("textAction");
  textButton.disabled = true;
  sendTextButton.disabled = false;
}

function sendTextAction(text) {
  alert("sendTextAction");
}

function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  connectedUser = document.getElementById('remoteid').value;
  peerObj.createOffer({offerToReceiveVideo: 1,})
    .then((localdescription) => {
      peerObj.setLocalDescription(localdescription);
      console.log("created offer");
      sendMsg( localdescription );
    });
}

function onOffer( sdp, fm ) {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log("in onOffer");
  connectedUser = fm;
  peerObj.setRemoteDescription( sdp );
  peerObj.createAnswer(function (answer) {
    peerObj.setLocalDescription(answer);
    console.log("sending answer");
    sendMsg(answer);
  }, function (error) {
    alert("oops...error");
  });
}

//when another user answers to our offer
function onAnswer(answer) {
   peerObj.setRemoteDescription(answer);
}

function onCandidate(data) {
  const newIceCandidate = new RTCIceCandidate(data.iceCan);
  peerObj.addIceCandidate(newIceCandidate)
    .then(() => {
      console.log("ice candidate success");
    }).catch((error) => {
      console.log("connection failure");
    });
}

function hangupAction() {
  peerObj.close();
  peerObj = null;
  localVideo.srcObject = null;
  localStream = null;
  remoteVideo.srcObject = null;
  remoteStream = null;
  hangupButton.disabled = true;
  startButton.disabled = false;
  console.log('Ending call.');
}

function sendMsg(msg) {
  var localnode = document.getElementById('localid').value;
  var nodeparams = {"msg": JSON.stringify(msg)}
  nodeparams.fm = localnode;
  var messageListRef = firebase.database().ref('message_list/' + connectedUser);
  var newMessageRef = messageListRef.push();
  newMessageRef.set(nodeparams)
      .then(function (e) {console.log("pushed it to firebase");})
      .catch(function (e) {console.log(e);});
}

function logit(text) {
  let timestamp = Date.now();
  let logarea = document.getElementById('logarea');
  let newPara = document.createElement('p');
  newPara.innerHTML = timestamp + " " + text;
  logarea.appendChild(newPara);
}

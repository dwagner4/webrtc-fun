'use strict';


// Define peer connections, streams and video elements.
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;

// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

callButton.disabled = true;
hangupButton.disabled = true;

startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);

function startAction() {
  startButton.disabled = true;
  navigator.mediaDevices.getUserMedia({video: true,})
    .then(function (mediaStream) {
      localVideo.srcObject = mediaStream;
      localStream = mediaStream;
      callButton.disabled = false;  // Enable call button.
    })
    .catch(function (e){
      console.log(e);
    });
  console.log('Requesting local stream.');
}

function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  const servers = null;  // Allows for RTC server configuration.

  // Create peer connections and add behavior.
  localPeerConnection = new RTCPeerConnection(null);
  localPeerConnection.addEventListener('icecandidate', handleConnection);
  localPeerConnection.addEventListener(
    'iceconnectionstatechange', function (event) {
      console.log(event.target);
    });

  remotePeerConnection = new RTCPeerConnection(null);
  remotePeerConnection.addEventListener('icecandidate', handleConnection);
  remotePeerConnection.addEventListener(
    'iceconnectionstatechange', function (event) {
      console.log(event.target);
    });
  remotePeerConnection.addEventListener('addstream', function (event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
  });

  // Add local stream to connection and create offer to connect.
  localPeerConnection.addStream(localStream);

  localPeerConnection.createOffer({offerToReceiveVideo: 1,})
    .then(createdOffer).catch(function (e) {console.log(e);});
}

function hangupAction() {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  console.log('Ending call.');
}

// Connects with new peer candidate.
function handleConnection(event) {
  const peerConnection = event.target;
  const iceCandidate = event.candidate;

  if (iceCandidate) {
    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = (peerConnection === localPeerConnection) ?
        remotePeerConnection : localPeerConnection;;

    otherPeer.addIceCandidate(newIceCandidate)
      .then(() => {
        console.log("ice candidate success");
      }).catch((error) => {
        console.log("connection failure");
      });

    console.log(`ICE candidate:\n` + `${event.candidate.candidate}.`);
  }
}

// Logs offer creation and sets peer connection session descriptions.
function createdOffer(description) {
  localPeerConnection.setLocalDescription(description)
    .then(() => {
      console.log("localPeerConnection");
    }).catch(function (e) {console.log(e);});

  remotePeerConnection.setRemoteDescription(description)
    .then(() => {
      console.log("remotePeerConnection");
    }).catch(function (e) {console.log(e);});

  remotePeerConnection.createAnswer()
    .then(createdAnswer)
    .catch(function (e) {console.log(e);});
}

// Logs answer to offer creation and sets peer connection session descriptions.
function createdAnswer(description) {
  remotePeerConnection.setLocalDescription(description)
    .then(() => {
      console.log("remotePeerConnection");
    }).catch(function (e) {console.log(e);});

  localPeerConnection.setRemoteDescription(description)
    .then(() => {
      console.log("localPeerConnection");
    }).catch(function (e) {console.log(e);});
}

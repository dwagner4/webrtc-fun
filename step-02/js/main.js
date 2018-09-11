'use strict';


// Define peer connections, streams and video elements.
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeerConnection;
// let remotePeerConnection;

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

  const servers = [{urls: ["stun.l.google.com:19302"]}];
  localPeerConnection = new RTCPeerConnection(servers);
  console.log("completed the RTCPeerConnection");
  console.log(localPeerConnection);
  localPeerConnection.addEventListener('icecandidate', function (event) {
    const iceCandidate = event.candidate;
    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      localPeerConnection.addIceCandidate(newIceCandidate)
        .then(() => {
          console.log("ice candidate success");
        }).catch((error) => {
          console.log("connection failure");
        });
    }
  });
  localPeerConnection.addEventListener('iceconnectionstatechange', function (event) {
    console.log(event.target);
  });
  localPeerConnection.addEventListener('addstream', function (event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
  });
  localPeerConnection.addEventListener('track', function (event) {
    console.log("track ***********************************");
  });
}

function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log("localPeerConnection ******************************");
  console.log(localPeerConnection);

  localPeerConnection.addStream(localStream);

  localPeerConnection.createOffer({offerToReceiveVideo: 1,})
    .then(function (description) {
      console.log("created offer");
      console.log(description);
      localPeerConnection.setLocalDescription(description) // Why???
        .then(() => {
          console.log(description);
          console.log("localPeerConnection");
          console.log(localPeerConnection);
        }).catch(function (e) {
          console.log(e);
        });
    });
}

function hangupAction() {
  localPeerConnection.close();
  localPeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  console.log('Ending call.');
}

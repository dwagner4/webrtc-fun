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
  localPeerConnection.addEventListener('icecandidate', function (event) {
    const iceCandidate = event.candidate;
    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      remotePeerConnection.addIceCandidate(newIceCandidate)
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

  remotePeerConnection = new RTCPeerConnection(null);
  remotePeerConnection.addEventListener('icecandidate', function (event) {
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
    .then(function (description) {
      localPeerConnection.setLocalDescription(description)
        .then(() => {
          console.log("localPeerConnection");
        }).catch(function (e) {console.log(e);});

      remotePeerConnection.setRemoteDescription(description)
        .then(() => {
          console.log("remotePeerConnection");
        })
        .catch(function (e) {console.log(e);});

      remotePeerConnection.createAnswer()
        .then(function createdAnswer(description) {
          remotePeerConnection.setLocalDescription(description)
            .then(() => {
              console.log("remotePeerConnection");
            }).catch(function (e) {console.log(e);});

          localPeerConnection.setRemoteDescription(description)
            .then(() => {
              console.log("localPeerConnection");
            }).catch(function (e) {console.log(e);});
        })
        .catch(function (e) {console.log(e);});
    })
    .catch(function (e) {console.log(e);});
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

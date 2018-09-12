'use strict';


// Define peer connections, streams and video elements.
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let peerObj;
// let remotePeerConnection;

// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const answerButton = document.getElementById('answerButton');
const acceptButton = document.getElementById('acceptButton');

callButton.disabled = true;
hangupButton.disabled = true;




startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);
answerButton.addEventListener('click', answerAction);
acceptButton.addEventListener('click', acceptAction);

function startAction() {
  startButton.disabled = true;
  const servers = [{urls: ["stun.l.google.com:19302"]}];
  peerObj = new RTCPeerConnection(servers);
  console.log('Requesting local stream.');
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
  console.log("completed the RTCPeerConnection");

  peerObj.addEventListener('icecandidate', function (event) {
    const iceCandidate = event.candidate;
    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      peerObj.addIceCandidate(newIceCandidate)
        .then(() => {
          console.log("ice candidate success");
        }).catch((error) => {
          console.log("connection failure");
        });
    }
  });
  peerObj.addEventListener('iceconnectionstatechange', function (event) {
    console.log(event.target);
  });
  peerObj.addEventListener('addstream', function (event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
  });
  peerObj.addEventListener('track', function (event) {
    console.log("track ***********************************");
  });

  var localnode = document.getElementById('localid').value;
  var ref = firebase.database().ref('message_list/' + localnode);
  ref.set(null);
  ref.on('child_added', function(childSnapshot, prevChildKey) {
    let msg = childSnapshot.val();
    let data = JSON.parse(msg.msg);
    console.log("Got message", data.type);

    switch(data.type) {
      case "login":
         onLogin(data.success);
         break;
      case "offer":
         // onOffer(data.offer, data.name);
         console.log(Object.keys(data));
         break;
      case "answer":
         onAnswer(data.answer);
         break;
      case "candidate":
         onCandidate(data.candidate);
         break;
      default:
         break;
    }
  });
}

function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log("peerObj ******************************");
  console.log(peerObj);

  peerObj.createOffer({offerToReceiveVideo: 1,})
    .then((localdescription) => {
      let aaa = localdescription;
      console.log("created offer");
      console.log(aaa);
      sendMsg( aaa );
    });
}

function answerAction() {
  let offerObj = JSON.parse(document.getElementById('offerspace').value);
  peerObj.setRemoteDescription(offerObj)
        .then(() => {
          console.log("remotePeerConnection set from caller");
          peerObj.createAnswer()
              .then((description) => {
                console.log("created answer");
                console.log(description);
                let descStr = JSON.stringify(description);
                document.getElementById('answerspace').value = descStr;
              })
              .catch(function (e) {console.log(e);});
        })
        .catch(function (e) {console.log(e);});
}

function acceptAction() {
  let answerObj = JSON.parse(document.getElementById('answerspace').value);
  peerObj.setRemoteDescription(answerObj)
        .then(() => {
          console.log("answer set from caller");
          // peerObj.createAnswer()
          //     .then((description) => {
          //       console.log("created answer");
          //       console.log(description);
          //       let descStr = JSON.stringify(description);
          //       document.getElementById('answerspace').value = descStr;
          //     })
          //     .catch(function (e) {console.log(e);});
        })
        .catch(function (e) {console.log(e);});
}

function hangupAction() {
  peerObj.close();
  peerObj = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  console.log('Ending call.');
}

function sendMsg(msg) {
  console.log("************************************************");
  console.log(msg);
  var remotenode = document.getElementById('remoteid').value;
  var localnode = document.getElementById('localid').value;
  var nodeparams = {"msg": JSON.stringify(msg)}
  nodeparams.fm = localnode;
  var messageListRef = firebase.database().ref('message_list/' + remotenode);
  var newMessageRef = messageListRef.push();
  newMessageRef.set(nodeparams)
      .then(function (e) {console.log("pushed it to firebase");})
      .catch(function (e) {console.log(e);});
}

'use strict';

var peerObj;
var sendChannel;
var receiveChannel;
var pcConstraint = null;
var dataConstraint = null;
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

const callButton = document.getElementById('callButton');


let connectedUser = null;

dataChannelSend.placeholder = '';

startButton.onclick = startAction;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

callButton.addEventListener('click', callAction);

function startAction() {
  startButton.disabled = true;
  const servers = [{urls: ["stun.l.google.com:19302"]}];
  peerObj = new RTCPeerConnection(servers);
  peerObj.addEventListener('icecandidate', function (event) {
    const iceCandidate = event.candidate;
    if (iceCandidate) {
      console.log(iceCandidate);
      logit(iceCandidate.candidate);
      iceCandidate.type = "candidate";
      sendMsg({"type": "candidate", "iceCan": iceCandidate});
    }
  });
  peerObj.ondatachannel = function (event) {
    trace('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
  };

  // sendChannel = peerObj.createDataChannel('sendDataChannel',
  //     dataConstraint);
  // sendChannel.onopen = onSendChannelStateChange;
  // sendChannel.onclose = onSendChannelStateChange;


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

  // peerObj.createOffer().then(
  //   function (desc) {
  //     peerObj.setLocalDescription(desc);
  //     trace('Offer from peerObj \n' + desc.sdp);
  //     remoteConnection.setRemoteDescription(desc);
  //     remoteConnection.createAnswer().then(
  //       function (desc) {
  //         remoteConnection.setLocalDescription(desc);
  //         trace('Answer from remoteConnection \n' + desc.sdp);
  //         peerObj.setRemoteDescription(desc);
  //       },
  //       onCreateSessionDescriptionError
  //     );
  //   },
  //   onCreateSessionDescriptionError
  // );
    startButton.disabled = true;
    closeButton.disabled = false;
  });
}

// function onCreateSessionDescriptionError(error) {
//   trace('Failed to create session description: ' + error.toString());
// }

function callAction() {
  connectedUser = document.getElementById('remoteid').value;
  peerObj.createOffer()
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
   sendChannel = peerObj.createDataChannel('sendDataChannel',
       dataConstraint);
   sendChannel.onopen = onSendChannelStateChange;
   sendChannel.onclose = onSendChannelStateChange;
}


//   peerObj.createOffer().then(
//     function (desc) {
//       peerObj.setLocalDescription(desc);
//       trace('Offer from peerObj \n' + desc.sdp);
//       remoteConnection.setRemoteDescription(desc);
//       remoteConnection.createAnswer().then(
//         function (desc) {
//           remoteConnection.setLocalDescription(desc);
//           trace('Answer from remoteConnection \n' + desc.sdp);
//           peerObj.setRemoteDescription(desc);
//         },
//         function (error) {
//           trace('Failed to create session description: ' + error.toString());
//         }
//       );
//     },
//     function (error) {
//       trace('Failed to create session description: ' + error.toString());
//     }
//   );
// }

function sendData() {
  var data = dataChannelSend.value;
  sendChannel.send(data);
  trace('Sent Data: ' + data);
}

function closeDataChannels() {
  sendChannel.close();
  peerObj.close();
  peerObj = null;
  trace('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  sendButton.disabled = true;
  startButton.disabled = false;;
}







// function iceCallback2(event) {
//   trace('remote ice callback');
//   if (event.candidate) {
//     peerObj.addIceCandidate(
//       event.candidate
//     ).then(
//       onAddIceCandidateSuccess,
//       onAddIceCandidateError
//     );
//     trace('Remote ICE candidate: \n ' + event.candidate.candidate);
//   }
// }

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
}

function receiveChannelCallback(event) {
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace('Received Message');
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace('Receive channel state is: ' + readyState);
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

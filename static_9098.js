var waitingToStart = true;
var listIndex = 0;
/* SPOILER WARNING:
   if you base64-decode this long string, you'll have the questions ahead of time
*/
var data = JSON.parse(atob('W1siR09ET1QiLCJEQVVCIiwxXSxbIlBFU1RPIiwiSE9HIiwyXSxbIlJPUEUiLCJPTkNFIiwxXSxbIkdMQU5DRSIsIk1PREVSTiIsMV0sWyJKT0xUUyIsIlVORk9MRCIsMl0sWyJUSUNLRVIiLCJST1RBVEUiLDJdLFsiU0hJTVMiLCJXSVRIIiwyXSxbIlBIT05FIiwiUEFSQURJU0UiLDFdLFsiV1JBUCIsIkVTQ0FQRSIsMl0sWyJNT1RIIiwiQ0xPVUQiLDFdLFsiRUFTWSIsIlNPTiIsMV0sWyJST0QiLCJJREVBIiwxXSxbIk9WRVJTRUVSIiwiQ1JBV0ZPUkQiLDJdLFsiRFJZU1RPTkUiLCJURUFDSEVSIiwyXSxbIlJPTUVPIiwiSVNMRVMiLDFdLFsiU0FORVNUIiwiQklERVQiLDFdLFsiV09VTkQiLCJQVUIiLDJdLFsiRlJVSVRTIiwiVEVTTEEiLDFdLFsiVE9XTiIsIlZFTkVFUiIsMV0sWyJESU5BUiIsIldISU5FUyIsMl0sWyJPSU5LUyIsIldISU1TIiwyXSxbIkdSQVNTIiwiSEVST0lDUyIsMl0sWyJWT1dFTCIsIldIRUFUIiwxXSxbIlJJRkxFIiwiVEhSRUFEIiwxXSxbIkZMQU1FUyIsIk9VVEVSIiwyXSxbIlRXSU4iLCJTTE9QRSIsMV0sWyJGT1JFIiwiUkVGSU5FRCIsMl0sWyJNVVNJTkciLCJTTFVNUCIsMl0sWyJFUk9TSU9OIiwiUkVOVEFMIiwxXSxbIlNURVdFRCIsIkVVUk9TIiwxXSxbIkZBU1RFRCIsIkZJUkVNQU4iLDFdLFsiRkxPVVIiLCJGTEFJUiIsMl0sWyJQSElMRUJVUyIsIkhJUFNURVIiLDFdLFsiTUlTRVIiLCJGRUxMQSIsMV0sWyJGQUNFVEVEIiwiVk9SQUNJVFkiLDJdLFsiQk9VTERFUiIsIlRIUk9OSU5HIiwxXSxbIkZBVEUiLCJGT1JDRSIsMl0sWyJNWVRIVU5HQSIsIk5JQ0hFIiwyXV0='));

function clicked(num) {
    stopTimer();
    if (waitingToStart) {
	waitingToStart = false;
	listIndex = 0
	setText("think happy thoughts!")
	showNewOptions();
	return 
    }
    var correct = data[listIndex][2];
    if (correct == num) {
	if (document.getElementById("demo").innerHTML == "correct") {
	    setText("yes");
	} else {
	    setText("correct"); 
	}
	listIndex = listIndex + 1;
	if (listIndex == data.length) {
	    winner()
	} else {
	    showNewOptions();
	}
    } else {
	setText("That's not a happy thought! Click any button to restart");
	waitingToStart = true;
	listIndex = 0;
	resetState();
    }
}

function winner() {
    document.getElementById("button1").value = "winner";
    document.getElementById("button2").value = "winner";
    var text = "Winner winner! </br></br>";
    for (var i = 0; i < data.length; i++) {
	text += data[i][0] + " " + data[i][1] + "</br>";
    } 
    setText(text)
    
} 
			
function showNewOptions() {
 document.getElementById("button1").value = data[listIndex][0];
 document.getElementById("button2").value = data[listIndex][1];
 startTimer();
}

function resetState() {
 stopTimer();
 document.getElementById("button1").value = "ready";
 document.getElementById("button2").value = "ready";
}

function setText(text) {
 document.getElementById("demo").innerHTML = text;
}

var interval;
var timeLeft;

function startTimer() {
 stopTimer();
 timeLeft = 12
 interval = setInterval(myTimer, 1000);
}

function stopTimer() {
 clearInterval(interval);
}

function myTimer() {
 showTimeLeft()
 timeLeft = timeLeft - 1; 
 if (timeLeft < 0) {
  outOfTime()
 }
} 

function outOfTime() {
 setText("click any button to restart");
 waitingToStart = true;
 listIndex = 0;
 resetState();
}

function showTimeLeft() {
 if (timeLeft < 0) {
  document.getElementById("timerText").innerHTML = "out of time";
 } else {  
  document.getElementById("timerText").innerHTML = timeLeft;
 }
}

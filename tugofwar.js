goog.require('goog.dom');
goog.require("goog.dom.classlist");
goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.net.XhrIo');
goog.require("goog.json.Serializer");

class TugOfWarWaiter {
    constructor(dispatcher) {
	/** @type{goog.net.XhrIo} */
	this.xhr = new goog.net.XhrIo();
	/** @type{goog.net.XhrIo} */
	this.other_xhr = new goog.net.XhrIo();
	/** @type{number} */
	this.serial = 0;
	/** @type{number} */
	this.backoff = 100;

	/** @type(Dispatcher) */
	this.dispatcher = dispatcher;
    }

    waitcomplete() {
        if (this.xhr.getStatus() == 401) {
            return;
        }

        if (this.xhr.getStatus() != 200) {
            this.backoff = Math.min(10000, Math.floor(this.backoff*1.5));

	    // XXX cancel early for development
	    if (this.backoff > 1000) {
		console.log("aborting retries");
		return;
	    }

            setTimeout(goog.bind(this.xhr.send, this.xhr, "/tugwait/" + waiter_id + "/" + this.serial),
                       this.backoff);
            return;
        }

        this.backoff = 100;

	var msgs = /** @type{Array<Message>} */ (this.xhr.getResponseJson());
	for (var i = 0; i < msgs.length; ++i) {
	    this.serial = /** @type{number} */ (msgs[i][0]);
	    var msg = /** @type{Message} */ (msgs[i][1]);
	    this.dispatcher.dispatch(msg);
	}

        var temp = this.xhr;
        this.xhr = this.other_xhr;
        this.other_xhr = temp;
        this.xhr.send("/tugwait/" + waiter_id + "/" + this.serial);
    }

    start() {
	goog.events.listen(this.xhr, goog.net.EventType.COMPLETE, this.waitcomplete, false, this);
	goog.events.listen(this.other_xhr, goog.net.EventType.COMPLETE, this.waitcomplete, false, this);
	this.xhr.send("/tugwait/" + waiter_id + "/" + this.serial);
    }
}

class TugOfWarCountdown {
    constructor(end_time) {
	this.end_time = end_time;
	this.timer = setInterval(goog.bind(this.update_timer, this), 200);
    }

    reset(end_time) {
	this.end_time = end_time;
	if (!this.timer) {
	    this.timer = setInterval(goog.bind(this.update_timer, this), 200);
	}
	this.update_timer();
    }

    update_timer() {
	var now = (new Date()).getTime() / 1000.0;
	var s = (this.end_time - now) + 1;
	if (s < 0) s = 0;
	var min = Math.trunc(s/60);
	var sec = Math.trunc(s%60);
	var text = "" + min + ":" + (""+sec).padStart(2, "0");
	tugofwar.countdown_text.innerHTML = text;
    }

    finish() {
	clearInterval(this.timer);
	this.timer = null;
	tugofwar.countdown_text.innerHTML = "&nbsp;";
    }
}


class TugOfWarDispatcher {
    constructor() {
	this.methods = {
	    "set_buttons": goog.bind(this.set_buttons, this),
	    "tally": goog.bind(this.tally, this),
	}
    }

    /** @param{Message} msg */
    dispatch(msg) {
	this.methods[msg.method](msg);
    }

    /** @param{Message} msg */
    set_buttons(msg) {
	tugofwar.left_button.innerHTML = msg.left;
	tugofwar.left_button.className = "choice";
	goog.dom.classlist.remove(tugofwar.left_button, "unselect");
	tugofwar.right_button.innerHTML = msg.right;
	tugofwar.right_button.className = "choice";
	goog.dom.classlist.remove(tugofwar.right_button, "unselect");
	if (msg.message) {
	    tugofwar.message.innerHTML = msg.message;
	}
	tugofwar.current_choice = msg.choice;
	if (msg.end_time) {
	    if (tugofwar.countdown) {
		tugofwar.countdown.reset(msg.end_time);
	    } else {
		tugofwar.countdown = new TugOfWarCountdown(msg.end_time);
	    }
	} else {
	    if (tugofwar.countdown) {
		tugofwar.countdown.finish();
		tugofwar.countdown = null;
	    }
	}
    }

    /** @param{Message} msg */
    tally(msg) {
	this.show_voters(tugofwar.left_voters, msg.left);
	this.show_voters(tugofwar.right_voters, msg.right);
	tugofwar.target_pos = 225.0 * msg.net / msg.req;
	if (msg.message) {
	    tugofwar.message.innerHTML = msg.message;
	}

	if (!(typeof msg.select === "undefined")) {
	    console.log("final selection: " + msg.select);
	    if (msg.select == 0 || msg.select == -1) {
		goog.dom.classlist.add(tugofwar.right_button, "unselect");
	    }
	    if (msg.select == 1 || msg.select == -1) {
		goog.dom.classlist.add(tugofwar.left_button, "unselect");
	    }
	    if (tugofwar.countdown) {
		tugofwar.countdown.finish();
	    }
	}
    }

    show_voters(el, voters) {
	goog.dom.removeChildren(el);
	for (var i = 0; i < voters.length; ++i) {
	    if (i > 0) {
		el.appendChild(goog.dom.createElement("BR"));
	    }
	    el.appendChild(goog.dom.createTextNode(voters[i]));
	}
    }
}

function tugofwar_click(which) {
    if (which) {
	tugofwar.left_button.className = "choice";
	tugofwar.right_button.className = "selected";
    } else {
	tugofwar.left_button.className = "selected";
	tugofwar.right_button.className = "choice";
    }

    var username = tugofwar.who.value;
    localStorage.setItem("name", username);
    var msg = tugofwar.serializer.serialize(
	{"choice": tugofwar.current_choice,
	 "who": username,
	 "clicked": which});
    goog.net.XhrIo.send("/tugclick", function(e) {
     	var code = e.target.getStatus();
     	if (code != 204) {
     	    alert(e.target.getResponseText());
     	}
    }, "POST", msg);
}

function tugofwar_move_ball() {
    if (tugofwar.current_pos == tugofwar.target_pos) return;
    tugofwar.current_pos = 0.4 * tugofwar.target_pos + 0.6 * tugofwar.current_pos;
    if (Math.abs(tugofwar.current_pos - tugofwar.target_pos) < 2) {
	tugofwar.current_pos = tugofwar.target_pos;
    }
    tugofwar.target.setAttribute("cx", tugofwar.current_pos);
}

var tugofwar = {
    left_button: null,
    right_button: null,
    left_voters: null,
    right_voters: null,
    message: null,
    countdown: null,
    countdown_text: null,
    who: null,
    tally: null,
    target: null,
    preload: null,
    serializer: null,
    current_choice: null,

    current_pos: 0,
    target_pos: 0,
    mover: null,
}

puzzle_init = function() {
    tugofwar.serializer = new goog.json.Serializer();

    tugofwar.body = goog.dom.getElement("puzz");
    tugofwar.left_button = goog.dom.getElement("left");
    tugofwar.right_button = goog.dom.getElement("right");
    tugofwar.left_voters = goog.dom.getElement("leftvoters");
    tugofwar.right_voters = goog.dom.getElement("rightvoters");
    tugofwar.message = goog.dom.getElement("message");
    tugofwar.who = goog.dom.getElement("who");
    tugofwar.who.value = localStorage.getItem("name");
    tugofwar.countdown_text = goog.dom.getElement("countdown");
    tugofwar.tally = goog.dom.getElement("tally");
    tugofwar.target = goog.dom.getElement("target");

    goog.events.listen(tugofwar.left_button,
		       goog.events.EventType.CLICK,
		       goog.bind(tugofwar_click, null, 0));
    goog.events.listen(tugofwar.right_button,
		       goog.events.EventType.CLICK,
		       goog.bind(tugofwar_click, null, 1));


    tugofwar.mover = setInterval(tugofwar_move_ball, 20);

    tugofwar.waiter = new TugOfWarWaiter(new TugOfWarDispatcher());
    tugofwar.waiter.start();
}


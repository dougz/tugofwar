/** @type{?function()} */
var puzzle_init;

/** @type{number} */
var waiter_id;

/** @type{Storage} */
var localStorage;

class Message {
    constructor() {
	/** @type{string} */
	this.method;
	/** @type{string|Array<string>} */
	this.left;
	/** @type{string|Array<string>} */
	this.right;
	/** @type{?string} */
	this.message;
	/** @type{?number} */
	this.choice;
	/** @type{?number} */
	this.end_time;
	/** @type{?number} */
	this.net;
	/** @type{?number} */
	this.req;
	/** @type{?string} */
	this.matchleft;
	/** @type{?string} */
	this.matchright;
	/** @type{?number} */
	this.matchcorrect;
    }
}

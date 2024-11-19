class BlankClass {};
BLANK = new BlankClass();
class Matcher {
	constructor(call, children, current_auction, meaning, other_classes) {
		this.call = call;
		this.children = children;
		this.current_auction = current_auction;
		this.meaning = meaning;
		this.other_classes = other_classes;
	}
	matches(node) {
		if (this.call !== BLANK && !safe_call_equal(node.call, this.call)) {
			console.log('Mismatched call', this.call, node.call); //TODO: return this error in some meaningful way
			return false;
		}
		if (this.children != BLANK) {
			if (this.children.length != node.children.length) {
				console.log('Mismatched children lengths');
				return false;
			}
			for (let i = 0; i < this.children.length; ++i) {
				if (!this.children[i].matches(node.children[i])) {
					console.log('child mismatched');
					return false;
				}
			}
		}
		if (this.current_auction !== BLANK) {
			if ((this.current_auction !== undefined) !== (node.current_auction !== undefined)) {
				console.log('Mismatched is auction null', this.current_auction, node.current_auction);
				return false;
			}
			if (this.current_auction.length != node.current_auction.
		}
		// for (let i = 0; i < node.children.length; ++i) if (!this.children[i].matches(node.children[i])) return false;
		// if ((this.current_auction === undefined) != (node.current_auction === undefined)) return false;
		// if (this.current_auction !== undefined) {
			// if (this.current_auction.length != node.current_auction.bidding_sequence.length) return false;
			// for (let i = 0; i < node.current_auction.bidding_sequence.length; ++i) if (!safe_call_equal(this.current_auction.length)) return false;
		// }
		// for (let x of this.other_classes) if (!node.other_classes.has(x)) return false;
		// for (let x of node.other_classes) if (!this.other_classes.has(x)) return false;
		// if (this.meaning != node.meaning) return false; //TODO: match with regex
		return true;
	}
};
class Or {
	constructor(matchers) {
		this.matchers = matchers;
	}
	matches(node) {
		for (let x of matchers) if (x.matches(node)) return true;
		return false;
	}
};
class Anything {
	matches(node) {
		return true;
	}
};
function run_tests() {
	if (inputs.length != outputs.length) {
		throw new Error("Mismatched lengths of inputs and outputs");
	}
	let len = inputs.length;
	for (let i = 0; i < len; ++i) {
		let input = inputs[i];
		let output = outputs[i];
		if (input.length != 1) throw new Error("Testing diffing is TODO");
		let node = parse_file(input[0][1]);
		console.log(node);
		console.log(output);
		if (output.matches(node)) {
			console.log("TEST PASSED");
		}
		else {
			console.log("TEST FAILED");
		}
	}
}
function our_call(call_str) {
	return new Call(CALL, parse_call(call_str), OURS);
}
function their_call(call_str) {
	return new Call(CALL, parse_call(call_str), THEIRS);
}
function our_custom_call(call_str) {
	return new Call(CUSTOM_CALL, call_str, OURS);
}
function their_custom_call(call_str) {
	return new Call(CUSTOM_CALL, call_str, THEIRS);
}
function comment(call_str) {
	return new Call(COMMENT, call_str, undefined);
}

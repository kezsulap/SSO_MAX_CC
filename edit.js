function show(with_diff) {
	let content = document.querySelector('#input').value;
	document.querySelector('#errors').innerHTML = ''
	try {
		var node = parse_file(content);
	}
	catch (e) {
		display_error(e, document.querySelector('#errors'))
		return;
	}
	if (with_diff) {
		display(compare([["OLD", original_node], ["NEW", node]]), false)
	}
	else {
		display(node, false)
	}
	add_button('save_button', save, '💾')
	add_button('back_to_edit_button', back_to_edit, 'Back to edit')
	$('#preview_panel').show()
	$('#edit_panel').hide()
}
function save() {
	navigator.clipboard.writeText(document.querySelector('#input').value).then(() => {
		window.open('https://github.com/' + owner + '/' + repo + '/edit/' + versions[0][1] + '/' + versions[0][2])
	})
}
function back_to_edit() {
	$('#edit_panel').show()
	$('#preview_panel').hide()
	document.querySelector('#topmenulist').innerHTML = ''
	document.querySelector('#bidding').innerHTML = ''
}
function init() {
	window.addEventListener('load', function() {
		[owner, repo, versions] = get_versions();
		if (versions.length > 1) {
			display_error('Can\'t run edit on more than one version');
			return;
		}
		let original_file_content = load(get_url(owner, repo, versions[0][1], versions[0][2]));
		document.querySelector('#input').innerHTML = original_file_content;
		try {
			original_node = parse_file(original_file_content)
			set_HTML_title(original_node.title);
		} catch (e) {
			$('#preview_changes').hide()
			original_node = undefined;
		}
	})
}
function split_area() {
	let area = document.querySelector('#input')
	let val = area.value;
	let start = area.selectionStart, end = area.selectionEnd;
	// console.log('before shift', JSON.stringify(val.slice(0, start)), JSON.stringify(val.slice(start, end)), JSON.stringify(val.slice(end)))
	if (start != end) {
		if (start < val.length && val[start] == '\n') start++;
		if (end > 0 && val[end - 1] == '\n') end--;
	}
	while (start > 0 && val[start - 1] != '\n') start--;
	while (end < val.length && val[end] != '\n') end++;
	// console.log('after shift', JSON.stringify(val.slice(0, start)), JSON.stringify(val.slice(start, end)), JSON.stringify(val.slice(end)))
	return [val.slice(0, start), val.slice(start, end).split('\n'), val.slice(end)];
}
function textarea_listener(e) {
	function update(mapper) {
		let area = document.querySelector('#input')
		let [bef, content, aft] = split_area();
		content = content.map(mapper).join('\n')
		area.value = bef + content + aft;
		area.setSelectionRange(bef.length, bef.length + content.length)
		e.preventDefault();
		e.stopPropagation()
	}
	if (e.key == 'Tab') {
		if (e.shiftKey)
			update(x => x.length && x[0] == '\t' ? x.slice(1) : x)
		else
			update(x => '\t' + x)
	}
	function inc_bid(x, val) {
		let split = x.split(/^(\t*)/)
		let pref = split.slice(0, split.length - 1).join('')
		let rest = split[split.length - 1]
		let bid = rest.split(' ');
		console.log(pref, rest, bid)
		try {
			let tried = bid[0];
			let par = tried[0] == '(' && tried[tried.length - 1] == ')';
			let omit_par = par ? tried.slice(1, -1) : tried;
			let parsed = parse_call(omit_par);
			if (parsed > 0 && parsed <= HIGHEST_CONTRACT) {
				let new_call = parsed + val > 0 && parsed + val <= HIGHEST_CONTRACT ? call_to_str(parsed + val) : '--';
				if (par) new_call = '(' + new_call + ')'
				return pref + new_call + (bid.length > 1 ? ' ' : '') + bid.slice(1).join(' ')
			}
		}
		catch (e) { if (!(e instanceof ParsingError)) throw e;}
		return x;
	}
	if (e.key.toLowerCase() == 'b' && e.ctrlKey) {
		update(x => inc_bid(x, 1))
	}
	if (e.key.toLowerCase() == 'y' && e.ctrlKey) {
		update(x => inc_bid(x, -1))
	}
}
init()

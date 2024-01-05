function show(with_diff) {
	let content = document.querySelector('#input').value;
	try {
		var node = parse_file(content);
	}
	catch (e) {
		display_error(e)
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
init()

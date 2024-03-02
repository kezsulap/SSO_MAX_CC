[Polish version]()

[How to get started](https://github.com/kezsulap/SSO_MAX_CC/blob/move-stuff-draft/en-getting-started.md)

[How to edit](https://github.com/kezsulap/SSO_MAX_CC/blob/move-stuff-draft/en-editing.md)

## Having multiple systems 
Github won't allow you to fork the repository more than once on the same account, to have multiple systems go to https://github.com/\<your-username\>/\<your-system-name\>/tree/main type in the name of your new system and hit create branch,
this will create your new system at \<your-username\>.github.io/\<your-system-name\>?v=\<new-system-name\> which will be identical to your main system, go to \<your-username\>.github.io/\<your-system-name\>/edit.html?v=\<new-system-name\>
to edit it the same way as you edit your main system

[How to write description.txt](https://github.com/kezsulap/SSO_MAX_CC/blob/move-stuff-draft/en-description.md)

## Updating the code in the future
To merge all future changes I make to the code go to https://github.com/\<your-username\>/SSO_MAX_CC/tree/code and hit Sync Fork (processing this and actually making your site run with new version of code may again take GitHub a few minutes)

## Giving other people access
To let anyone else edit go to Settings > Collaborators > Add people, find the user you want to give access to, hit "Add <username> to the repository", once they go to github.com/<your-username>/<your-repository-name> they should see an invitation
and once they accept it, they can edit the system the exact same way you do

To revoke someone's access go to Settings > Collaborators > Remove

## Quiz
Go to \<your-username\>.github.io/\<your-repository-name\>/quiz.html or \<your-username\>.github.io/\<your-repository-name\>/quiz.html?v=\<name-of-the-system\> if you have multiple systems in your repository and learn your own system


## Advanced mode

Default index.html loads system description from description.txt on main branch.
You can set any version(s) via URL parameters ?\<V1_NAME\>=v1&\<V2_NAME\>=v2, for example https://kezsulap.github.io/SSO_MAX_CC/index.html?OLD=c9f700339f3c5094ea545bd3b5bc88a748311ad0&NEW=94fca5d0cf06e41dba93c41a173b88510c31dc6f where V1_NAME can by anything, v1 is either `version` `version:file_path` `:file_path`, version could be branch name, commit_id or tag, not specified version defaults to main and file path to description.txt

For local testing/deployment outside of github pages use generate.py `python generate.py -h` for more info when on branch with description. It fetches files from code branch, so keep it up-to-date before running.

If you're using Vim you can copy [vimrc](https://raw.githubusercontent.com/kezsulap/SSO_MAX_CC/code/vimrc) to your .vimrc to have Ctrl+F to fold all the blocks, and Ctrl+J/K to increase/decrease all bids in visual block by 1




## Deployment instruction
Default index.html loads system description from description.txt on main branch if hosted from github pages or asks to paste description manually if any other source, including local.
You can use index.html?file=version or index.html?v1=version1&v2=version2 to display both files and highlight differences between them. Version could be `commit_hash` `branch_name` `:filename` `commit_hash:filename` `branch_name:filename`, for example:
[https://kezsulap.github.io/SSO_MAX_CC/index.html?OLD=c9f700339f3c5094ea545bd3b5bc88a748311ad0&NEW=94fca5d0cf06e41dba93c41a173b88510c31dc6f](https://kezsulap.github.io/SSO_MAX_CC/index.html?OLD=c9f700339f3c5094ea545bd3b5bc88a748311ad0&NEW=94fca5d0cf06e41dba93c41a173b88510c31dc6f)
[https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:tests/custom.txt](https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:tests/custom.txt)

To get index file for hosting on different site run `python generate.py file1.txt [file2.txt] > output.html` which will generate html file displaying one specific file, rather than fetching
from github. Don't overwrite index.html with `python generate.py > index.html` as generate.py script is using it.

## description.txt syntax
### Basic costructive bidding
Indentation only using tabs is supported.
```
opening1 meaning
	response1 meaning
	response2 meaning
		opener_rebid_1 meaning
		opener_rebid_2 meaning
opening2 meaning
	response1 meaning
	response2 meaning
```
Bid's denomination can be described with c/d/h/s or ♣/♦/♥/♠, notrump can be n, nt or ba
Pass can be described as p, pa, pas, pass, double as db, dbl, ktr, x, redouble as rdb, rdbl, re, rktr, xx.
All of this is case-insensitive.
### Competitive bidding
Uses the same format, except opponent's call needs to be parenthesised
Example:
```
1♣ 12+ natural
	(1♠)
		dbl 4+♥
		1NT 7-10 with a ♠ stopper
	(1NT)
		dbl penalty
			(rdbl)
				7♥ = cue-bid
```
Opponent's calls if not included are automatically supposed to be passes, however our bids always have to be present. For example this file is invalid
```
1♣ 12+ natural
	(1♥)
		(1♠)
```
### Defining a sequence 
You can define a sequence once and paste it in multiple places in the file.
Definition example:
```
function 1nt_open(strength)
	1nt $(strength) balanced
		2c Stayman
			2d no 4M
		2d 5+♥
		2h 5+♠
end
```
Call example:
```
1c 12-14 balanced/15+ 5+♣/18+ any
	1d
		:1nt_open(18-21)
:1nt_open(15-17)
```
This would expand to
```
1c 12-14 balanced/15+ 5+♣/18+ any
	1d
		1nt 18-21 balanced
			2c Stayman
				2d no 4M
			2d 5+♥
			2h 5+♠
1nt 15-17 balanced
	2c Stayman
		2d no 4M
	2d 5+♥
	2h 5+♠
```
and then be processed accordingly. Functions are allowed to have multiple comma-seperated parameters, or no parameters at all.
### Suit symbols
Any ♣/♦/♥/♠/!c/!d/!h/!s in call meaning gets automatically replaced with an appropriate symbol and coloured.
### Comments
Anything appearing in a line after a number sign `#` is considered a comment and is ignored. Empty lines including empty after deleting the comment content are allowed and are also ignored.
### Custom calls
Calls can also be defined by text descriptions put in `{}`. Sequences using those are only checked if there's any way of replacing them with any calls to get a valid sequence.
Example:
```
1♣
	({1 level overcall})
		{2 of opponent's suit} something
```

```
1♣
	({some mysterious call})
		dbl
			1♦ #error, insufficient bid
```

```
1♣
	({2 level overcall})
		1NT #clearly not what you intended, but no way for the parser to know it
```
### Notes (BETA)
Line starting with '@' will be considered a note.

Currently notes can only have other notes as subnodes and diffing algorithm for them is very basic.
```
1♣ 8-12 balanced
	@Note this relay is sometimes a bluff
		@just sometimes
	1♦ relay 13+
		1♥ = no 4M, 5m
		1♠ ...
```

## Future updates
Main branch of this repository will contain changes both to the code and to the system. If you're setting up your own instance merge changes to the code only from code branch.

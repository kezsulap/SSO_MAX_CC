Polish below
## How to start
Fork this repository and set the name to 

Create code branch and copy all the commits from my repo (discarding )

Deploy the page via github pages

Go to <your-username>.github.io/<your-fork-name> and your system should be there (it may take github a few minutes to process it and actually make your site happen)

Create description of your system in main:description.txt (intructions below)

##How to edit

##description.txt
```
&Title of the system can be optionally put in the first line of the file after & symbol
pass start each line with the description of the call and then put it's meaning
	1c then describe responses in a line starting with a single tab character
		1d then responses to that bid with double tab character at the start
			1h etc.
			1s and to describe responses for some previous bid use one more tab then the bid we're responding to, so this is a response to 1d
			1n and so is this
			2c Click a bid to fold/unfold direct responses to it
			2d Right click/long tap on a touch-screen to unfold resposnses to it, all subsequent nodes
			2h suit symbols described using either ♠/♥/♦/♣ or !s/!h/!d/!c are automatically replaced with actual symbols and coloured blue/red/orange/green
		1h and this is a response to 1c
			(1s) to describe competitive bidding put a call in parentheses to make it opponent's call
				dbl double can be described as x, dbl, db or ktr
					(rdbl) redouble as xx, rdb, rdbl, rktr or re
						p pass as p, pa, pas, pass
							(PasS) also all bid descriptions can use upper or lowercase letters and it's still fine
								2♦ denomination of suited bids can be described using ♦/d/!d
									2!h 
										2nT notrump can be n/nt/ba
				(2c) it is OK to specify either 2 our or 2 opponent's calls in a row and this assumes the player in-between has passed
@Lines starting with @ are notes they don't describe specific calls, but can be used to convey other information
	@And can also have subnodes as well
@For example
@Slam bidding
	4NT blackwood
		5c 1/4
		5d 0/3
		5h 2 without Q of trumps
		5s 2 with Q of trumps and no side kings
1c
	({1 level overcall}) also you can put any text describing a call in curly braces to mean ({op's call}) or {our call}
		{2 of opponent suit} GF
1d Can have for example %(Qx;JTx;Q98xx;AKx)
	@A hand can be described using this syntax, to indicade a void just leave the space between semicolons blank %(;;;AKQJTxxxxxxxx)
#Lines starting with '#' are ignored by the parser and can be used to make the file more readable for yourself
1h Also you can #put a '#' sign in the middle of the line and everything after it is a comment as well
@Non vulnerable
1nt 12-14
@Vulnerable
#Defining 1nt again would result in an error of redefining a sequence
!1nt 15-17 #you can put ! before the call to override it
	(2c) majors
		x Penalty
	#The same goes for opponent's calls, so (2c) will result in an error
	!(2c) natural #But this is fine
		x Stayman
	
```
This will result in [https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:README-files/en-example1.txt](this output)
###Defining a sequence
If a sequence occurs multiple times can be defined once and pasted into multiple places in the file
```
function 1nt_open(strength, inv_strength) #define a part of code occurring in multiple spaces with naming any parts which are different
	1nt $(strength) balanced
		2c Stayman
			2d no 4M
		2d 5+♥
		2h 5+♠
		2n $(inv_strength), no 4M
end
1c 12-14 balanced/15+ 5+♣/18+ any
	1d 0-6 any
		:1nt_open(18-21, 4-5)
:1nt_open(15-17, 8-9)
```
This would expand to
```
1c 12-14 balanced/15+ 5+♣/18+ any
	1d 0-6 any
		1nt 18-21 balanced
			2c Stayman
				2d no 4M
			2d 5+♥
			2h 5+♠
			2n 4-5, no 4M
1nt 15-17 balanced
	2c Stayman
		2d no 4M
	2d 5+♥
	2h 5+♠
	2n 8-9, no 4M
```
and be processed accordingly to [https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:README-files/en-example2.txt](this output)
```
function after_transfer_to_h()
	1h exactly 3!h
	1s 4!s, no 3!h
	1n etc.
function after_transfer_to_s()
	1s exactly 3!s
	1n etc.
end
function after_transfer_to_nt_after_1c()
	1n automatic with 12-14
	2c 15+ 5+♣
	{2d and higher} 18+ natural
end
function after_transfer_to_nt_after_1d()
	1n 12-14 5332
	2c 12+ 5+♦, 4+♣
	2d 12-14 6+♦
end
function 1_level_transfers(double_transfers_to, which_bidding_after_transfer_to_NT)
	#question mark means the bid will be added only if it's valid, otherwise it'll be omitted with no error
	?dbl 4+!$(double_transfers_to) 
		#variable substitution does basic text substitution before processing the whole line, so all sorts of trickery like this will work
		:after_transfer_to_$(double_transfers_to)() 
	?1d 4+♥ 
		:after_transfer_to_h()
	?1h 4+♠
		:after_transfer_to_s()
	?1s transfer to NT
		:$(which_bidding_after_transfer_to_NT)()
end
1c 12-14 balanced/15+ 5+♣/18+ any
	(dbl)
		pass 0-6PC, any shape
		rdbl 12+, 3+♣
		:1_level_transfers(-, after_transfer_to_nt_after_1c) #double will be considered invalid anyway, $(double_transfers_to) can be set to anything
	(1d)
		:1_level_transfers(h, after_transfer_to_nt_after_1c)
	(1h)
		:1_level_transfers(s, after_transfer_to_nt_after_1c)
1d 12-17 5+♦
	(1h)
		:1_level_transfers(s, after_transfer_to_nt_after_1d)
```
This would expand to
```
1c 12-14 balanced/15+ 5+♣/18+ any
	(dbl)
		pass 0-6PC, any shape
		rdbl 12+, 3+♣
		?dbl 4+!- #invalid double, omitted
			:after_transfer_to_-() 
		?1d 4+♥ 
			:after_transfer_to_h()
		?1h 4+♠
			:after_transfer_to_s()
		?1s transfer to NT
			:after_transfer_to_nt_after_1c()
	(1d)
		?dbl 4+!h 
			:after_transfer_to_h() 
		?1d 4+♥ #insufficient bid, omitted
			:after_transfer_to_h()
		?1h 4+♠
			:after_transfer_to_s()
		?1s transfer to NT
			:after_transfer_to_nt_after_1c()
	(1h)
		?dbl 4+!s
			:after_transfer_to_s() 
		?1d 4+♥ #insufficient bid, omitted  
			:after_transfer_to_h()
		?1h 4+♠ #insufficient bid, omitted
			:after_transfer_to_s()
		?1s transfer to NT
			:after_transfer_to_nt_after_1c()
1d 12-17 5+♦
	(1h)
		?dbl 4+!s
			:after_transfer_to_s() 
		?1d 4+♥  #insufficient bid, omitted
			:after_transfer_to_h()
		?1h 4+♠  #insufficient bid, omitted
			:after_transfer_to_s()
		?1s transfer to NT
			:$after_transfer_to_nt_after_1d()
```
And then to 
```
1c 12-14 balanced/15+ 5+♣/18+ any
	(dbl)
		pass 0-6PC, any shape
		rdbl 12+, 3+♣
		?1d 4+♥ 
			1h exactly 3!h
			1s 4!s, no 3!h
			1n etc.
		?1h 4+♠
			:after_transfer_to_s()
			1s exactly 3!s
			1n etc.
		?1s transfer to NT
			1n automatic with 12-14
			2c 15+ 5+♣
			{2d and higher} 18+ natural
	(1d)
		?dbl 4+!h 
			1h exactly 3!h
			1s 4!s, no 3!h
			1n etc.
		?1h 4+♠
			:after_transfer_to_s()
			1s exactly 3!s
			1n etc.
		?1s transfer to NT
			1n automatic with 12-14
			2c 15+ 5+♣
			{2d and higher} 18+ natural
	(1h)
		?dbl 4+!s
			1s exactly 3!s
			1n etc.
		?1s transfer to NT
			1n automatic with 12-14
			2c 15+ 5+♣
			{2d and higher} 18+ natural
1d 12-17 5+♦
	(1h)
		?dbl 4+!s
			:after_transfer_to_s() 
			1s exactly 3!s
			1n etc.
		?1s transfer to NT
			1n 12-14 5332
			2c 12+ 5+♦, 4+♣
			2d 12-14 6+♦

```
Eventually resulting in [https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:README-files/en-function-example3.txt](this output)
###Arithmetic operators in functions
Functions support addition and subtractions of variables on numbers and calculating bid x steps above/below some bid
```
function open_1s(lower_strength)
	!1s 5+♠ $(lower_strength)-$(lower_strength + 5) PC
		1n $(17 - lower_strength)-$(20 - lower_strength) PC, no 4♠
		2c $(24 - lower_strength)+PC, GF
end
@Nonvulnerable
:open_1s(10)
@Both red
:open_1s(11)
@Red vs White
:open_1s(12)
```
[https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:README-files/en-function-example4.txt](Output)
```
function kings(start_bid)
	?$(start_bid) no kings
	$(start_bid + 1) king of ♣ or ♦+♥
	$(start_bid + 2) king of ♦ or ♣+♥
	$(start_bid + 3) king of ♥ or ♣+♦
	$(start_bid + 4) kings of ♣+♦+♥
end
4NT blackwood on !s
	5c 1/4
		5d ask for Q of ♠
			5h no
			@other show Q of ♠
			:kings(5s)
	5d 0/3
		5h ask for Q of ♠
			5s no
			@other show Q of ♠
			:kings(5n)
	5h 2 without Q
		5n ask for Ks
			:kings(6c)
		(dbl)
			pass ask for Ks
				xx no kings
				:kings(5h) #response 5h will be omitted as it's insufficient, that's a workaround to make show only responses with 1 or more kings
```
[https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:README-files/en-function-example5.txt](Output)
## Deployment instruction
Default index.html loads system description from description.txt on main branch if hosted from github pages or asks to paste description manually if any other source, including local.
You can use index.html?file=version or index.html?v1=version1&v2=version2 to display both files and highlight differences between them. Version could be `commit_hash` `branch_name` `:filename` `commit_hash:filename` `branch_name:filename`, for example:
[https://kezsulap.github.io/SSO_MAX_CC/index.html?OLD=c9f700339f3c5094ea545bd3b5bc88a748311ad0&NEW=94fca5d0cf06e41dba93c41a173b88510c31dc6f](https://kezsulap.github.io/SSO_MAX_CC/index.html?OLD=c9f700339f3c5094ea545bd3b5bc88a748311ad0&NEW=94fca5d0cf06e41dba93c41a173b88510c31dc6f)
[https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:tests/custom.txt](https://kezsulap.github.io/SSO_MAX_CC/index.html?v=:tests/custom.txt)

To get index file for hosting on different site run `python generate.py file1.txt [file2.txt] > output.html` which will generate html file displaying one specific file, rather than fetching
from github. Don't overwrite index.html with `python generate.py > index.html` as generate.py script is using it.

## description.txt syntax
### System title
Put
```
&Title
```
anywhere in the system file to set title at the top of the page and HTML page title
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

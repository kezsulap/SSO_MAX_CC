if [ -z "$@" ]; then
	python3 <(git show code:generate.py) <(git show main:description.txt)
else
	python3 <(git show code:generate.py) "$@"
fi

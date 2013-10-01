tell application "iTunes" to tell artwork 1 of current track
	set d to raw data
	if format is Çclass PNG È then
		set x to "png"
	else
		set x to "jpg"
	end if
end tell

set targetFile to ((system attribute "HOME") & "/Documents/code/lights/.cover." & x)
set b to open for access targetFile with write permission
set eof b to 0
write d to b
close access b
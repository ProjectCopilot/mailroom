#!/bin/bash
# Copyright (c) 2016 Phillip Tang <tangphillip@gmail.com>
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.

# Ankit does not like this code but does not care enough to actually make it
# good. If you're free or interested in bash, please rewrite this so it doesn't
# seem so hacky. Or write a pretty node module to do it right. (Or even a
# Python script. Anything but bash for the love of all that's good.)

# Based the work of Bart Nagel <bart@tremby.net>
# If you have rate limit issues, get your own key at http://api.imgur.com/
CLIENT_ID=$2

# function to output usage instructions
function usage {
	echo "Usage: $(basename "$0") [filenames]
Upload images to imgur, print their URLs to stdout, and print the delete pages URL to stderr.
If you don't especify any filename, they will be read from standard input." >&2
}

function upload_image {
	# the "Expect: " header is to get around a problem when using this through the
	# Squid proxy. Not sure if it's a Squid bug or what.
	curl \
		-H "Authorization: Client-ID $CLIENT_ID" \
		-H "Expect: " \
		-F "image=@$1" \
		https://api.imgur.com/3/image 2>/dev/null
}

function parse_url_from_response {
	echo "$1" | sed -E 's/.*"link":"([^"]+)".*/\1/' | sed "s|\\\\/|/|g"
}

function parse_delete_url_from_response {
	echo "$1" | sed -E 's/.*"deletehash":"([^"]+)".*/\1/' | sed "s|^|http://imgur.com/delete/|"
}

# check arguments
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
	usage
	exit 0
fi

# get list of files either from arguments or standard input
files_to_upload=""

while [[ $# -gt 0 ]]; do
	if [ -z "$files_to_upload" ]; then
		files_to_upload="$1"
	else
		files_to_upload="$files_to_upload"$'\n'"$1"
	fi
	shift
done


# handle filenames with spaces gracefully
# sadly, it will croak when a filename has a newline
# then again, it's kinda users fault on that case
ifs_old=$IFS
IFS=$'\n'

# upload the images one at a time
list_urls=""
for file in $files_to_upload; do
	response=$(upload_image "$file" "$CLIENT_ID")

	# verify the upload
	# this stops the batch operation, which seems the best course of action
	# since the script has such detailed error levels
	if [ $? -ne 0 ]; then
		exit 2
	elif [ "$(echo "$response" | grep -c "<error_msg>")" -gt 0 ]; then
		echo "Error: ENOSPC"
		echo "$response" | sed -E 's/.*<error_msg>(.*)<\/error_msg>.*/\1/' >&2
		exit 3
	elif [[ "$response" != *deletehash* ]]; then
		echo "Error: ENOSPC"
		exit 4
	fi

	# parse the response and output our stuff
	url=$(parse_url_from_response "$response")
	deleteurl=$(parse_delete_url_from_response "$response")

	# add the url to the list for later clipboard manipulation
	# avoid adding a trailing newline at the end
	if [ -z "$list_urls" ]; then
		list_urls="$url"
	else
		list_urls="$list_urls"$'\n'"$url"
	fi

	echo "$url"
done
IFS=$ifs_old

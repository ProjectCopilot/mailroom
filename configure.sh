#!/bin/bash
set -eo pipefail

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG=$BASEDIR/.env

echo "What hostname do you want to run the app on?"
read HOST >$(tty)
echo "What port do you want to run the listener on?"
read PORT >$(tty)
echo "What is the hash length?"
read HASH_LENGTH >$(tty)
echo "What is the hash salt?"
read HASH_SALT >$(tty)

cat <<EOF > $CONFIG
HOSTNAME=$HOST
PORT=$PORT
HASH_LENGTH=$HASH_LENGTH
HASH_SALT=$HASH_SALT
EOF


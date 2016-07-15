#!/bin/bash
set -eo pipefail

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG=$BASEDIR/.env

echo "What hostname do you want to run the app on?"
read HOST
echo "What port do you want to run the listener on?"
read PORT
echo "What is the hash length?"
read HASH_LENGTH
echo "What is the hash salt?"
read HASH_SALT

cat <<EOF > $CONFIG
HOSTNAME=$HOST
PORT=$PORT
HASH_LENGTH=$HASH_LENGTH
HASH_SALT=$HASH_SALT
EOF


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
echo "Firebase JSON key path?"
read FB_KEY_PATH
echo "Firebase database URL?"
read FB_URL
echo "Twilio account SID?"
read TWILIO_ACCOUNT_SID
echo "Twilio auth token?"
read TWILIO_AUTH_TOKEN
echo "Twilio phone number?"
read TWILIO_PHONE_NUMBER
echo "SendGrid API Key?"
read SENDGRID_API_KEY
echo "SendGrid email?"
read SENDGRID_EMAIL

cat <<EOF > $CONFIG
HOSTNAME=$HOST
PORT=$PORT
HASH_LENGTH=$HASH_LENGTH
HASH_SALT=$HASH_SALT
FIREBASE_KEY_PATH=$FB_KEY_PATH
FIREBASE_URL=$FB_URL
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER
SENDGRID_API_KEY=$SENDGRID_API_KEY
SENDGRID_EMAIL=$SENDGRID_EMAIL
EOF

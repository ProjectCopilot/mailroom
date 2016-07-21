#!/bin/bash
set -eo pipefail

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

npm install --prefix $BASEDIR $BASEDIR
npm install --prefix $BASEDIR/copilot-communications
npm install --prefix $BASEDIR/copilot-prioritize

#!/bin/sh
set -a
. ./.env
set +a
node dist/index.js

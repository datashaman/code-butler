#!/usr/bin/env bash

TEMPLATE="${1}"
DESTINATION="${2}"

DIRNAME=$(dirname "${DESTINATION}")
BASENAME=$(basename "${DESTINATION}")

cd "${DIRNAME}"

EXISTS=1
gh repo view "${BASENAME}" || EXISTS=0

if [ "${EXISTS}" -eq 1 ]; then
  echo "Repository ${BASENAME} already exists"
  gh repo clone "${BASENAME}"
else
  gh repo create --public --template "${TEMPLATE}" --clone "${BASENAME}"
fi

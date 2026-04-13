#!/bin/sh
set -eu

postgres_dir="${EMBEDDED_POSTGRES_DATA_DIR:-/var/lib/team-calendar/postgres}"

if [ "$(id -u)" -eq 0 ]; then
  mkdir -p "$postgres_dir"
  chown -R teamcal:teamcal "$postgres_dir"
  exec gosu teamcal "$@"
fi

exec "$@"

#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/cai-tiem-cafe"
MYSQL_CONFIG="/etc/cai-tiem-cafe/mysql-backup.cnf"
DATABASE="cai_tiem_cafe"

if [[ ! -f "$MYSQL_CONFIG" ]]; then
  echo "Missing $MYSQL_CONFIG" >&2
  exit 1
fi

install -d -m 700 "$BACKUP_DIR"
timestamp="$(date +%Y%m%d-%H%M%S)"
mysqldump --defaults-extra-file="$MYSQL_CONFIG" --single-transaction --routines --triggers "$DATABASE" | gzip -9 > "$BACKUP_DIR/${DATABASE}-${timestamp}.sql.gz"
find "$BACKUP_DIR" -maxdepth 1 -type f -name "${DATABASE}-*.sql.gz" -mtime +14 -delete

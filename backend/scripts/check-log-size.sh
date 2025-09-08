#!/bin/bash

LOG_DIR="./logs"
MAX_SIZE_MB=500

if [ ! -d "$LOG_DIR" ]; then
    echo "Logs directory not found: $LOG_DIR"
    exit 1
fi

SIZE_KB=$(du -sk "$LOG_DIR" | cut -f1)
SIZE_MB=$((SIZE_KB / 1024))

echo "Current log directory size: ${SIZE_MB}MB"

if [ $SIZE_MB -gt $MAX_SIZE_MB ]; then
    echo "WARNING: Log directory size (${SIZE_MB}MB) exceeds threshold (${MAX_SIZE_MB}MB)"
    echo "Current log files:"
    ls -lah "$LOG_DIR"
    echo ""
    echo "Consider:"
    echo "1. Setting LOG_LEVEL=warn in your .env file"
    echo "2. Cleaning old log files: rm -f logs/*.log*"
    echo "3. Reducing maxFiles in logger.js configuration"
    exit 1
else
    echo "Log size is within acceptable limits"
fi
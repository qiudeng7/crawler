#!/bin/bash

# Script to kill processes by port with user confirmation
# Usage: ./kill-port.sh <port_number>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <port_number>"
    echo "Example: $0 3000"
    exit 1
fi

PORT=$1

# Validate port number
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    echo "Error: Please provide a valid port number (1-65535)"
    exit 1
fi

echo "Searching for processes using port $PORT..."
echo "=================================="

# Find processes using the port (works on Linux and macOS)
if command -v lsof >/dev/null 2>&1; then
    # Use lsof if available (more detailed info)
    PROCESSES=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PROCESSES" ]; then
        echo "Processes found using port $PORT:"
        lsof -i:$PORT
        echo "=================================="

        # Get PIDs
        PIDS=$(lsof -ti:$PORT)
        echo "PIDs: $PIDS"
        echo ""

        # Ask for confirmation
        read -p "Do you want to kill these processes? [Y/n] " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            echo "Killing processes..."
            kill -9 $PIDS
            if [ $? -eq 0 ]; then
                echo "Successfully killed processes on port $PORT"
            else
                echo "Error: Failed to kill some processes"
                exit 1
            fi
        else
            echo "Operation cancelled."
            exit 0
        fi
    else
        echo "No processes found using port $PORT"
    fi
elif command -v netstat >/dev/null 2>&1; then
    # Fallback to netstat if lsof is not available
    PROCESSES=$(netstat -tlnp 2>/dev/null | grep ":$PORT ")
    if [ -n "$PROCESSES" ]; then
        echo "Processes found using port $PORT:"
        echo "$PROCESSES"
        echo "=================================="

        # Extract PIDs
        PIDS=$(echo "$PROCESSES" | awk '{print $7}' | cut -d'/' -f1 | grep -E '^[0-9]+$')
        if [ -n "$PIDS" ]; then
            echo "PIDs: $PIDS"
            echo ""

            # Ask for confirmation
            read -p "Do you want to kill these processes? [Y/n] " -n 1 -r
            echo ""

            if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
                echo "Killing processes..."
                echo "$PIDS" | xargs kill -9
                if [ $? -eq 0 ]; then
                    echo "Successfully killed processes on port $PORT"
                else
                    echo "Error: Failed to kill some processes"
                    exit 1
                fi
            else
                echo "Operation cancelled."
                exit 0
            fi
        fi
    else
        echo "No processes found using port $PORT"
    fi
else
    echo "Error: Neither lsof nor netstat is available on this system"
    echo "Please install lsof or netstat to use this script"
    exit 1
fi

echo "Done."
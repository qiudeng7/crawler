#!/bin/bash

# Check git staging area
if ! git diff --cached --quiet; then
    echo "Changes detected in staging area, generating commit message..."
    echo ""

    # Get diff content from staging area
    DIFF_CONTENT=$(git diff --cached)
    DIFF_SOURCE="staging area"
else
    # Check if there are any modified files
    if ! git diff --quiet && ! git diff --cached --quiet; then
        echo "No changes in staging area, but found modified files. Generating commit message from all changes..."
        echo ""

        # Get diff content from both working directory and staging area
        DIFF_CONTENT=$(git diff && git diff --cached)
        DIFF_SOURCE="working directory and staging area"
    elif ! git diff --quiet; then
        echo "No changes in staging area, but found modified files. Generating commit message from working directory..."
        echo ""

        # Get diff content from working directory
        DIFF_CONTENT=$(git diff)
        DIFF_SOURCE="working directory"
    else
        echo "No changes found, please make some changes first"
        exit 1
    fi
fi

    # Build prompt for Claude Code
    PROMPT="Generate a commit message following this repository's convention based on the git diff.

Format: type(scope): description

Common types:
- feat: new features
- fix: bug fixes
- refactor: code refactoring
- chore: maintenance tasks
- docs: documentation updates

Common scopes: devcontainer, Dockerfile, cluster, portainer, helm, readme, scripts, etc.

Style guidelines:
- Use lowercase for description
- Start with verb (add, update, fix, enhance, remove, etc.)
- Be concise but descriptive
- No extra explanations, only output the commit message

**!!!Only commit messages are allowed to be output!!!**

Git diff content (from $DIFF_SOURCE):
$DIFF_CONTENT"

    # Call Claude Code in headless mode to generate commit message
    echo "Calling Claude Code to generate commit message..."

    # Start a background process for timing
    seconds=0
    (
        while true; do
            printf "\rWaiting: %ds" $seconds
            sleep 1
            ((seconds++))
        done
    ) &
    TIMER_PID=$!

    # Call Claude Code in headless mode to generate commit message
    COMMIT_MSG=$(echo "$PROMPT" | claude -p --allowedTools "" 2>/dev/null)

    # Kill the timer process and clear the line
    kill $TIMER_PID 2>/dev/null
    printf "\r"

    # Check if commit message was successfully obtained
    if [ -z "$COMMIT_MSG" ]; then
        echo "Error: Unable to get commit message, please check if Claude Code is working properly"
        exit 1
    fi

    # Clean up commit message (remove whitespace characters)
    COMMIT_MSG=$(echo "$COMMIT_MSG" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | head -n 1)

    echo ""
    echo "Generated commit message:"
    echo "------------------------------"
    echo "$COMMIT_MSG"
    echo "------------------------------"
    echo ""

    # Ask user if they want to use this message
    read -p "Do you want to use this commit message? (Y/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        echo "Executing commit..."

        # If no staging area changes, add all modified files first
        if [ "$DIFF_SOURCE" != "staging area" ]; then
            echo "Adding all modified files to staging area..."
            git add -A
        fi

        git commit -m "$COMMIT_MSG"
        if [ $? -eq 0 ]; then
            echo "Commit completed successfully!"
        else
            echo "Error: commit failed"
            exit 1
        fi
    else
        echo "Commit cancelled"
        exit 0
    fi
# Script completed successfully
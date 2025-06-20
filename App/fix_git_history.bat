@echo off
echo This script will help fix the Git history by removing the sensitive token
echo.

echo Step 1: Create a new branch from the current state
git checkout -b clean-history

echo Step 2: Create a new commit with the fixed SQL file
git add App/import_stock_logs.sql
git commit -m "Fix: Remove sensitive token from SQL file"

echo Step 3: Instructions for pushing the clean branch
echo.
echo To push this clean branch to GitHub, run:
echo git push -u origin clean-history --force
echo.
echo Then on GitHub, set the clean-history branch as the default branch
echo and delete the main branch.
echo.
pause
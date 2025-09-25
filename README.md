# Idea Hub playground

This repository hosts a lightweight static site that collects quick links for experiments (games, dashboards, and AI research snapshots).

## Resolving GitHub merge conflicts

If a pull request shows the "This branch has conflicts" warning (like in the screenshot), pull the latest changes from the main branch and merge or rebase them locally before pushing again.

1. Make sure you have the upstream remote configured:
   ```bash
   git remote add origin <your-repo-url> # skip if already set
   git fetch origin
   ```
2. Update the base branch and rebase your feature branch:
   ```bash
   git checkout main
   git pull origin main
   git checkout work
   git rebase main
   ```
3. Fix the files that show conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), then stage the fixes:
   ```bash
   # edit the conflicting files to keep the correct content
   git add index.html top-ai-llm-stars.html
   ```
4. Continue the rebase and push the updated branch:
   ```bash
   git rebase --continue
   git push --force-with-lease origin work
   ```

If you prefer merging instead of rebasing, replace steps 2–4 with `git merge main` and a regular `git push`. After the updated branch is on GitHub, the pull request will show as conflict-free.

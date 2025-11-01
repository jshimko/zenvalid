#!/bin/bash

set -e

# Clean up all dependencies and build artifacts in all apps and packages within the monorepo

run_clean() {
  local dir=$1
  echo "Cleaning cache in $dir"
  cd "$dir" || return
  rm -rf .turbo node_modules dist .output .vinxi tsconfig.tsbuildinfo generated .nitro .tanstack coverage
  cd - >/dev/null || return
}

clean_directory() {
  local dir_name=$1
  if [ -d "$dir_name" ]; then
    for subdir in "$dir_name"/*/; do
      if [ -d "$subdir" ]; then
        run_clean "$subdir"
      fi
    done
  else
    echo "$dir_name directory not found"
  fi
}

rm -rf .turbo node_modules dist

clean_directory "apps"
clean_directory "examples"
clean_directory "packages"

echo "Cache cleanup process completed"

---
title: ls
date: 2026-09-05
category: File operations
security: false
---

`ls` lists the contents of a directory. It's the command you run most and think about least, which is a shame, because its long format packs a surprising amount of information into one line.

## Synopsis

```
ls [options] [path...]
```

With no path it lists the current directory. With one or more paths it lists each in turn.

## What it does

The options you'll actually reach for:

| Flag | Effect |
| ---- | ------ |
| `-l` | Long format: permissions, owner, size, mtime, name |
| `-a` | Include dotfiles (entries starting with `.`) |
| `-h` | Human-readable sizes (`4.0K`, `1.2M`) — pairs with `-l` |
| `-t` | Sort by modification time, newest first |
| `-r` | Reverse the sort order |
| `-S` | Sort by size |
| `-R` | Recurse into subdirectories |

## Reading the long format

A line from `ls -l` looks like this:

```
-rwxr-xr-x  1 root  staff  8112 Mar  1 09:14 backup.sh
```

The first character is the file type (`-` regular, `d` directory, `l` symlink). The next nine are permission bits in three groups — owner, group, other — each `rwx` for read, write, execute. Then the link count, owner, group, size in bytes, modification time, and name.

That permission string is worth internalising: almost every filesystem question, from "why can't I run this" to "who can edit that," is answered by those nine characters.

## Common patterns

```bash
ls -lh                 # long, human sizes
ls -lat                # everything, newest first
ls -ld /etc            # the directory itself, not its contents
ls -l --color=auto     # type-coloured output
```

## See also

`find` for searching by attribute rather than listing, and `stat` for the full metadata of a single file.

---
title: find
date: 2026-03-01
category: File operations
security: true
---

`find` walks a directory tree and tests every entry against an expression, acting on the ones that match. It's the most powerful file-search tool on the system because it filters on *any* attribute — name, size, owner, permission bits, timestamps — and can run a command on each hit.

## Synopsis

```
find [path...] [expression]
```

The expression is a chain of tests (which match) and actions (which do something). With no action, the default is `-print`.

## What it does

Common tests:

| Test | Matches |
| ---- | ------- |
| `-name '*.conf'` | By filename (glob) |
| `-iname` | Same, case-insensitive |
| `-type f` / `-type d` | Files / directories |
| `-size +10M` | Larger than 10 MB |
| `-mtime -1` | Modified in the last day |
| `-user root` | Owned by a user |
| `-perm -4000` | Has the SUID bit set |

The killer action is `-exec`, which runs a command per match. `{}` is the current path; `\;` ends the command (or `+` batches matches into one invocation):

```bash
find . -name '*.log' -exec rm {} \;
find . -name '*.jpg' -exec cp {} /backup/ +
```

## Common patterns

```bash
find /etc -name '*.conf'            # config files under /etc
find . -type f -mtime -7            # changed in the last week
find / -size +100M 2>/dev/null      # big files, errors hidden
find . -type d -empty               # empty directories
```

That `2>/dev/null` is idiomatic: a full-system `find` hits directories you can't read, and redirecting stderr keeps the "Permission denied" noise out of your results.

## Offensive security

On an authorized engagement, `find` is the backbone of local enumeration — especially the hunt for privilege-escalation footholds.

**SUID/SGID binaries.** A SUID binary runs with its owner's privileges regardless of who launches it. Enumerating them is step one of local privesc:

```bash
find / -perm -4000 -type f 2>/dev/null    # SUID
find / -perm -2000 -type f 2>/dev/null    # SGID
```

Cross-reference the results against [GTFOBins](https://gtfobins.github.io/): a surprising number of ordinary utilities, when SUID-root, can be coaxed into handing you a root shell.

**Writable locations and stray secrets.**

```bash
find / -writable -type d 2>/dev/null      # dirs you can write to
find / -name 'id_rsa' 2>/dev/null         # private keys
find / -name '*.bak' -o -name '*.old' 2>/dev/null   # backups with secrets
```

**find itself as the escape.** If `find` is available to you as root (for example via a `sudo` rule or the SUID bit), its `-exec` action spawns a shell directly:

```bash
find . -exec /bin/sh \; -quit
```

That one line is the canonical `find` privesc — it's why an over-broad `sudo find` rule is dangerous.

**Detection and defence:** keep the SUID inventory small and audited (a baseline plus periodic `find -perm -4000` diffs catches new ones), never grant `sudo` on binaries with a shell escape, and mount non-system filesystems `nosuid` where you can.

## See also

`ls -l` for reading the permission bits `find -perm` matches on, and `grep -r` when you want to search file *contents* rather than attributes.

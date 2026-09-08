---
title: cat
date: 2026-03-01
category: File operations
security: true
---

`cat` con**cat**enates files and prints them to standard output. In practice it's the fastest way to dump the contents of a file to your terminal, which makes it the first tool you reach for whenever you want to *read* something.

## Synopsis

```
cat [options] [file...]
```

With no file, `cat` reads from standard input — which is why `cat` on its own echoes whatever you type.

## What it does

| Flag | Effect |
| ---- | ------ |
| `-n` | Number every output line |
| `-b` | Number non-blank lines only |
| `-A` | Show non-printing characters, tabs, and line ends |
| `-s` | Squeeze repeated blank lines |

## Common patterns

```bash
cat notes.txt                    # print a file
cat a.txt b.txt > combined.txt   # concatenate into one file
cat -n script.sh                 # print with line numbers
cat file1 file2 | sort | uniq    # feed several files into a pipeline
```

A `cat file | grep pattern` habit is common but redundant — `grep pattern file` does the same with one process. Reserve `cat` for when you genuinely have multiple files or are starting a pipeline.

## Offensive security

Reading files you shouldn't be able to is most of what early enumeration is. `cat` is how those files get read once you have a foothold — always with authorization, on systems you're engaged to test.

The high-value targets are predictable:

```bash
cat /etc/passwd          # user accounts, shells, home dirs
cat /etc/os-release      # distro and version for exploit matching
cat ~/.bash_history      # commands the user ran (often with secrets)
cat ~/.ssh/id_rsa        # private keys, if world-readable by mistake
cat /var/www/html/config.php   # app configs frequently hold DB creds
```

`/etc/passwd` being world-readable is normal; `/etc/shadow` (the password hashes) is not, and being able to `cat` it signals a misconfiguration or that you're already root. Finding a readable private key or a config file with embedded credentials is a common path from "user" to "another user" or to a database.

**Detection and defence:** these reads leave little trace by themselves, so defenders rely on locking down file permissions (secrets shouldn't be world-readable), keeping credentials out of files on disk, and auditing access to sensitive paths with tools like auditd.

## See also

`less` for paging through large files, `head`/`tail` for the ends of a file, and `grep` for reading only the matching lines.

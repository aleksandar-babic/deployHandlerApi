#!/usr/bin/env bash

# The MIT License (MIT)

# Copyright (c) 2013 Thomas Park

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

# Aleksandar Babic - https://aleksandar.alfa-ing.com

# This script will create new app on deployHandler platform
# Things it will do :
# Create app dir
# Setup correct permissions to be able to use SFTP Jail
# Setup NGINX reverse proxy
# Add subdomain to Cloduflare using their API


if [ "$#" -ne 3 ]; then
    echo "Usage: ./addApp.sh username appName port"
    exit
fi

#CONFIG
user=$1
appName=$2
url=$appName.deployhandler.com
sftpgroup=sftponly
port=$3

if [ ! -d "/home/$user/$appName" ]; then

#Add app directory
mkdir /home/$user/$appName
#Set permissions for app directory
chown -R $user:$sftpgroup /home/$user/$appName

#Setup NGINX
awk -v url="$url" '{sub(/changeme/, url)}1' /etc/nginx/sites-available/template > /etc/nginx/sites-available/$url.tmp
awk -v port="$port" '{sub(/8080/, port)}1'  /etc/nginx/sites-available/$url.tmp > /etc/nginx/sites-available/$url
rm /etc/nginx/sites-available/$url.tmp
ln -s /etc/nginx/sites-available/$url /etc/nginx/sites-enabled/$url
nginx -t
if [ "$?" -eq "0" ]
then
	systemctl restart nginx
else
    rm -rf /etc/nginx/sites-available/$url /etc/nginx/sites-enabled/$url 
	exit $?
fi			


#Cloudflare API add DNS domain
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOURZONE/dns_records" \
     -H "X-Auth-Email: YOUREMAIL" \
     -H "X-Auth-Key: YOURKEY" \
     -H "Content-Type: application/json" \
     --data '{"type":"A","name":"'$url'","content":"SERVERIP","ttl":120,"proxied":false}'
if [ "$?" -eq "0" ]
then
	exit $?
fi

else
    echo "App already exists!"
    exit 1
fi
exit 0

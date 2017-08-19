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

# This script will rename existing app
# It will move app files to directory with new name
# It will delete app from PM2
# It will create new NGINX vhost
# It will create new DNS entry using Cloudflare API

if [ "$#" -ne 3 ]; then
    echo "Usage: ./renameApp.sh oldName newName username"
    exit
fi

#CONFIG
oldName=$1
newName=$2
username=$3
oldUrl=$oldName.deployhandler.com
newUrl=$newName.deployhandler.com

echo $oldUrl
echo $newUrl

mv /home/$username/$oldName /home/$username/$newName

su - appsrunner -c "pm2 delete $oldName"

mv /etc/nginx/sites-available/$oldUrl /etc/nginx/sites-available/$newUrl
rm -rf /etc/nginx/sites-enabled/$oldUrl
ln -s /etc/nginx/sites-available/$newUrl /etc/nginx/sites-enabled/$newUrl

nginx -t
if [ "$?" -eq "0" ]
then
	systemctl restart nginx
else
    #Do some housekeeping?
	exit $?
fi		


#Cloudflare API add DNS domain
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
     -H "X-Auth-Email: YOUR_EMAIL" \
     -H "X-Auth-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"type":"A","name":"'$url'","content":"127.0.0.1","ttl":120,"proxied":false}'
if [ "$?" -eq "0" ]
then
    exit $?
fi

exit 0

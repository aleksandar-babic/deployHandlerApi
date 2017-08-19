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

# This script will remove App from deployHandler platform
# It will remove app from PM2 
# Remove apps directory
# Remove NGINX reverse proxy entry
# Remove DNS entry from Cloudflare

if [ "$#" -ne 2 ]; then
    echo "Usage: ./removeApp.sh username appName"
    exit
fi

#CONFIG
user=$1
appName=$2
url=$appName.deployhandler.com

#Remove from pm2
su - appsrunner -c "pm2 delete $appName"

#Delete app files
rm -rf /home/$user/$appName

#Remove NGINX vhost
rm -rf /etc/nginx/sites-available/$url /etc/nginx/sites-enabled/$url
nginx -t
if [ "$?" -eq "0" ]
then
	systemctl restart nginx
else 
	exit $?
fi			

#Cloudflare DNS Delete , NodeJS? (machinepack-cloudflare)

exit 0

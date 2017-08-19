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

# This script will remove user from deployHandler platform
# It will check if user exists
# If it does it will remove every app that user has from PM2
# It will remove every NGINX vhost that apps created
# It will kill all running apps
# It will remove user


if [ "$#" -ne 1 ]; then
    echo "Usage: ./removeUser.sh username"
    exit
fi

#CONFIG
user=$1

#Check if user exists
if id "$user" >/dev/null 2>&1; then

	#Loop through all user apps
	cd /home/$user
	for f in *; do
	    if [ -d ${f} ]; then
	    	#Remove app from PM2
	        su - appsrunner -c "pm2 delete $f"
	        #Remove NGINX vhost
			rm -rf /etc/nginx/sites-available/$f.deployhandler.com /etc/nginx/sites-enabled/$f.deployhandler.com
			nginx -t
			if [ "$?" -eq "0" ]
			then
				systemctl restart nginx
			else 
				exit $?
			fi			
	    fi
	done

	#Kill all user processes(probably just SFTP)
	killall -9 -u $user
	#Delete user from /cat/passwd and delete users home
	deluser --remove-home $user
	exit $?

else
	echo "User does not exist." >&2
	exit 2    
fi

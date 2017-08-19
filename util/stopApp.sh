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

# This script will stop running app on deployHandler platform
# It will check if app is running
# Delete it from PM2 (so it does not restart on server reboot)
# It will save PM2 state

if [ "$#" -ne 1 ]; then
    echo "Usage: ./stopApp.sh appName"
    exit
fi

#CONFIG
appName=$1

res=$(su - appsrunner -c "pm2 list" | grep $appName | awk '{print $8}')
re='^[0-9]+$'
if [[ $res =~ $re ]] && [[ $res -ne 0 ]] ; then
	su - appsrunner -c "pm2 delete $appName"
	if [ $? -eq 0 ]; then
		echo "App '$appName' stopped."
		su - appsrunner -c "pm2 save"
		exit 0
	fi	
fi

echo "App $appName already stopped."
exit 1	

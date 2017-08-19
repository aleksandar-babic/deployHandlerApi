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

# This script will try to launch app with PM2 process manager.
# If entry point is provided it will try to launch app with it
# Or if there is NPM command provided it will try to launch app with it
# If both above fail, it will try to launch server.js file


if [[ "$#" -ne 2 ]] && [[ "$#" -ne 3 ]] && [[ "$#" -ne 4 ]]; then
    echo "Usage: ./startApp.sh username appName [entryPoint] [npm command]"
    exit
fi

#CONFIG
user=$1
appName=$2
entryPoint=$3
npm=$4

res=$(su - appsrunner -c "pm2 list" | grep $appName | awk '{print $8}')
echo $res
re='^[0-9]+$'
if [[ $res -eq 0 ]]; then

	#Try to start with entry point provided
	if [ "$#" -eq 3 ]; then
		su - appsrunner -c "pm2 start --name $appName /home/$user/$appName/$entryPoint"
		if [ "$?" -eq "0" ]; then
			sleep 2
			res=$(su - appsrunner -c "pm2 list" | grep $appName | awk '{print $8}')
			echo $res
			if [[ $res -eq 0 ]]; then
				echo "START FAILED"
				su - appsrunner -c "pm2 delete $appName"
				exit 1
			else
				echo "Started by entry point"
				su - appsrunner -c "pm2 save"
				exit 0
			fi		
		fi
	fi

	#Try to start using npm command
	if [ "$#" -eq 4 ]; then
		cd /home/$user/$appName
		su appsrunner -c "pm2 start --name $appName npm -- $npm"
		if [ "$?" -eq "0" ]; then
			sleep 2
			res=$(su appsrunner -c "pm2 list" | grep $appName | awk '{print $8}')
			echo $res
			if [[ $res -eq 0 ]]; then
				echo "START FAILED"
				su - appsrunner -c "pm2 delete $appName"
				exit 1
			else
				echo "Started by NPM"
				su - appsrunner -c "pm2 save"
				exit 0
			fi		
		fi
	fi

	#Try to start with server.js
	su - appsrunner -c "pm2 start --name $appName /home/$user/$appName/server.js"
	if [ "$?" -eq "0" ]; then
		echo "Started by server.js"
		su - appsrunner -c "pm2 save"
		exit 0
	fi

	#If everything above failed
	echo "START FAILED"
	su - appsrunner -c "pm2 delete $appName"
	exit 1

else
	echo "App $appName already started."
	exit 2	
fi

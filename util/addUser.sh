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

# This script will add new user to deployHandler platform
# It adds user to sftponly group (SFTP Jail)
# Sets users shell to /usr/sbin/nologin (does not allow SSH, only SFTP)
# Does housekeeping (remove .profile .bashrc .bash_logout)
# Sets users password

if [ "$#" -ne 2 ]; then
    echo "Usage: ./addUser.sh username password"
    exit
fi

#CONFIG
user=$1
password=$2

#Create user if does not exist
if ! id "$user" >/dev/null 2>&1; then
    useradd -m -s /usr/sbin/nologin -G sftponly $user
    chown root:root /home/$user
    chmod 755 /home/$user
    rm -rf .profile .bashrc .bash_logout
    echo -e "$password\n$password\n" | sudo passwd $user
    if [ "$?" -eq "0" ]
    then
    	echo User $user has been created.
    	exit 0
    else 
	   exit $? 	
    fi
else
	echo "User already exists."
	exit 2    
fi

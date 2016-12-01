#!/bin/bash

end=0
while [ $end -ne -1 ];
do
	count1=$(redis-cli -h localhost get server1)
	count2=$(redis-cli -h localhost get server2)
	echo $((count2-count1))
	if [ $count1 -gt $count2 ]; then
		if [ $((count1-count2)) -gt 10 ]; then
			redis-cli -h localhost lpop ProductionQueue
			break
		else
			echo server1 is best
		fi
	else
		if [ $((count2-count1)) -gt 10 ]; then
			redis-cli -h localhost rpop ProductionQueue
			break
		else 
			echo server2 is best
		fi
	fi

    sleep 15

done
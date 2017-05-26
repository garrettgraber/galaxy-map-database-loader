#!/bin/bash

./build.sh
# echo "Deleting "
docker rm -f planet-data-loader 
echo "Running planet-data-loader.."

docker run --name planet-data-loader  --link data-planet:mongo -v /${PWD}/../://root/app  -p 8102:8102 planet-data-loader

# docker run --name some-app --link some-postgres:postgres -d application-that-uses-postgres


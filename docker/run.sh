#!/bin/bash

NODE_SERVER="map-express-server";
APP="ionic-base";


./build.sh
# echo "Deleting "
docker rm -f planet-data-loader 
echo "Running planet-data-loader.."
# docker run -d  --link ionic-base:foo -t map-express-server -v /${PWD}/../://root/app   -p 8102:8102 

docker run --name planet-data-loader  --link data-planet:mongo -v /${PWD}/../://root/app  -p 8102:8102 planet-data-loader

# docker run --name some-app --link some-postgres:postgres -d application-that-uses-postgres


#!/bin/bash

mvn package
docker build -t phantasmicmeans/api-gateway:latest .
docker push phantasmicmeans/api-gateway:latest


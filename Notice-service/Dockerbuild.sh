#!/bin/bash

mvn package
docker build -t phantasmicmeans/notice-service:latest .
docker push phantasmicmeans/notice-service:latest



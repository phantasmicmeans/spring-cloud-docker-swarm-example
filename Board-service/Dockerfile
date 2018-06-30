FROM node:6.14

MAINTAINER phantasmicmeans

RUN mkdir /usr/src/app
#/usr/src/app 생성 
ADD . /usr/src/app 
#현재 파일들 전부 /usr/src/app으로 옮기고
WORKDIR /usr/src/app
#work directory를 /usr/src/app으로 바꿈 
#여기가 실행 위치임

RUN npm install
EXPOSE 3000
CMD ["npm", "start"]



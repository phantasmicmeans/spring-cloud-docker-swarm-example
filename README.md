Spring Cloud Netflix & Docker Swarm
==============

by S.M.Lee

&nbsp;

# Overview

여기서는 Docker Clustering Tool인 Swarm과 Spring Cloud Netflix를 결합한 Microservice Architecture prototype backend 구축을 목표로 tutorial을 진행한다. swarm은 여러 docker host를 관리하는 cluster로써의 역할을 담당하고, 우리가 구축할 msa에서의 모든 service는 spring boot application으로 구축 후 docker image로 build한다.

msa 관련 이슈들에 대한 접근은 어느 한쪽에 치우치지 않고 netflix oss, swarm cluster를 적절히 활용한다. 여러 issue들 중 service discovery, load balancing, dynamic routing, metrics 부분은 netflix oss, 그리고 service deploy, scaling 부분은 swarm cluster를 통해 접근한다. 전체적인 architecture는 하단의 그림을 확인하면 된다. 

![image](https://user-images.githubusercontent.com/20153890/41926326-f881d570-79a9-11e8-8439-343e04967535.png)
&nbsp;

가장 상단의 swarm cluter의 manager node(swarm manager)는 아래 6개의 node를 관리한다. manager node 바로 하단은 gateway container를 배포할 3개의 node를 배치하여 'gateway'라는 labels.role을 부여한다. 또한 실제 api server로 구성된 service container를 배포할 3개의 node는 worker라는 labels.role을 부여한다. 이는 가장 아래에서 확인 할 수 있고, 전체적인 흐름은 다음과 같다. 

1. cluster 외부에서의 request는 ingress network와 swarm loadbalancer에 의해 'gateway'라는 role을 가진 node로 전송 된다.

2. 전송된 request를 수신한 gateway container는 netflix eureka, ribbon, hystrxi를 활용해 routing list를 결정하고, 동적으로 routing한다.

3. request는 하단의 node에 배포 된 service container로 전송된다. 

&nbsp;

# Before We Start 

netflix oss와 docker swarm에 대한 전반적인 이해는 다음 레퍼런스를 참고하면 된다. 

* spring cloud netflix eureka  https://github.com/phantasmicmeans/Spring-Cloud-Netflix-Eureka-Tutorial
* spring boot microservice  https://github.com/phantasmicmeans/Spring-Boot-Microservice-with-Spring-Cloud-Netflix
* spring cloud netflix zuul https://github.com/phantasmicmeans/spring-cloud-netflix-zuul
* docker container network https://github.com/phantasmicmeans/docker_bridge_network/blob/master/README.md
* docker swarm https://github.com/phantasmicmeans/docker-swarm/blob/master/README.md


어쨌든 지금부터 위 아키텍쳐 구축을 진행하며(장시간 삽질하며) 얻은 결과를 차례대로 써보려한다. 

일단 빠른 진행을 위해 5개의 server를 준비해야 한다.

1. manager node(cluster)로 활용 할 server
2. gateway를 배포 할 server
3. eureka-server를 배포할 server
4. story-service를 배포할 server 2개

총 5개의 server로 시작한다(필자는 aws ec2 centos7을 사용했고, 이 경우엔 free tier로 충분하다). 어쨌든 이것만 하면 나머지는 추가만 하면 된다. 

전체를 적용하려면 manager node server 1, gateway node server 3(eureka와 auth도 포함), worker node server 3, 총 7개의 server가 필요하다. 

일단 manager node server 1, gateway node server 1, worker node server 2, eureka node server 1개로 해보자!

&nbsp;

# Swarm Cluster

먼저 swarm cluster에 포함된 node들이다. node는 hostname으로 cluster에 등록된다. 우리는 api-gateway, eureka, service(1,2), manager로 구성한다.

swarm cluster없이 dynamic routing 하는 것은 어렵지 않다. 그저 다른 서버에서 같은 service를 실행만 시키면 된다. 그럼 eureka server에 meta data가 전송 될 것이고, ribbon은 알아서 가져다 쓸 것이다.

문제는 swarm cluster에서 service를 생성할 때이다. 전처럼 다른 서버에서 service를 각각 실행하는 짓(?)은 하지 않는다.
replica를 만들어 cluster에 속한 node들에 service를 배포하는 형태로 가야한다.
&nbsp;

## cluster 

먼저 cluster를 구축한다. 이 node는 manager node 역할을 담당한다. 
cluster 구축은 다음 레퍼런스를 참고하면 수월하게 진행 할 수 있다.
* docker swarm tutorial https://github.com/phantasmicmeans/docker-swarm/blob/master/SWARMTUTORIAL.md

```bash
[centos@swarm ~]$ docker swarm init --advertise-addr 172.31.16.28
Swarm initialized: current node (4o4ex6jdsc1g3a62xcvt7sja1) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-0isxwbu2xjayz09cbt87mkdx6458n7l3oqocbzskqjrwt3iqet-9we9dnawsgtsox3cneve0f2qj 172.31.16.28:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```
&nbsp;

## add node

나머지 4개의 server에 다음 명령어를 실행하면 된다. 

```bash

[centos@micro-service2 ~]$ sudo docker swarm join --token SWMTKN-1-0isxwbu2xjayz09cbt87mkdx6458n7l3oqocbzskqjrwt3iqet-9we9dnawsgtsox3cneve0f2qj 172.31.16.28:2377
This node joined a swarm as a worker.
```

node 추가가 완료되면 swarm manager에서 다음 명령어를 실행해보자. 5개의 node가 잘 들어왔다.

```bash
[centos@swarm]$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS      ENGINE VERSION
4aahur2axwxrz3e7je2313v5u     api-gateway         Ready               Active                                  18.03.1-ce
38b9qlxgs0006cbmiweaclq6g     eureka              Ready               Active                                  18.03.1-ce
ypadyu9g6pfwzmgtxuv2oktaj     micro-service1      Ready               Active                                  18.03.1-ce
ubcwr93zcl0rwpmqcwcisk2kh     micro-service2      Ready               Active                                  18.03.1-ce
n7wc4kghqornk0gcans43ph7q *   swarm               Ready               Active              Leader              18.03.1-ce
```

그럼 labels.role을 추가하자.

```bash
docker node update --label-add role=gateway api-gateway
docker node update --label-add role=worker micro-service1
docker node update --label-add role=worker micro-service2
docker node update --label-add role=eureka eureka
```

이 정도면 cluster준비는 완료 되었다. 앞선 참고자료에서 swarm은 ingress라는 default overlay network에 속한다고 했다. ingress network에 node들이 잘 속해있는지 확인부터 하자.
&nbsp;

## ingress 

```bash
[centos@swarm]$ docker network inspect ingress
[
    {
        "Name": "ingress",
        "Id": "1uchs3hadianxf9ja4r6vp6tu",
        "Created": "2018-06-26T17:06:29.011045439Z",
        "Scope": "swarm",
        "Driver": "overlay",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "10.255.0.0/16",
                    "Gateway": "10.255.0.1"
                }
            ]
        },
        ...(중략)
        "Labels": {},
        "Peers": [
            {
                "Name": "528656c130b2",
                "IP": "172.31.16.28"
            },
            {
                "Name": "291872fd118a",
                "IP": "172.31.21.141"
            },
            {
                "Name": "e007f4432447",
                "IP": "172.31.20.255"
            },
            {
                "Name": "973fa3ba5615",
                "IP": "172.31.29.13"
            },
            {
                "Name": "f062a23011af",
                "IP": "172.31.25.7"
            }
        ]
    }
]
```

"Peers" 부분을 보자. 5개의 node들이 ingress network에 속해져 있는것을 확인 할 수 있다. 그럼 기존에 구축하던 application service를 배포해보자!


```bash
[centos@swarm]$ docker service create \
    --name story-service \
    --constraint 'node.labels.role==worker' \
    --replicas 2 \
    --publish 8768:8768  \
    phantasmicmeans/story-service:latest
7zjwv1j8b3keykhpvot7x597t
overall progress: 2 out of 2 tasks 
1/2: running   [==================================================>] 
2/2: running   [==================================================>] 
verify: Service converged 
```

기존 application의 configuration은 요약하면 다음과 같다.

**aplication.yml**
```yml
spring:
    application:
        name: story-service
        
server:
    port: 8768
    
eureka:
    client:
        healthcheck: true 
        fetch-registry: true
        serviceUrl:
            defaultZone: http://13.124.98.99:8761/eureka/
    instance:
        instance-id: ${spring.application.name}:${spring.application.instance_id:${random.value}}
        preferIpAddress: true
```

hostname대신 ipAddress를 사용 할 것이고, client가 replica로 생성되므로 구별하기 위해 serviceId에 random.value를 주었다.
문제는 replica를 생성했을 때, serviceId는 다르겠지만, 분명 ipAddress등 eureka server로 전송되는 data는 동일할 것이다. 그렇다면 client side의 load balancing을 할 수 없다. 일단 eureka에 등록된 인스턴스를 확인해보자.
&nbsp;

## issue

**eureka**
```xml
<application>
<name>STORY-SERVICE</name>
    
<instance>
<instanceId>story-service:06a0079b301c652216c11385677fa44a</instanceId>
<hostName>10.255.0.7</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.255.0.7</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
<securePort enabled="false">443</securePort>
<countryId>1</countryId>
</instance>
...
<instance>
<instanceId>story-service:b36d768d9a1fa4b43282964b631ba4ad</instanceId>
<hostName>10.255.0.7</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.255.0.7</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
<securePort enabled="false">443</securePort>
<countryId>1</countryId>
</instance>
```

역시나 같다. 2개의 story-service가 등록 되었지만 결국 data info는 일치한다. 추가로 확인해야 할 것은 10.255.0.7이란 ip address의 등장이다. 
일단 이것부터 뜯어봐야 한다. 일단 service가 배포된 node server로 가서 container를 확인하자.

```bash
[centos@micro-service1 ~]$ docker ps
CONTAINER ID        IMAGE                                  COMMAND                  CREATED             STATUS              PORTS               NAMES
3552c86aafd5        phantasmicmeans/story-service:latest   "java -Djava.securit…"   22 minutes ago      Up 22 minutes       8768/tcp            story-service.1.7stn3vh6krm04y3ibbi9xbodj
``` 

story-service.1 container가 실행중이다. 그럼 container의 network 정보를 확인해보자.

```bash
[centos@micro-service1 ~]$ docker exec -it 355 /bin/sh
/ # ifconfig
eth0      Link encap:Ethernet  HWaddr 02:42:0A:FF:00:08  
          inet addr:10.255.0.8  Bcast:10.255.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1450  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)

eth1      Link encap:Ethernet  HWaddr 02:42:AC:12:00:03  
          inet addr:172.18.0.3  Bcast:172.18.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:321 errors:0 dropped:0 overruns:0 frame:0
          TX packets:459 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:67074 (65.5 KiB)  TX bytes:63421 (61.9 KiB)

lo        Link encap:Local Loopback  
          inet addr:127.0.0.1  Mask:255.0.0.0
          UP LOOPBACK RUNNING  MTU:65536  Metric:1
          RX packets:18 errors:0 dropped:0 overruns:0 frame:0
          TX packets:18 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:1750 (1.7 KiB)  TX bytes:1750 (1.7 KiB)
``` 

contaioner의 network interface중에는 10.255.0.7인 address가 부여된 항목이 없다. micro-service2 server에서 story-service.2 container의 network 정보를 확인해도 그런 address는 찾을 수 없다. 10.255.0.7이란 ip는 어떤 network에 붙어 있는것인지 확인해야 한다.

**참고**

이 spring boot application을 docker image를 생성 할 때 openjdk:8-jdk-alpine(alpine linux로 container생성됨)을 사용한다.
alpine은 "lightweight linux distribution based on musl libc and busybox"로 경량 리눅스이고, alpine은 대부분의 linux가 제공하는 bash shell을 제공하지 않는다. BusyBox에서 제공하는 Almquist Shell(ash)를 사용한다. 즉 docker exec -it {container-id} /bin/bash가 아니라 bin/ash 혹은 /bin/sh로 실행해야 한다는 것이다.

그리고 alpine linux의 package manager 명령어는 apk이다(ex. apk update, apk add).

&nbsp;


다시 swarm manage node로 돌아와서 service 자체를 확인해보는게 좋겠다.
```bash
[centos@swarm]$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                                  PORTS
ozi79dyl10g8        story-service       replicated          2/2                 phantasmicmeans/story-service:latest   *:8768->8768/tcp
```

실행중인 story-service를 뜯어보자! 

```bash
[centos@swarm]$ docker service inspect story-service
[
    {
        "ID": "ozi79dyl10g8dyw6spryibdz0",
        "Version": {
            "Index": 35
        },
        "CreatedAt": "2018-06-26T17:18:46.572335545Z",
        "UpdatedAt": "2018-06-26T17:18:46.573928502Z",
        "Spec": {
            "Name": "story-service",
            "Labels": {},
            "TaskTemplate": {
                "ContainerSpec": {
                    "Image": "phantasmicmeans/story-service:latest@sha256:e5110d56745f780f50261e743890f4e57fb5dd58c152ed7bfb5e958cef60f74e",
                ...(중략)
            "Mode": {
                "Replicated": {
                    "Replicas": 2
                }
            },
            ...
            "Ports": [
                {
                    "Protocol": "tcp",
                    "TargetPort": 8768,
                    "PublishedPort": 8768,
                    "PublishMode": "ingress"
                }
            ],
            "VirtualIPs": [
                {
                    "NetworkID": "1uchs3hadianxf9ja4r6vp6tu",
                    "Addr": "10.255.0.7/16"
                }
            ]
        }
    }
]
```
여기서 찾을 수 있었다. "VirtualIPs" 부분을 보자. 10.255.0.7이란 address를 부여받은 상태이다. 즉 이 address는 service에 부여된 ip이지 service가 실행되는 container의 ip는 아니란것이다. 

뭔가 꼬이기 시작했다.. replica로 배포된 서비스들이 eureka에 등록될 때, service 자체 ip가 아닌, 실행되는 container의 network 정보를 등록해야 한다.. 그래야 zuul의 ribbon이 dynamic routing 그리고 load balancing 시킬 list를 eureka server로 부터 정확하게 찾을 것이다. 

&nbsp;
&nbsp;

## how to solve it 

해결 방법을 생각해보니 여러 방법이 있긴 하다.

### 1. Ingress network에 등록된 Node peer들의 private ip를 이용하는 방법.

### 2. Service는 어쨌든 container에서 실행된다. service가 container에서 실행되는 java run-time시, Eureka에 등록될 network정보를 자바단에서 customizing 하는 방법.(java단에서 host network 정보를 이용, 여기서 host는 container)

먼저 1번부터 접근해 보았다. 위에서 실행했던 명령어를 다시 실행해보자

&nbsp;

**1. Ingress network에 등록된 Node peer들의 private ip를 이용하는 방법.**

```bash
[centos@swarm]$ docker network inspect ingress
[
    {
        "Name": "ingress",
        "Id": "1uchs3hadianxf9ja4r6vp6tu",
        "Created": "2018-06-26T17:06:29.011045439Z",
        "Scope": "swarm",
        "Driver": "overlay",
        ...(중략)
        ...(중략)
        "Labels": {},
        "Peers": [
            {
                "Name": "528656c130b2",
                "IP": "172.31.16.28"
            },
            {
                "Name": "291872fd118a",
                "IP": "172.31.21.141"
            },
            {
                "Name": "e007f4432447",
                "IP": "172.31.20.255"
            },
            {
                "Name": "973fa3ba5615",
                "IP": "172.31.29.13"
            },
            {
                "Name": "f062a23011af",
                "IP": "172.31.25.7"
            }
        ]
    }
]
```

Swarm Cluster에 속해있는 peer(node)들은 private ip로 서로간에 communication이 가능하다. 예를들어 story-service가 배포된 node가 172.31.29.13, 172.31.25.7이라고 하자. 이 node의 private ip를 이용하면 service가 실행되는 container의 network 정보는 알 필요가 없다.  172.31.29.13:8768/story라는 request는 172.31.29.13이라는 ip를 가진 node에서 8768번 port로 실행중인 container로 매핑 될 것이다.
결론적으로 eureka server에 각각 172.31.29.13, 172.31.25.7이 등록되도 상관없다는 얘기다. 


그래도 뭔가 이상적이지 않다. container로 request가 전달될 때 굳이 2번 거쳐서 전달된다. 같은 cluster에 속한 node들간의 통신이 아니라, 각 node에서 실행중인 container끼리 통신하는게 이상적이라고 생각했다. 추가로 node의 private ip를 사용하기도 까다롭다. 대충 이런 구조가 된다.

Node(peer private ip) -> Container(container ip) -> Story-service application(java)

Java단에서 host인 container의 network정보를 가져오는 것은 어렵지 않으나, node 자체의 network 정보를 container에 전달하고, 이를 다시 java단에서 사용할 수 있게 하려면 .. 뭔가 방법은 있겠지만 해보지 못했다.. 어쨌든 2번으로 가자.


&nbsp;

**2. Java run-time시 host(container)의 network interface를 활용**

다시 container network interface부터 확인하자. 

**node = micro-service1**

```bash
[centos@micro-service1 ~]$ docker exec -it 355 /bin/sh
/ # ifconfig
eth0      Link encap:Ethernet  HWaddr 02:42:0A:FF:00:08  
          inet addr:10.255.0.8  Bcast:10.255.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1450  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)

eth1      Link encap:Ethernet  HWaddr 02:42:AC:12:00:03  
          inet addr:172.18.0.3  Bcast:172.18.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:321 errors:0 dropped:0 overruns:0 frame:0
          TX packets:459 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:67074 (65.5 KiB)  TX bytes:63421 (61.9 KiB)
..(중략) 
```

**node = micro-service2**

```bash
[centos@micro-service2 ~]$ docker exec -it 3a4 /bin/ash
/ # ifconfig
eth0      Link encap:Ethernet  HWaddr 02:42:0A:FF:00:09  
          inet addr:10.255.0.9  Bcast:10.255.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1450  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)

eth1      Link encap:Ethernet  HWaddr 02:42:AC:12:00:03  
          inet addr:172.18.0.3  Bcast:172.18.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:1068 errors:0 dropped:0 overruns:0 frame:0
          TX packets:1573 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:203835 (199.0 KiB)  TX bytes:219859 (214.7 KiB)
```

story-service가 배포된 node들의 network Interface정보들 중 eth0을 확인하자. ingress network에 의해 ip가 부여된 것을 볼 수 있다(아래 참고를 확인하자, eth1은 docker_gwbride에 의해 부여됨). 추가로 이 eth0에는 ipv6에 대한 정보가 없는것까지 확인 할 수 있었다.


**참고**

```bash
[centos@micro-service1 ~]$ docker network inspect ingress
[
    {
        "Name": "ingress",
        "Id": "1uchs3hadianxf9ja4r6vp6tu",
        "Created": "2018-06-26T17:11:22.818604059Z",
        "Scope": "swarm",
        "Driver": "overlay",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "10.255.0.0/16",
                    "Gateway": "10.255.0.1"
                }
            ]
        },
```
swarm cluster의 default overlay network인 ingress은 Subnet이 10.255.0.0으로 세팅되어져 있다.  


이를 이용하면 될 것이다. gateway container에서 service container로 ping부터 날려보자. 

```bash
/ # ping 10.255.0.8
PING 10.255.0.8 (10.255.0.8): 56 data bytes
64 bytes from 10.255.0.8: seq=0 ttl=64 time=0.667 ms
64 bytes from 10.255.0.8: seq=1 ttl=64 time=0.716 ms
64 bytes from 10.255.0.8: seq=2 ttl=64 time=0.570 ms
64 bytes from 10.255.0.8: seq=3 ttl=64 time=0.655 ms
64 bytes from 10.255.0.8: seq=4 ttl=64 time=0.625 ms
```

잘 된다! 이제 이 container의 eth0 network interface를 eureka server에 등록하기 위해 코딩을 좀 해야한다. 필자는 main class에 configuration을 정의했지만.. configuration class를 따로 만들어도 된다. (예외처리는 그냥 Exception으로 묶었다..;)

**StoryserviceApplication.java**
```java
public class StoryserviceApplication {

    private EurekaInstanceConfigBean eurekaInstanceConfig;
    private Logger logger = LoggerFactory.getLogger(this.getClass());

	public static void main(String[] args) {
		SpringApplication.run(StoryserviceApplication.class, args);
	}

  	@Bean
    	@Primary
    	@Autowired
	public EurekaInstanceConfigBean DockerSwarm_EurekaClient(InetUtils inetUtils)
	{
	
		try{
            		eurekaInstanceConfig= new EurekaInstanceConfigBean(inetUtils);
            		final String HostName = System.getenv("HOSTNAME"); //container hostname 가져옴, container_id 일 것임
            		logger.info("HOSTNAME : " + HostName);
            
            		Optional<NetworkInterface> net = Optional.of(NetworkInterface.getByName("eth0"));
            		//eth0 interface를 찾자. 없으면 Exception 
            		logger.info("Network instance inetaddress: " + net.get().getInetAddresses());
            		logger.info("Network instance name: " + net.get().getName());
	    
	    		Enumeration<InetAddress> inetAddress = net.get().getInetAddresses();
	    		InetAddress current = inetAddress.nextElement();
	    		//eth0 networkInterface에는 ipv4밖에 없다.
	    
            		String address = current.toString().split("/")[1];
            
            		logger.info(" HostName : " + HostName);
            		logger.info(" Address : " + address);
	    
	    		eurekaInstanceConfig.setHostname(HostName);
            		eurekaInstanceConfig.setPreferIpAddress(true);
            		eurekaInstanceConfig.setIpAddress(address);
            		eurekaInstanceConfig.setNonSecurePort(8768);
            		//port는 따로 지정해줘도 상관없다.
	    		logger.info("Eureka Config : "  + eurekaInstanceConfig.toString());
	    
	    		return eurekaInstanceConfig;
			
		}catch(Exception e)
		{
			logger.info("Exception!");
            		return null;
		}
		
	}
}
```

필요한건 eth0에 대한 정보이다. EurekaInstanceConfigBean을 활용해 eth0의 InetAddress를 eureka server에 등록시켰다. 예를 보이기 위해 eurekaInstanceConfig.setHostName(HostName(container-hostname))을 넣어 놓았다. 실제 Eureka에 등록될 때는 preferIpAddress에 의해 hostName이 아닌 IpAddress로 등록 될 것이다. 
&nbsp;

## another issue

위의 configuration을 gateway application에도 추가하여, service를 다시 배포하고 eureka에 어떻게 등록 되어졌는지 확인하자.

**eureka instacne info**

```xml
<application>
<name>STORY-SERVICE</name>
<instance>
<instanceId>story-service:3eab327db022f1ee28ecc60d47e2796e</instanceId>
<hostName>10.255.0.12</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.255.0.12</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
<securePort enabled="false">443</securePort>
<countryId>1</countryId>
</instance>
    
<instance>
<instanceId>story-service:3f282013562af054a4be8a96a6b54e39</instanceId>
<hostName>10.255.0.11</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.255.0.11</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
<securePort enabled="false">443</securePort>
<countryId>1</countryId>
</instance>
</application>

<application>
<name>ZUUL-SERVICE</name>
<instance>
<instanceId>zuul-service:54739a500b1d1df9d85310b9abc3a198</instanceId>
<hostName>10.255.0.21</hostName>
<app>ZUUL-SERVICE</app>
<ipAddr>10.255.0.21</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">4000</port>
<securePort enabled="false">443</securePort>
<countryId>1</countryId>
</instance>
</application>
```

다음처럼 story-service(10.255.0.11, 10.255.0.12), api-gateway(10.255.0.21)이 잘 등록된 것을 볼 수 있다. 원하는대로 잘 되어가고 있다.
이제 routing을 확인해야 한다.


```bash
[centos@swarm ~]$ curl 13.125.129.80:4000/api/story-service/story
{"timestamp":"2018-06-26T19:23:58.609+0000","status":500,"error":"Internal Server Error","message":"GENERAL"}
```
500이 뜬다.. 뭔가 이상하다.. 이럴리가 없다. gateway의 log를 확인해 보자..


```bash
[centos@swarm ~]$ docker service logs gateway
..중략
gateway.1.fuycg0nh043k@api-gateway    | 2018-06-26 19:23:52.738  INFO 1 --- [nio-4000-exec-1]
c.n.l.DynamicServerListLoadBalancer      : DynamicServerListLoadBalancer for client story-service initialized:
DynamicServerListLoadBalancer:
{NFLoadBalancer:name=story-service,current list of Servers=[10.255.0.11:8768,10.255.0.12:8768],Load balancer stats=Zone
stats: {defaultzone=[Zone:defaultzone;	Instance count:2;	Active connections count: 0;	Circuit breaker tripped
count: 0;	Active connections per server: 0.0;]
gateway.1.fuycg0nh043k@api-gateway    | },Server stats: [[Server:10.255.0.11:8768;	Zone:defaultZone;	Total
Requests:0;	Successive connection failure:0;	Total blackout seconds:0;	Last connection made:Thu Jan 01
00:00:00 GMT 1970;	First connection made: Thu Jan 01 00:00:00 GMT 1970;	Active Connections:0;	total failure count
in last (1000) msecs:0;	average resp time:0.0;	90 percentile resp time:0.0;	95 percentile resp time:0.0;	min resp
time:0.0;	max resp time:0.0;	stddev resp time:0.0]
gateway.1.fuycg0nh043k@api-gateway    | , [Server:10.255.0.12:8768;	Zone:defaultZone;	Total Requests:0;
Successive connection failure:0;	Total blackout seconds:0;	Last connection made:Thu Jan 01 00:00:00 GMT 1970
First connection made: Thu Jan 01 00:00:00 GMT 1970;	Active Connections:0;	total failure count in last (1000) msecs:0;
average resp time:0.0;	90 percentile resp time:0.0;	95 percentile resp time:0.0;	min resp time:0.0;	max resp
time:0.0;	stddev resp time:0.0]
.. 
```

일단 story-service의 List(10.255.0.11, 10.255.0.12)들은 Ribbon이 Eureka로부터 잘 받아온다. 계속 로그를 확인하자. 

```bash
gateway.1.fuycg0nh043k@api-gateway    | Caused by: java.lang.RuntimeException: org.apache.http.conn.ConnectTimeoutException: Connect to 10.255.0.12:8768 [/10.255.0.12] failed: connect timed out
gateway.1.fuycg0nh043k@api-gateway    | 	at rx.exceptions.Exceptions.propagate(Exceptions.java:57) ~[rxjava-1.3.8.jar!/:1.3.8]
gateway.1.fuycg0nh043k@api-gateway    | 	at rx.observables.BlockingObservable.blockForSingle(BlockingObservable.java:463) ~[rxjava-1.3.8.jar!/:1.3.8]
gateway.1.fuycg0nh043k@api-gateway    | 	at rx.observables.BlockingObservable.single(BlockingObservable.java:340) ~[rxjava-1.3.8.jar!/:1.3.8]
gateway.1.fuycg0nh043k@api-gateway    | 	at com.netflix.client.AbstractLoadBalancerAwareClient.executeWithLoadBalancer(AbstractLoadBalancerAwareClient.java:112) ~[ribbon-loadbalancer-2.2.5.jar!/:2.2.5]
gateway.1.fuycg0nh043k@api-gateway    | 	... 31 common frames omitted
gateway.1.fuycg0nh043k@api-gateway    | Caused by: org.apache.http.conn.ConnectTimeoutException: Connect to 10.255.0.12:8768 [/10.255.0.12] failed: connect timed out
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.conn.DefaultHttpClientConnectionOperator.connect(DefaultHttpClientConnectionOperator.java:151) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.conn.PoolingHttpClientConnectionManager.connect(PoolingHttpClientConnectionManager.java:373) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.execchain.MainClientExec.establishRoute(MainClientExec.java:381) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.execchain.MainClientExec.execute(MainClientExec.java:237) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.execchain.ProtocolExec.execute(ProtocolExec.java:185) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.execchain.RetryExec.execute(RetryExec.java:89) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.client.InternalHttpClient.doExecute(InternalHttpClient.java:185) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.client.CloseableHttpClient.execute(CloseableHttpClient.java:83) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.apache.http.impl.client.CloseableHttpClient.execute(CloseableHttpClient.java:108) ~[httpclient-4.5.5.jar!/:4.5.5]
gateway.1.fuycg0nh043k@api-gateway    | 	at org.springframework.cloud.netflix.ribbon.apache.RibbonLoadBalancingHttpClient.execute(RibbonLoadBalancingHttpClient.java:81) ~[spring-cloud-netflix-ribbon-2.0.0.M8.jar!/:2.0.0.M8]
```

ribbon이 연결하는 server로 부터 TimeoutException이 뜬다.. 우리가 사용하는 zuul의 ribbon은 다음처럼 eureka server로 부터 instance를 받아온다.

```yml
story-service:
    ribbon: 
        eureka:
            enabled: true
        NIWSServerListClassName: com.netflix.niws.loadbalancer.DiscoveryEnabledNIWSServerList
        ConnectTimeout: 5000
        ReadTimeout: 5000
        MaxTotalHttpConnections: 500
        MaxConnectionsPerHost: 100
```

어쨌든 Eureka에 등록된 story-service의 List중 10.255.0.12:8768의 connection에서 timeout이 발생하고 있고, 10.255.0.11:8768에도 같은 connection timeout이 발생한다. 뭔가 이 server list 자체가 잘못된 것 같다.. 전에 ping으로 10.255.0.~이 살아 있는지만 확인하고 넘어 왔었다. 그러나 port binding 되는것은 확인하지 않고 왔다.. 다시 확인해야 한다.


gateway container에서 story-service.1의 container로 request를 보내보자.

```bash
[centos@api-gateway ~]$ docker exec -it 28f5 /bin/sh
/ # ping 10.255.0.12
PING 10.255.0.12 (10.255.0.12): 56 data bytes
64 bytes from 10.255.0.12: seq=0 ttl=64 time=0.748 ms
64 bytes from 10.255.0.12: seq=1 ttl=64 time=0.702 ms
64 bytes from 10.255.0.12: seq=2 ttl=64 time=0.676 ms
^C
--- 10.255.0.12 ping statistics ---
3 packets transmitted, 3 packets received, 0% packet loss
round-trip min/avg/max = 0.676/0.708/0.748 ms
```
ping은 여전히 잘 간다. port가 열려있는지 보자. (telnet으로 확인해도 됨)


```bash
/ # curl -X GET 10.255.0.12:8768/story
curl: (7) Failed to connect to 10.255.0.12 port 8768: Operation timed out
```

역시나 open되어 있지 않다..
&nbsp;

## how to resolve

service들의 container안에서 iptables을 조금 만져봤지만, alpine linux는 방화벽 세팅이 뭔가 다르다. 추가로 이렇게 컨테이너 안으로 들어가서 강제로 inbound, outbound를 설정하면, 추후에 모든 service들에도 똑같이 적용해야 한다. dockerfile 작성시에 이를 적용하는 방법이 있을 것 같긴 하지만, 어쨌든 실패했다. 이렇게 되면 ingress network를 사용할 수 없다. ingress network만으로 각기 다른 노드에서 실행되는 container간의 communication을 적용해보려 하였으나 쉽지 않다.. 그러나 구글링을 열심히 한 결과 무언가를 찾을 수는 있었다.


**Make ingress network a special routing only network** => https://github.com/moby/moby/issues/27147

위 참고자료를 보면

When docker creates a swarm cluster a special overlay network called ingress network is created to properly route external requests outside the cluster to services which are publishing ports. This network exists to serve one purpose only, to facilitate routing such requests. Even though it shows up in network listings it should not be used as a normal network to discover services which are attached to them or facilitate internal load balancing between these services. To block such unintentional behavior the following needs to happen:

- Disable service discovery in ingress network
- Block services explicitly trying to attach to ingress network
- Allow only access to published ports when traffic is coming to any container via ingress network

라고 쓰여져 있다. 축약해보면 "ingress network는 cluster외부에서의 request에 대해, port 바인딩 되어진 container에 request를 routing하는 용도로만 사용해야 한다" 라는 말이다. 필자가 하려했던 cluster의 node들에 배포된 container간의 communication을 위한 용도로는 사용하면 안된다는 말이다. 


```bash
[centos@swarm]$ docker service create \
    --name story-service \
    --constraint 'node.labels.role==worker' \
    --replicas 2 \
    --network ingress \
    --publish 8768:8768  \
    phantasmicmeans/story-service:latest
Error response from daemon: rpc error: code = InvalidArgument desc = Service cannot be explicitly attached to the ingress network "ingress"
```

실제로 위처럼 ingress network에 service를 attach해도 Error가 뜬다. 그리고 이 문제를 default ingress network로는 해결 해서는 안된다고 한다. customizing한 ingress network와 무언가 container들 간의 communication을 담당 할 network를 추가하는게 답이라고 생각했다. 

일단 default ingress network를 지워야한다. 먼저 실행중인 service를 전부 종료한 뒤, default ingress를 지우자.(manager node로 활용하는 server에서 진행하면 된다.)


```bash
[centos@swarm ~]$ docker network rm ingress
WARNING! Before removing the routing-mesh network, make sure all the nodes in your swarm run the same docker engine version. Otherwise, removal may not be effective and functionality of newly create ingress networks will be impaired.
Are you sure you want to continue? [y/N] y
ingress
```

그리고 새로운 ingress network를 다음처럼 생성하자.

```bash
[centos@swarm ~]$ docker network create \
    --driver overlay \
    --ingress --subnet=10.11.0.0/16 \
    --gateway=10.11.0.2 \
    --opt com.docker.network.mtu=1200 \
    msa-ingress
3k9ru4uza4oqdaouogpq1cd80
```

이제 container간의 communication을 위한 overlay network를 추가하자(subnet 10.0.9.0).

```bash
[centos@swarm ~]$ docker network create \
    --driver overlay \
    --subnet 10.0.9.0/24 \
    --gateway 10.0.9.99 msa-network
z3sqka5y788bn662lt0mhcjt4
```

network 생성이 완료되면, 다음처럼 network list를 확인할 수 있다.

```bash
[centos@swarm ~]$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
a8ad52b711a8        bridge              bridge              local
9e75e3dc11d7        docker_gwbridge     bridge              local
6603b36e3810        host                host                local
3k9ru4uza4oq        msa-ingress         overlay             swarm
z3sqka5y788b        msa-network         overlay             swarm
3c7981501d2c        none                null                local
```

정리하면 우리는 cluster 외부에서의 request를 cluster 내부 container에 전송할 msa-ingress와 cluster 내부에서 container간의 통신을 위한 msa-network를 가지고 있다. 즉 gateway로 접근되는 request는 clutser 외부에서 들어오는 request이므로 msa-ingress, 그리고 gateway(zuul)가 service(story-service container 2EA)에게 보내는 request는 msa-network를 사용할 것이란 얘기이다.

앞에서는 default ingress network만을 사용했기에 container는 eth0, eth1(docker_gwbridge) network interface를 가지고 있었다(local제외). 그러나 msa-network가 추가됨에 따라 무언가 새로운 network interface가 붙을 것이고 이 부분은 꼭 확인해야 한다(새로 생성된 msa-network interface를 이용해 eureka에 등록해야 하므로). 


먼저 service를 다시 생성해보자

**eureka**
```bash
[centos@swarm ~]$ docker service create\
	--name eureka \
	--constraint 'node.labels.role==eureka' \
	--publish 8761:8761  \
	--network msa-network \
	phantasmicmeans/eureka-server:latest
```

**story-service**
```bash
[centos@swarm ~]$ docker service create \
	--name story-service \
	--constraint 'node.labels.role==worker' \
	--replicas 2 --publish 8768:8768  \
	--network msa-network \
	phantasmicmeans/story-service:latest
```

**gateway(zuul-service)**
```bash
[centos@swarm ~]$ docker service create \
	--name gateway \
	--constraint 'node.labels.role==gateway' \
	--publish 4000:4000  \
	--network msa-network \
	phantasmicmeans/api-gateway:latest
```


기존에 service를 생성하는 방법과 달라진 것은 --network msa-network flag가 추가되었다는 것이다(msa-network적용). msa-network가 추가됨에 따라 container의 network interface에도 변화가 분명 있을것이니 story-service container의 network 정보 먼저 확인해보자.


```bash
[centos@micro-service1 ~]$ docker exec -it 234 ifconfig
eth0      Link encap:Ethernet  HWaddr 02:42:0A:0B:00:0D  
          inet addr:10.11.0.13  Bcast:10.11.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1450  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)

eth1      Link encap:Ethernet  HWaddr 02:42:AC:12:00:03  
          inet addr:172.18.0.3  Bcast:172.18.255.255  Mask:255.255.0.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:76 errors:0 dropped:0 overruns:0 frame:0
          TX packets:91 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:34986 (34.1 KiB)  TX bytes:12300 (12.0 KiB)

eth2      Link encap:Ethernet  HWaddr 02:42:0A:00:09:0C  
          inet addr:10.0.9.12  Bcast:10.0.9.255  Mask:255.255.255.0
          UP BROADCAST RUNNING MULTICAST  MTU:1450  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:0 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:0 (0.0 B)  TX bytes:0 (0.0 B)
```

역시 eth2라는 새로운 network가 생겼다. 위에서 subnet을 10.0.9.0로 하여 msa-network를 생성하였기에 eth2에는 10.0.9.12라는 address가 부여되어 있다. 그리고 다른 container에도 eth2에 10.0.9.13라는 address가 부여된 것을 확인 할 수 있었다. 앞서 했던 실수를 방지하기 위해 container간 연결을 확인해야한다. 


```bash
[centos@micro-service1 ~]$ docker exec -it 234 /bin/sh 
/ # apk update
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/main/x86_64/APKINDEX.tar.gz
...
OK: 9061 distinct packages available
/ # apk add curl
(1/3) Installing libssh2 (1.8.0-r2)
...
OK: 100 MiB in 54 packages
/ # curl 10.0.9.13:8768/story
[{"story_id":5,"message":"TEST5,"id":"test5"},{"story_id":4,"message":"TEST4","id":"test4"},{"story_id":3,"message":"TEST3","id":"test3"}
```

연결이 잘 된다! 이제 eth2 network interface를 Eureka에 등록해주면 끝이다. 다시 configuration으로 가자. 

```java

  	@Bean
    	@Primary
    	@Autowired
	@Profile("docker") 
	public EurekaInstanceConfigBean DockerSwarm_EurekaClient(InetUtils inetUtils)
	{
	
		try{
            		eurekaInstanceConfig= new EurekaInstanceConfigBean(inetUtils);
            		final String HostName = System.getenv("HOSTNAME"); //container hostname 가져옴, container_id 일 것임
            		logger.info("HOSTNAME : " + HostName);
            
            		Optional<NetworkInterface> net = Optional.of(NetworkInterface.getByName("eth2"));
            		//eth2로 변경
            		logger.info("Network instance inetaddress: " + net.get().getInetAddresses());
            		logger.info("Network instance name: " + net.get().getName());
	    
	    		Enumeration<InetAddress> inetAddress = net.get().getInetAddresses();
	    		InetAddress current = inetAddress.nextElement();
	    
            		String address = current.toString().split("/")[1];
            
            		logger.info(" HostName : " + HostName);
            		logger.info(" Address : " + address);
	    
	    		eurekaInstanceConfig.setHostname(HostName);
            		eurekaInstanceConfig.setPreferIpAddress(true);
            		eurekaInstanceConfig.setIpAddress(address);
            		eurekaInstanceConfig.setNonSecurePort(8768);
			
	    		logger.info("Eureka Config : "  + eurekaInstanceConfig.toString());
	    
	    		return eurekaInstanceConfig;
			
		}catch(Exception e)
		{
			logger.info("Exception!");
            		return null;
		}
		
	}
```

기존의 eth0을 eth2로 변경하고, 빌드 환경을 위해 profile 설정을 해줬다. profile을 분리한 이유는 eth2 network interface는 msa-network에 속한 service들의 container에 적용되는 network이다. 따라서 maven build를 위한 우리의(나의) 서버에는 eth2가 없다(Exception으로 인한 null이..). 이 부분은 application.yml 파일을 확인하면 쉽게 이해 갈 것이다.


**참고**
1. maven build profile은 local -> mvn package -Dspring.profiles.active=local(default)

2. Dockerfile 변경
```dockerfile
FROM openjdk:8-jdk-alpine
VOLUME /tmp
ADD ./target/story-service-0.0.1.jar app.jar
EXPOSE 8768
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-Dspring.profiles.active=docker","-jar","/app.jar"]
#ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]
```
docker image build시 -Dspring.profiles.active=docker를 적용해야 한다!. (@Profile("docker") 적용)


어쨌든 이를 gateway와 service에 다시 적용하고, eureka를 다시 확인하자! 거의 마무리가 되어간다.

**eureka**
```xml
<application>
<name>STORY-SERVICE</name>
<instance>
<instanceId>story-service:761f336012abf02a2414bc30ade41b11</instanceId>
<hostName>10.0.9.18</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.0.9.18</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
..중략
</instance>
<instance>
<instanceId>story-service:25a594e224ed69ac3f2c4167d7195d2b</instanceId>
<hostName>10.0.9.19</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.0.9.19</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
..중략
</instance>
</application>

<application>
<name>ZUUL-SERVICE</name>
<instance>
<instanceId>zuul-service:06f29e62fbda40d445725649e51cbb06</instanceId>
<hostName>10.0.9.21</hostName>
<app>ZUUL-SERVICE</app>
<ipAddr>10.0.9.21</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">4000</port>
<securePort enabled="false">443</securePort>
```

gateway와 service container들이 msa-network에 의해 각각 10.0.9.18,10.0.9.19, 10.0.9.21의 address를 부여 받은 것을 확인 할 수 있다. 이제 거의 다 온것 같다. cluster 외부에서 gateway로 request를 보내고(msa-ingress) 각 service container에 request가 잘 전달(msa-network) 되는지만 확인하면 끝이다.


```sh
sangmin@Mint-SM ~ $ curl -X GET 52.78.220.64:4000/api/story-service/story
[{"story_id":5,"message":"TEST5","id":"test5"},{"story_id":4,"message":"TEST4","id":"test4"},{"story_id":3,"message":"TEST3","id":"test3"},{"story_id":2,"message":"TEST2","id":"test2"},{"story_id":1,"message":"TEST1","id":"test1"}]
```

이제 load balancing을 확인하자

```sh
sangmin@Mint-SM ~ $ curl -X GET 52.78.220.64:4000/api/story-service/story/service/host
421678366c5d
sangmin@Mint-SM ~ $ curl -X GET 52.78.220.64:4000/api/story-service/story/service/host
f07ee0e2f97a
sangmin@Mint-SM ~ $ curl -X GET 52.78.220.64:4000/api/story-service/story/service/host
421678366c5d
sangmin@Mint-SM ~ $ curl -X GET 52.78.220.64:4000/api/story-service/story/service/host
f07ee0e2f97a
```

stroy/service/host는 host name을 출력하게끔 api를 만들어 놓았다. story-service가 두개의 container에서 running중 이므로 각각 다른 container id(host)를 response로 보내고 있다.

이제 됐다! 나머지 서비스에도 위 과정을 적용만 하면 끝이다. 

## result 

**node**
```sh
[centos@swarm ~]$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS      ENGINE VERSION
e212hjux4l2bwalxpr1lez38t     gateway             Ready               Active                                  18.03.1-ce
6umfi2ktjdpaed8uqvw2p5ym5     gateway-auth        Ready               Active                                  18.03.1-ce
n6954ci79xfxsrwsa78oeddzr     gateway-eureka      Ready               Active                                  18.03.1-ce
4o4ex6jdsc1g3a62xcvt7sja1 *   swarm               Ready               Active              Leader              18.03.1-ce
ycgswe39synhh3lycmxf5h91m     worker-node1        Ready               Active                                  18.03.1-ce
io2gxyuwvmuqpsrpqfjob7u5r     worker-node2        Ready               Active                                  18.03.1-ce
afy9sisaa0jnkn0ongfui9160     worker-node3        Ready               Active                                  18.03.1-ce
```
&nbsp

**labels**
```sh
docker node update --label-add role=gateway gateway
docker node update --label-add role=gateway gateway-auth
docker node update --label-add role=gateway gateway-eureka
docker node update --label-add role=worker worker-node1
docker node update --label-add role=worker worker-node2
docker node update --label-add role=worker worker-node3
```

&nbsp;

**service**
```sh
[centos@swarm ~]$ docker service create --name eureka --network msa-network --constraint 'node.hostname==gateway-eureka' --publish 8761:8761  phantasmicmeans/eureka-server:latest

[centos@swarm ~]$ docker service create --name story-service --network msa-network --constraint 'node.labels.role==worker' --replicas 3 --publish 8768:8768  phantasmicmeans/story-service:latest

[centos@swarm ~]$ docker service create --name notice-service --network msa-network --constraint 'node.labels.role==worker' --replicas 3 --publish 8763:8763  phantasmicmeans/notice-service:latest

[centos@swarm ~]$ docker service create --name gateway --network msa-network --constraint 'node.labels.role==gateway' --replicas 3 --publish 4000:4000  phantasmicmeans/api-gateway:latest

```
&nbsp;

**eureka**
```xml
	
<application>
<name>STORY-SERVICE</name>
<instance>
<instanceId>story-service:a60bb95c1af14a7bfaeb33f710cf9718</instanceId>
<hostName>10.0.9.60</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.0.9.60</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
</instance>
	
<instance>
<instanceId>story-service:0b7018766906fac77d63af6b6af0bc97</instanceId>
<hostName>10.0.9.62</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.0.9.62</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
</instance>
	
<instance>
<instanceId>story-service:0660987b106f9547100601e50e92d9dd</instanceId>
<hostName>10.0.9.61</hostName>
<app>STORY-SERVICE</app>
<ipAddr>10.0.9.61</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8768</port>
</instance>
</application>
	
<application>
<name>ZUUL-SERVICE</name>
<instance>
<instanceId>zuul-service:2de1ea248eb5b722333a2ace51d61f9f</instanceId>
<hostName>10.0.9.66</hostName>
<app>ZUUL-SERVICE</app>
<ipAddr>10.0.9.66</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">4000</port>
</instance>
	
<instance>
<instanceId>zuul-service:82b74cc65b01f8f8c40cefb1706fabdf</instanceId>
<hostName>10.0.9.65</hostName>
<app>ZUUL-SERVICE</app>
<ipAddr>10.0.9.65</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">4000</port>
</instance>
	
<instance>
<instanceId>zuul-service:405f6eb5e135cefb9a06cc4a466622b7</instanceId>
<hostName>10.0.9.64</hostName>
<app>ZUUL-SERVICE</app>
<ipAddr>10.0.9.64</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">4000</port>
</instance>
</application>
	
<application>
<name>NOTICE-SERVICE</name>
<instance>
<instanceId>notice-service:7897b1af268b9ccbce9f74cbffc05542</instanceId>
<hostName>10.0.9.80</hostName>
<app>NOTICE-SERVICE</app>
<ipAddr>10.0.9.80</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8763</port>
</instance>
	
<instance>
<instanceId>notice-service:47fb71521f02aebfc8c62a68e966b69e</instanceId>
<hostName>10.0.9.82</hostName>
<app>NOTICE-SERVICE</app>
<ipAddr>10.0.9.82</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8763</port>
</instance>
	
<instance>
<instanceId>notice-service:8c32c3b2884625845e87194f79c6d178</instanceId>
<hostName>10.0.9.81</hostName>
<app>NOTICE-SERVICE</app>
<ipAddr>10.0.9.81</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8763</port>
</instance>
</application>
</applications>
```
&nbsp;

board-service(node.js)와 board-service-sidecar는 기존에 하던 방법대로는 제한이 있어 앞으로 해 볼 예정이다. board-service가 spring boot application이면 그대로 진행하면 된다. 하지만 sidecar는 board-service가 띄워져 있어야만 연동이 된다. 따라서 board-service를 찾으려면 sidecar에 board-service의 health url을 입력해줘야 한다. 우리는 docker service create command를 이용해서 replica를 배포하고 있으므로 board-service의 url은 http://board-service:3000/~이여야만 된다.(기존에는 replica를 배포하지 않았으므로 board-service가 띄워진 server ipAddress이용해 연결했음)

이렇게 되면 board-service 또한 eureka에 의해 service discovery가 가능 하게끔 되거나(이 경우 npm으로 eureka에 등록해야함.), swarm cluster에 의한 service discovery가 이루어져야 한다. 

&nbsp;

**eureka dashboard**

![image](https://user-images.githubusercontent.com/20153890/42118698-258aea50-7c40-11e8-956e-58c79fba4d96.png)

&nbsp;
**hystrix dashboard**

![image](https://user-images.githubusercontent.com/20153890/42118725-68fb82f4-7c40-11e8-9d50-6e793f7bc24c.png)


# Conclusion

지금까지 spring cloud netflix & docker swarm을 활용한 msa prototype backend를 구축해 보았다. aws ec2에서 swarm cluster를 구성하긴 했지만, 사실상 물리적인 서버에 cluster를 구축함과 다를바 없었다.. 다음에는 swarm for aws 혹은 aws & kubernetes로 진행하여 좀 더 수월하게 진행해 보아야겠다.

**참고**

source code의 resource/application.yml의 eureka-server url 그리고 service들의 db server url은 각자 세팅 해줘야 한다!.

**notice table**

| Field       | Type        | Null | Key | Default | Extra          |
--------------|-------------|------|-----|---------|----------------|
| id          | int(11)     | NO   | PRI | NULL    | auto_increment |
| receiver_id | varchar(20) | YES  |     | NULL    |                |
| sender_id   | varchar(20) | YES  |     | NULL    |                |
| article_id  | int(11)     | YES  |     | NULL    |                |

**story table**

| Field    | Type         | Null | Key | Default | Extra          |
|----------|--------------|------|-----|---------|----------------|
| story_id | int(11)      | NO   | PRI | NULL    | auto_increment |
| ID       | varchar(20)  | NO   |     | NULL    |                |
| message  | varchar(300) | NO   |     | NULL    |                |

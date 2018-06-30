FROM openjdk:8-jdk-alpine
VOLUME /tmp
#ARG JAR_FILE
ADD ./target/api-gateway-0.0.1.jar app.jar
#ADD ${JAR_FILE} app.jar
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-Dspring.profiles.active=docker","-jar","/app.jar"]

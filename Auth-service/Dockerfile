FROM openjdk:8-jdk-alpine
VOLUME /tmp
#ARG JAR_FILE
ADD ./target/auth-service-0.0.1.jar app.jar

ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]



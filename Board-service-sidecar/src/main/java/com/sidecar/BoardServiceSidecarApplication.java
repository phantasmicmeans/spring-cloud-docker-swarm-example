package com.sidecar;

import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.netflix.sidecar.EnableSidecar;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Enumeration;
import java.util.stream.Collectors;
import java.net.Inet4Address;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.cloud.commons.util.InetUtils;
import org.springframework.cloud.netflix.eureka.EurekaInstanceConfigBean;
import org.springframework.context.annotation.Profile;
import org.springframework.context.annotation.Import;
import java.net.Inet4Address;



@SpringBootApplication
@EnableSidecar
@EnableEurekaClient
@EnableAutoConfiguration
@EnableCircuitBreaker
@CrossOrigin(origins="*")
public class BoardServiceSidecarApplication {

    private EurekaInstanceConfigBean eurekaInstanceConfig;

    private Logger logger = LoggerFactory.getLogger(this.getClass());


	public static void main(String[] args) {
		SpringApplication.run(BoardServiceSidecarApplication.class, args);
	}

  	@Bean
    @Primary
    @Autowired
    @Profile("docker")
	public EurekaInstanceConfigBean DockerSwarm_EurekaClient(InetUtils inetUtils)
	{


        try{
            eurekaInstanceConfig= new EurekaInstanceConfigBean(inetUtils);

		    final String HostName = System.getenv("HOSTNAME"); //container hostname 가져옴, container_id 일 것임.
            logger.info("HOSTNAME : " + HostName);
       
	
			Optional<NetworkInterface> net = Optional.of(NetworkInterface.getByName("eth2"));

            logger.info("Network instance inetaddress: " + net.get().getInetAddresses());
			logger.info("Network instance name: " + net.get().getName());
             
			Enumeration<InetAddress> inetAddress = net.get().getInetAddresses();
			
			InetAddress current = inetAddress.nextElement();
		    
            logger.info("Get Current Address : " + current.toString());
            
            String address = current.toString().split("/")[1];
			logger.info(" HostName : " + HostName);
			logger.info(" Address : " + address);
			
			eurekaInstanceConfig.setHostname(HostName);
            eurekaInstanceConfig.setPreferIpAddress(true);
			eurekaInstanceConfig.setIpAddress(address);
            eurekaInstanceConfig.setNonSecurePort(8766);
			
			logger.info("Eureka Config : "  + eurekaInstanceConfig.toString());

			return eurekaInstanceConfig;
			
			
		}catch(Exception e)
		{
			logger.info("EEEEEEEEEEEEEEERRRR");
            return null;
		}
		
	
	}


}

package com.story.rest;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.story.domain.Story;
import com.story.service.StoryService;

@CrossOrigin(origins ="*")
@RestController
public class StoryController {

	
	private final Logger logger = LoggerFactory.getLogger(this.getClass());
    @Autowired
    private DiscoveryClient discoveryClient;

    @FunctionalInterface
    interface Convert<F,T>{
    	T convert(F from);
    }
   
    private Convert<ServiceInstance, String> converter = (from) ->{
    	
    	return from.getHost() + ":" + from.getPort() +"/story";
   
    };
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
	@Value("${eureka.instance.instance-id}")
	String instance_id;
	
	@Autowired
	RestTemplate restTemplate;
	
	@Autowired
	StoryService storyService;


	@HystrixCommand(commandKey = "story-service", fallbackMethod = "getAllStoryFallback")
	@RequestMapping(value = "/story", method = RequestMethod.GET)
	public ResponseEntity<List<Story>> getAllStory()
	{
		try {
			return new ResponseEntity<List<Story>>
				(storyService.findAllStory().orElseThrow(() -> new NullPointerException()), HttpStatus.OK);
		}
		catch(NullPointerException e) {
			return new ResponseEntity<List<Story>>(HttpStatus.NOT_FOUND);
		}
	}

    public ResponseEntity<List<Story>>  getAllStoryFallback()
    {
        try{

        	final String serviceName="story-service";
        	
            List<String> Instances
                = this.discoveryClient.getInstances(serviceName)
                								.stream()
                									.filter((service) -> 
                                                    		!instance_id.equals(service.getServiceId()))
                									.map((service) -> converter.convert(service))
                									.collect(Collectors.toList());

            ResponseEntity <List<Story>> rest =
				    restTemplate.exchange(URI.create(Instances.get(0)), HttpMethod.GET,null, new ParameterizedTypeReference<List<Story>>() {});
            
            return new ResponseEntity<List<Story>>(rest.getBody(), HttpStatus.OK);

        }catch(Exception e)
        {
			e.printStackTrace();
        }
        
        return null;
    }


	@RequestMapping(value = "/story/{id}", method = RequestMethod.GET)
	public ResponseEntity<List<Story>> getStoryById(@PathVariable("id") final String ID)
	{
		
		try {
			
			return new ResponseEntity<List<Story>>(storyService.findStoryById(ID).orElseThrow(() -> new NullPointerException()),HttpStatus.OK);
			
		}catch(NullPointerException e) {
			
			return new ResponseEntity<List<Story>>(HttpStatus.NOT_FOUND);
		}
		
	}
	
	@RequestMapping(value = "/story", method = RequestMethod.POST)
	public ResponseEntity<Void> createStory(@RequestBody final Story story, final UriComponentsBuilder ucBuilder)
	{
		if(!storyService.saveStory(story)){ return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);}
		
		return new ResponseEntity<Void>(HttpStatus.CREATED);
	}
	

	@RequestMapping(value = "/story/{id}", method = RequestMethod.DELETE)
	public ResponseEntity<Void> deleteStory(@PathVariable("id") final String ID)
	{
		if(!storyService.deleteStory(ID)){ return new ResponseEntity<Void>(HttpStatus.NOT_FOUND); }

		return new ResponseEntity<Void>(HttpStatus.OK);
		
	}

    
    @HystrixCommand(commandKey="story-service", fallbackMethod = "getHostNameFallback")
    @RequestMapping(value = "/story/service/host", method = RequestMethod.GET)
    public String getHostName()
    {
        try{        
        	
           return System.getenv("HOSTNAME");

        }
        catch(Exception e)
        {
            return "Cannot find host ";
        }
    }
    public String getHostNameFallback()
    {

        return "Default Host";
    }

    @HystrixCommand(commandKey="story-service", fallbackMethod = "getServiceInstanceFallback")
    @RequestMapping(value = "/story/service/instance/{applicationName}", method = RequestMethod.GET)
    public List<ServiceInstance> serviceInstanceByApplicationName(@PathVariable String applicationName) {

        try{

            //Optional<List<ServiceInstance>> maybeInstance = Optional.of(this.discoveryClient.getInstances(applicationName));

            //return maybeInstance.get();
            logger.info(this.discoveryClient.getInstances(applicationName).toString());
            return this.discoveryClient.getInstances(applicationName);
        
        }catch(Exception e)
        {
            return null;
        }
    }

    public List<ServiceInstance> getServiceInstanceFallback(@PathVariable String applicationName)
    {
        return null;
    }

    @HystrixCommand(commandKey="story-service", fallbackMethod = "getServiceInfoFallback")
    @RequestMapping(value = "/story/service/info/{applicationName}", method = RequestMethod.GET)
    public String serviceInstance(@PathVariable String applicationName) {
        
        try{

            Optional <List<ServiceInstance>> maybeServiceInstance = Optional.of(this.discoveryClient.getInstances(applicationName));

            Function<String,String> makeResult = result -> result;

            ServiceInstance service = maybeServiceInstance.get().get(0);

            return makeResult.apply("ServiceID: " + service.getServiceId()+
                                    ", Host: " + service.getHost()+
                                    ", Port: " + Integer.toString(service.getPort()));

        }catch(Exception e)
        {
            return "Cannot Found Instance " + applicationName;
        }
    }
    
    public String getServiceInfoFallback(@PathVariable String applicationName)
    {
        return "Default Value";
    }
}


















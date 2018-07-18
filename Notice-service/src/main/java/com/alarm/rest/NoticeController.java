package com.alarm.rest;

import java.util.List;
import java.util.Optional;
import java.net.URI;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.alarm.domain.Notice;
import com.alarm.service.NoticeService;

import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;

import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;

@RestController
@CrossOrigin(origins="*")
public class NoticeController {

    @Autowired
    private DiscoveryClient discoveryClient;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
	@Value("${eureka.instance.instance-id}")
	String instance_id;
	
	@Autowired
	RestTemplate restTemplate;
	
	@Autowired
	private NoticeService noticeService;

	@FunctionalInterface
	interface Convert<F,T>{
		T convert(F from, String uri);
	}
	
	private Convert<ServiceInstance, String> converters = (from, uri) -> {
		
		return from.getHost() + ":" + from.getPort() + uri;
	};
	
	@HystrixCommand(commandKey="notice-service",fallbackMethod = "getAllNoticeFallback")
	@RequestMapping(value = "/notice", method=RequestMethod.GET)
	public ResponseEntity<List<Notice>> getAllNotice(){

		try {

			return new ResponseEntity<List<Notice>>
				(noticeService.findAllNotice().orElseThrow(() -> new NullPointerException()), HttpStatus.OK);
		}
		catch(NullPointerException e) {
			return new ResponseEntity<List<Notice>>(HttpStatus.NOT_FOUND);
		}
	
	}	

   	public ResponseEntity<List<Notice>>  getAllNoticeFallback()
    {
   		String uri = "/notice";
   		return CatchOtherInstanceFromEurekaRegistry(instance_id,uri);
        
    }


	@HystrixCommand(commandKey="notice-service",fallbackMethod = "getAllNoticeByReceiverIdFallback")
	@RequestMapping(value="/notice/{receiver_id}", method = RequestMethod.GET)
	public ResponseEntity<List<Notice>> getAllNoticeByReceiverId(@PathVariable("receiver_id") final String receiver_id)
	{
		
		try {
			
			return new ResponseEntity<List<Notice>>
				(noticeService.findAllNoticeByReceiverId(receiver_id).orElseThrow(() -> new NullPointerException()),HttpStatus.OK);
			
		}catch(NullPointerException e) {
			
			return new ResponseEntity<List<Notice>>(HttpStatus.NOT_FOUND);
		}

	}

    public ResponseEntity<List<Notice>> getAllNoticeByReceiverIdFallback(@PathVariable("receiver_id") final String receiver_id)
    {
    	String uri = "/notice/"+receiver_id;
   		return CatchOtherInstanceFromEurekaRegistry(instance_id, uri);

    }

	
	//receiver_id를 인자로 최근 10개 notice 출
	@HystrixCommand(commandKey="notice-service",fallbackMethod = "getLatestNoticeByReceiverIdFallback")
	@RequestMapping(value="/notice/latest/{receiver_id}",method = RequestMethod.GET)
	public ResponseEntity<List<Notice>> getLastNoticeByReceiverId(@PathVariable("receiver_id") final String receiver_id)
	{

		try {
			
			return new ResponseEntity<List<Notice>>
				(noticeService.findLatestNoticeByReceiverId(receiver_id).orElseThrow(() -> new NullPointerException()),HttpStatus.OK);
			
		}catch(NullPointerException e) {
			
			return new ResponseEntity<List<Notice>>(HttpStatus.NOT_FOUND);
		}
		
	}
    public ResponseEntity <List<Notice>> getLatestNoticeByReceiverIdFallback(@PathVariable("receiver_id") final String receiver_id)
    {
    	String uri = "/notice/"+receiver_id;
   		return CatchOtherInstanceFromEurekaRegistry(instance_id, uri);    
   	}


	//receiver_id와 현재 index를 인자로 이 10개 notice 출력
	@RequestMapping(value="/notice/previous/{receiver_id}/{id}",method = RequestMethod.GET)
	public ResponseEntity<List<Notice>> getPreviousNoticeByReceiverId(@PathVariable("receiver_id") final String receiver_id, @PathVariable("id") final int id)
	{

		try {
			
			return new ResponseEntity<List<Notice>>
				(noticeService.findPreviousNoticeByReceiverId(receiver_id, id).orElseThrow(() -> new NullPointerException()),HttpStatus.OK);
			
		}catch(NullPointerException e) {
			
			return new ResponseEntity<List<Notice>>(HttpStatus.NOT_FOUND);
		}
	}
	
	@RequestMapping(value="/notice", method = RequestMethod.POST)
	public ResponseEntity<Void> createNotice(@RequestBody final Notice notice, final UriComponentsBuilder ucBuilder){
		
		if(!noticeService.saveNotice(notice)) { return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST); }
		
		return new ResponseEntity<Void>(HttpStatus.CREATED);

	}
	
    @HystrixCommand(commandKey="notice-service", fallbackMethod = "getHostNameFallback")
    @RequestMapping("/notice/service/host")
    public String serviceContainer()
    {
        try{

            return System.getenv("HOSTNAME");

        }catch(Exception e)
        {
            return "Cannot found host";
        }

    }
    public String getHostNameFallback()
    {
        return "Hystrix Circuit Open.. Cannot find HostName";
    }


    @HystrixCommand(commandKey="notice-service", fallbackMethod = "getServiceInstanceFallback")
    @RequestMapping(value = "/notice/service/instance/{applicationName}", method = RequestMethod.GET)
    public List<ServiceInstance> serviceInstanceByApplicationName(@PathVariable String applicationName) {

        try{

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

    @HystrixCommand(commandKey="notice-service", fallbackMethod = "getServiceInfoFallback")
    @RequestMapping(value = "/notice/service/info/{applicationName}", method = RequestMethod.GET)
    public String serviceInstance(@PathVariable String applicationName) {
        
        try{

            Optional <List<ServiceInstance>> maybeServiceInstance = Optional.of(this.discoveryClient.getInstances(applicationName));


            ServiceInstance service = maybeServiceInstance.get().get(0);

            return "ServiceID: " + service.getServiceId()+
            		", Host: " + service.getHost()+
            		", Port: " + Integer.toString(service.getPort());

        }catch(Exception e)
        {
            return "Hystrix Circuit Open.. Cannot find "+applicationName;
        }
    }
    
    public String getServiceInfoFallback(@PathVariable String applicationName)
    {
        return "Hystrix Circuit Open.. Cannot find "+applicationName;
    }
    
    
 	public ResponseEntity<List<Notice>> CatchOtherInstanceFromEurekaRegistry(String instance, String uri)
    {
        try{

            Optional<List<ServiceInstance>> maybeServiceInstance 
                = Optional.of(this.discoveryClient.getInstances(instance));
        
            List<String> Instances
                = maybeServiceInstance.get().stream()
                                            .filter(service -> 
                                                    !instance_id.equals(service.getServiceId()))
        									.map((service) -> converters.convert(service, uri))
                                            .collect(Collectors.toList());

            ResponseEntity <List<Notice>> rest =
 				    restTemplate.exchange(URI.create(Instances.get(0)), HttpMethod.GET,null, new ParameterizedTypeReference<List<Notice>>() {});

            return new ResponseEntity<List<Notice>>(rest.getBody(), HttpStatus.OK);

        }catch(Exception e)
        {
            return new ResponseEntity<List<Notice>>(HttpStatus.NOT_FOUND);
        }
    }

}



























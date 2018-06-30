package com.alarm.rest;

import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import java.net.URI;
import java.util.stream.Collectors;
import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.net.InetAddress;

import com.alarm.domain.Notice;
import com.alarm.service.NoticeService;

import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import java.util.Arrays;
import org.springframework.context.annotation.Bean;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import com.netflix.appinfo.InstanceInfo;
import java.util.function.Function;
@RestController
@CrossOrigin(origins="*")
public class NoticeController {

	private final Logger logger = LoggerFactory.getLogger(this.getClass());
    public static List<Notice> Temp;

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

	@HystrixCommand(commandKey="notice-service",fallbackMethod = "getAllNoticeFallback")
	@RequestMapping(value = "/notice", method=RequestMethod.GET)
	public ResponseEntity<List<Notice>> getAllNotice(){
    
        try{

		    Optional<List<Notice>> maybeAllNotice = Optional.ofNullable(noticeService.findAllNotice());
		
		    return new ResponseEntity<List<Notice>>(maybeAllNotice.get(), HttpStatus.OK);
        }catch(Exception e)
        {
            return new ResponseEntity<List<Notice>>(HttpStatus.NOT_FOUND);

        }
	
	}	

   	public ResponseEntity<List<Notice>>  getAllNoticeFallback()
    {
        try{

            Optional<List<ServiceInstance>> maybeServiceInstance 
                = Optional.of(this.discoveryClient.getInstances("notice-service"));
        
            List<ServiceInstance> Instance 
                = maybeServiceInstance.get().stream()
                                            .filter(service -> 
                                                    !instance_id.equals(service.getServiceId()))
                                            .collect(Collectors.toList());

            ServiceInstance service = Instance.get(0);
        
            URI uri = URI.create(service.getHost() + ":" + service.getPort() + "/notice");

            ResponseEntity <List<Notice>> rest =
				    restTemplate.exchange(uri, HttpMethod.GET,null, new ParameterizedTypeReference<List<Notice>>() {});
            
            return new ResponseEntity<List<Notice>>(rest.getBody(), HttpStatus.OK);

        }catch(Exception e)
        {
			e.printStackTrace();
        }
        
        return null;
    }


	@HystrixCommand(commandKey="notice-service",fallbackMethod = "getAllNoticeByReceiverIdFallback")
	@RequestMapping(value="/notice/{receiver_id}", method = RequestMethod.GET)
	public ResponseEntity<List<Notice>> getAllNoticeByReceiverId(@PathVariable("receiver_id") final String receiver_id)
	{

		try {
			
			Optional<List<Notice>> maybeSelectedNotice = Optional.of(noticeService.findAllNoticeByReceiverId(receiver_id));
		
			return new ResponseEntity<List<Notice>>(maybeSelectedNotice.get(), HttpStatus.OK);
			
		}catch(Exception e)
		{
			return new ResponseEntity<List<Notice>>(HttpStatus.NOT_FOUND);
		}
	

	}

    public ResponseEntity<List<Notice>> getAllNoticeByReceiverIdFallback()
    {
        return null;
    }

	

	//receiver_id를 인자로 최근 10개 notice 출
	@HystrixCommand(commandKey="notice-service",fallbackMethod = "getLatestNoticeByReceiverIdFallback")
	@RequestMapping(value="/notice/latest/{receiver_id}",method = RequestMethod.GET)
	public ResponseEntity<List<Notice>> getLastNoticeByReceiverId(@PathVariable("receiver_id") final String receiver_id)
	{

		try {
			
			Optional<List<Notice>>maybeLastsNotice = Optional.of(noticeService.findLatestNoticeByReceiverId(receiver_id));
			
			return new ResponseEntity<List<Notice>>(maybeLastsNotice.get() , HttpStatus.OK);
			
		}catch(Exception e)
		{
			return new ResponseEntity<List<Notice>>(HttpStatus.NOT_FOUND);

		}
	
	}
    public ResponseEntity <List<Notice>> getLatestNoticeByReceiverIdFallback()
    {
        return null;
    }


	//receiver_id와 현재 index를 인자로 이 10개 notice 출력
	@RequestMapping(value="/notice/previous/{receiver_id}/{id}",method = RequestMethod.GET)
	public ResponseEntity<List<Notice>> getPreviousNoticeByReceiverId(@PathVariable("receiver_id") final String receiver_id, @PathVariable("id") final int id)
	{
		
		try {		
			
			Optional<List<Notice>> maybePreviousNotice = Optional.of(noticeService.findPreviousNoticeByReceiverId(receiver_id, id));
			
			return new ResponseEntity<List<Notice>>(maybePreviousNotice.get(), HttpStatus.OK);
			
		}catch(Exception e)
		{
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

        return "Default Host";
    }


    @HystrixCommand(commandKey="notice-service", fallbackMethod = "getServiceInstanceFallback")
    @RequestMapping(value = "/notice/service/instance/{applicationName}", method = RequestMethod.GET)
    public List<ServiceInstance> serviceInstanceByApplicationName(@PathVariable String applicationName) {

        try{

            Optional<List<ServiceInstance>> maybeInstance = Optional.of(this.discoveryClient.getInstances(applicationName));

            return maybeInstance.get();
        
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



























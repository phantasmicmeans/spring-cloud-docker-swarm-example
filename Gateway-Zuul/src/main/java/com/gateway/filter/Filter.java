package com.gateway.filter;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Set;
import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import org.springframework.stereotype.Component;

@Component
public class Filter extends ZuulFilter {

	private static Logger log = LoggerFactory.getLogger(Filter.class);
	
	
	  @Override
	  public String filterType() {
	    return "pre";
	  }

	  @Override
	  public int filterOrder() {
	    return 1000;
	  }

	  @Override
	  public boolean shouldFilter() {
	    return true;
	  }
	  
	  @Override
	  public Object run()
	  {
		  RequestContext ctx = RequestContext.getCurrentContext();
          Set<String> headers = (Set<String>)ctx.get("ignoredHeaders");
          log.info("headers : ", headers);

          headers.remove("authorization");

          log.info("sdfsdfd");
		  HttpServletRequest request = ctx.getRequest();
		  
		  return null;
		  
	  }
}

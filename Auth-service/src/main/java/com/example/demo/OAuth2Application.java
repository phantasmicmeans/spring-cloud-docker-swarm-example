package com.example.demo;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.authserver.AuthorizationServerProperties;
import org.springframework.boot.autoconfigure.security.oauth2.authserver.OAuth2AuthorizationServerConfiguration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableAuthorizationServer;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.ClientDetailsService;
import org.springframework.security.oauth2.provider.client.BaseClientDetails;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;
import org.springframework.security.oauth2.provider.token.store.JwtTokenStore;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import com.example.demo.service.CustomedUserDetailsService;


@SpringBootApplication
@EnableResourceServer
@EnableDiscoveryClient
@CrossOrigin(origins = "*")
public class OAuth2Application {

    public static void main(String[] args) {
        SpringApplication.run(OAuth2Application.class, args);
    }
    
    @Configuration 
    @EnableWebSecurity
    protected static class webSecurityConfig extends WebSecurityConfigurerAdapter{
    	
    	@Autowired
    	private CustomedUserDetailsService userDetailsService;
    	
    	@Override
    	public void configure(WebSecurity web) throws Exception {
    	    web.ignoring().antMatchers("/users/signup");
    	}
    	
    	@Override
    	protected void configure(HttpSecurity http) throws Exception{
    		http.authorizeRequests()
    			.antMatchers("/users/signup").permitAll()
    			.anyRequest().authenticated()
    		.and()
    			.csrf().disable();	
    	}
    	
    	@Override 
    	protected void configure(AuthenticationManagerBuilder auth) throws Exception{
    		auth.userDetailsService(userDetailsService)
    			.passwordEncoder(new BCryptPasswordEncoder());
    	}
    	
    	@Override
    	@Bean
    	public AuthenticationManager authenticationManagerBean() throws Exception{
    		return super.authenticationManagerBean();
    	}
    	
    }
    
    @EnableAuthorizationServer
    @Configuration
    protected static class OAuth2AuthorizationServerConfig extends AuthorizationServerConfigurerAdapter {
    	
    	@Autowired
    	@Qualifier("authenticationManagerBean")
    	private AuthenticationManager authenticationManager;
    	
    	@Autowired
    	private CustomedUserDetailsService userDetailsService;
        
    	@Override
    	public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
    		endpoints.tokenStore(tokenStore())
    			.accessTokenConverter(jwtAccessTokenConverter())
    			.authenticationManager(authenticationManager)
    			.userDetailsService(userDetailsService);
    	}
    	
    	@Override
    	public void configure(AuthorizationServerSecurityConfigurer oauthServer) throws Exception{
    		oauthServer
    			.tokenKeyAccess("permitAll()")
    			.checkTokenAccess("isAuthenticated()");
    	}
    	
        @Bean
        public TokenStore tokenStore() {
            return new JwtTokenStore(jwtAccessTokenConverter());
        }

        @Bean
        public JwtAccessTokenConverter jwtAccessTokenConverter() {
        	final JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        	converter.setSigningKey("123");
            return converter;
        }
        
        @Bean 
        public FilterRegistrationBean corsFilter() {
        	UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            CorsConfiguration config = new CorsConfiguration();
            config.setAllowCredentials(true);
            config.addAllowedOrigin("*");
            config.addAllowedHeader("*");
            config.addAllowedMethod("*");
            source.registerCorsConfiguration("/**", config);
            FilterRegistrationBean bean = new FilterRegistrationBean(new CorsFilter(source));
            bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
            return bean;
        }
        
        
//        @Bean
//        @Primary
//        public JdbcClientDetailsService jdbcClientDetailsService(DataSource dataSource) {
//        	return new JdbcClientDetailsService(dataSource);
//        }
        
        /*
        @Bean
        @Primary
        public DefaultTokenServices tokenServices() {
        	DefaultTokenServices defaultTokenServices = new DefaultTokenServices();
        	defaultTokenServices.setTokenStore(tokenStore());
        	defaultTokenServices.setSupportRefreshToken(true);
        	return defaultTokenServices;
        }
        */
        

    }
    
    @EnableAuthorizationServer
    @Configuration
    protected static class JwtOAuth2AuthorizationServerConfiguration extends OAuth2AuthorizationServerConfiguration {

        private final JwtAccessTokenConverter jwtAccessTokenConverter;
        public JwtOAuth2AuthorizationServerConfiguration(BaseClientDetails details,
                                                         AuthenticationManager authenticationManager,
                                                         ObjectProvider<TokenStore> tokenStoreProvider,
                                                         AuthorizationServerProperties properties,
                                                         JwtAccessTokenConverter jwtAccessTokenConverter
                                                        ,ClientDetailsService clientDetailsService
                                                         ) {
            super(details, authenticationManager, tokenStoreProvider, properties);
            this.jwtAccessTokenConverter = jwtAccessTokenConverter;
        }

        
        
        @Override
        public void configure(AuthorizationServerEndpointsConfigurer endpoints)
                throws Exception {
            super.configure(endpoints);
            endpoints.accessTokenConverter(jwtAccessTokenConverter);
        }
        
       
        @Override 
        public void configure(ClientDetailsServiceConfigurer clients) throws Exception{
        	//clients.withClientDetails(clientDetailsService);
        	clients.inMemory()
        		.withClient("apigateway")
        		.secret("apigateway12")
        		.authorizedGrantTypes("authorization_code", "password", "client_credentials", "implicit", "refresh_token")
        		.authorities("ROLE_MY_CLIENT")
        		.scopes("read", "write")
        		.accessTokenValiditySeconds(60*60*4)
        		.refreshTokenValiditySeconds(60*60*24*120);
        
      
        	
        	
        }
     

        
    }
}

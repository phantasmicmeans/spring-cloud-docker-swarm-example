package com.example.demo.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.domain.Member_role;
import com.example.demo.repository.MemberRepository;

@Service
public class CustomedUserDetailsService implements UserDetailsService {
	
	@Autowired
	private MemberRepository repository;
	
	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException{
		Member_role member = repository.findOne(username);
		
		if(member == null) {
			throw new UsernameNotFoundException(username);
		}
		
		return member;
	}
}
